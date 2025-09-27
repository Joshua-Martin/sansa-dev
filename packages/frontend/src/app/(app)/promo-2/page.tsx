'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { FileText, Compass, Zap } from 'lucide-react';
import DotsBg from '@/components/custom/dots-bg';

/**
 * A two-dimensional point in the SVG coordinate system.
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Options to control the timing of the path animation.
 */
interface PathAnimationOptions {
  /**
   * Total duration in milliseconds for the forward leg.
   * Ignored if `speedPxPerSec` is provided.
   */
  forwardMs?: number;
  /**
   * Total duration in milliseconds for the reverse leg.
   * Ignored if `reverseSpeedPxPerSec` or `speedPxPerSec` is provided.
   */
  reverseMs?: number;
  /** Pause in milliseconds after forward and after reverse legs. */
  pauseMs: number;
  /** Constant forward speed in pixels per second for all paths. */
  speedPxPerSec?: number;
  /** Constant reverse speed in pixels per second for all paths. Defaults to `speedPxPerSec`. */
  reverseSpeedPxPerSec?: number;
}

/**
 * Tunable connector geometry.
 */
const CONNECTOR_SPLIT_FRACTION = 0.5; // 20% of horizontal distance before first turn
const CONNECTOR_ARC_RADIUS_PX = 12; // quarter-arc radius (px) for rounded corners
const CONNECTOR_MIN_RADIUS_PX = 6; // minimum radius safeguard when fraction is used
const CONNECTOR_STROKE_WIDTH = 3; // default stroke width for provider connectors
const CONNECTOR_STROKE_WIDTH_MAIN = 3; // stroke width for SaaS->Product main line

// Colors for inactive vs active (animated) paths
const PATH_STROKE_INACTIVE = 'hsl(var(--color-path-inactive))'; // gray-300
const PATH_STROKE_ACTIVE = 'hsl(var(--color-path-active))'; // primary color variant

// Benchmark Product Gap
const BENCHMARK_PRODUCT_GAP = 60;

// Router to Benchmarks Path Position Fraction
const ROUTER_BENCHMARK_PATH_FRACTION = 1/4;

/**
 * Build a rounded orthogonal path from a start to an end point using two 90° corner arcs.
 *
 * The path is constructed as mostly straight segments with two quarter-circle arcs:
 * - Horizontal from `start` to a split x-position (20% by default)
 * - Arc to change to vertical travel toward `end.y`
 * - Vertical to align with `end.y`
 * - Arc to change back to horizontal
 * - Horizontal straight into `end`
 *
 * Radii are derived from a fraction of the horizontal distance (5% by default) and
 * are clamped to fit within the available vertical distance so arcs never overlap.
 *
 * @param start - Starting point of the connector.
 * @param end - Ending point of the connector.
 * @param options - Optional tuning parameters.
 * @param options.splitFraction - Fraction of horizontal distance before first turn (default 0.2).
 * @param options.radiusPx - Explicit corner radius in pixels. If provided, overrides fraction.
 * @param options.radiusFraction - Corner radius as a fraction of horizontal distance (default 0.05).
 * @param options.minRadius - Minimum absolute radius in pixels (default 6).
 * @returns SVG path data string.
 */
function buildRoundedConnectorPath(
  start: Point,
  end: Point,
  options?: { splitFraction?: number; radiusPx?: number; radiusFraction?: number; minRadius?: number }
): string {
  const splitFraction = options?.splitFraction ?? 0.2;
  const radiusFraction = options?.radiusFraction ?? 0.05;
  const minRadius = options?.minRadius ?? CONNECTOR_MIN_RADIUS_PX;

  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // Straight shot if horizontally aligned (allow tiny tolerance)
  if (Math.abs(dy) <= 1) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  // Guard against zero or negative horizontal distance
  const safeDx = Math.max(Math.abs(dx), 1);
  const directionY = Math.sign(dy);

  const splitX = start.x + splitFraction * dx;

  // Radius based on horizontal distance, clamped by vertical space and minimum radius
  const fractionRadius = Math.max(minRadius, Math.abs(safeDx * radiusFraction));
  const proposedRadius = options?.radiusPx ?? fractionRadius;
  const maxRadiusFromVertical = Math.max(2, Math.abs(dy) / 2);
  const maxRadiusFromGeometry = Math.max(1, Math.abs(splitX - start.x) - 1);
  const r = Math.max(1, Math.min(proposedRadius, maxRadiusFromVertical, maxRadiusFromGeometry));

  const sweepToVertical = directionY > 0 ? 1 : 0; // down = clockwise(1), up = counterclockwise(0)
  const sweepToHorizontal = directionY > 0 ? 0 : 1; // opposite to complete the 90° back to horizontal

  const xBeforeCorner = splitX - r;
  const firstCornerEndX = splitX;
  const firstCornerEndY = start.y + directionY * r;
  const verticalEndY = end.y - directionY * r;
  const secondCornerEndX = splitX + r;
  const secondCornerEndY = end.y;

  return [
    `M ${start.x} ${start.y}`,
    // Horizontal to split minus radius to leave room for the corner
    `L ${xBeforeCorner} ${start.y}`,
    // Quarter-arc into vertical travel
    `A ${r} ${r} 0 0 ${sweepToVertical} ${firstCornerEndX} ${firstCornerEndY}`,
    // Vertical segment toward end.y
    `L ${splitX} ${verticalEndY}`,
    // Quarter-arc back to horizontal
    `A ${r} ${r} 0 0 ${sweepToHorizontal} ${secondCornerEndX} ${secondCornerEndY}`,
    // Straight into the provider
    `L ${end.x} ${end.y}`,
  ].join(' ');
}

/**
 * Hook that animates a single dot along a list of SVG paths in sequence.
 * The dot moves forward from the start of each path to the end, pauses, then
 * moves in reverse back to the start, pauses, and proceeds to the next path.
 * The animation loops indefinitely when enabled.
 *
 * @param pathRefs - Mutable ref containing the list of `SVGPathElement` nodes in the intended order.
 * @param options - Timing controls for forward, reverse, and pauses.
 * @param isEnabled - When false, animation suspends and the dot is hidden.
 * @returns Current active path index and current dot position (or null if idle).
 */
function useSequentialPathAnimation(
  pathRefs: React.MutableRefObject<Array<SVGPathElement | null>>,
  options: PathAnimationOptions,
  isEnabled: boolean
): { activeIndex: number | null; position: Point | null } {
  const { forwardMs, reverseMs, pauseMs, speedPxPerSec, reverseSpeedPxPerSec } = options;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [position, setPosition] = useState<Point | null>(null);

  const phaseRef = useRef<'forward' | 'pauseAfterForward' | 'reverse' | 'pauseAfterReverse'>('forward');
  const phaseStartRef = useRef<number>(0);

  // Keep local copies of timings in refs to avoid restarting effect when options are stable objects
  const forwardMsRef = useRef<number | undefined>(forwardMs);
  const reverseMsRef = useRef<number | undefined>(reverseMs);
  const pauseMsRef = useRef<number>(pauseMs);
  const speedRef = useRef<number | undefined>(speedPxPerSec);
  const reverseSpeedRef = useRef<number | undefined>(reverseSpeedPxPerSec ?? speedPxPerSec);
  useEffect(() => {
    forwardMsRef.current = forwardMs;
    reverseMsRef.current = reverseMs;
    pauseMsRef.current = pauseMs;
    speedRef.current = speedPxPerSec;
    reverseSpeedRef.current = reverseSpeedPxPerSec ?? speedPxPerSec;
  }, [forwardMs, reverseMs, pauseMs, speedPxPerSec, reverseSpeedPxPerSec]);

  useEffect(() => {
    let rafId: number | null = null;

    const tick = (now: number) => {
      const validPaths = pathRefs.current.filter((p): p is SVGPathElement => !!p);
      const total = validPaths.length;

      if (!isEnabled || total === 0) {
        setPosition(null);
        rafId = requestAnimationFrame(tick);
        return;
      }

      // Initialize active index if needed
      if (activeIndex === null || activeIndex >= total) {
        setActiveIndex(0);
        phaseRef.current = 'forward';
        phaseStartRef.current = now;
        rafId = requestAnimationFrame(tick);
        return;
      }

      const path = validPaths[activeIndex];
      const length = path.getTotalLength();
      const phase = phaseRef.current;
      const phaseElapsed = now - phaseStartRef.current;

      if (phase === 'forward') {
        const forwardDurationMs = (() => {
          if (speedRef.current && speedRef.current > 0) {
            return (length / speedRef.current) * 1000;
          }
          return Math.max(1, forwardMsRef.current ?? 1000);
        })();
        const t = Math.max(0, Math.min(1, phaseElapsed / forwardDurationMs));
        const pt = path.getPointAtLength(t * length);
        setPosition({ x: pt.x, y: pt.y });
        if (t >= 1) {
          phaseRef.current = 'pauseAfterForward';
          phaseStartRef.current = now;
        }
      } else if (phase === 'pauseAfterForward') {
        setPosition((prev) => prev);
        if (phaseElapsed >= pauseMsRef.current) {
          phaseRef.current = 'reverse';
          phaseStartRef.current = now;
        }
      } else if (phase === 'reverse') {
        const reverseDurationMs = (() => {
          const rSpeed = reverseSpeedRef.current;
          if (rSpeed && rSpeed > 0) {
            return (length / rSpeed) * 1000;
          }
          return Math.max(1, reverseMsRef.current ?? forwardMsRef.current ?? 1000);
        })();
        const t = Math.max(0, Math.min(1, phaseElapsed / reverseDurationMs));
        const pt = path.getPointAtLength((1 - t) * length);
        setPosition({ x: pt.x, y: pt.y });
        if (t >= 1) {
          phaseRef.current = 'pauseAfterReverse';
          phaseStartRef.current = now;
        }
      } else if (phase === 'pauseAfterReverse') {
        setPosition((prev) => prev);
        if (phaseElapsed >= pauseMsRef.current) {
          const next = (activeIndex + 1) % total;
          setActiveIndex(next);
          phaseRef.current = 'forward';
          phaseStartRef.current = now;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [activeIndex, isEnabled, pathRefs]);

  // Reset state when disabling
  useEffect(() => {
    if (!isEnabled) {
      setActiveIndex(null);
      setPosition(null);
    }
  }, [isEnabled]);

  return { activeIndex, position };
}

/**
 * System Architecture Diagram - StackOne Integration Layer
 * Visual representation of B2B SaaS integration with external services
 */
const Promo2Page: React.FC = () => {
  // Root/sizing
  const rootRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  // Row container to anchor absolute positioning
  const rowRef = useRef<HTMLDivElement | null>(null);
  // Anchors
  const saasRef = useRef<HTMLDivElement | null>(null);
  const productRef = useRef<HTMLDivElement | null>(null);
  const apiRouterRef = useRef<HTMLDivElement | null>(null);
  const providerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const benchmarksRef = useRef<HTMLDivElement | null>(null);
  // Specific feature refs for alignment
  const unifiedRef = useRef<HTMLDivElement | null>(null);
  const classifierRef = useRef<HTMLDivElement | null>(null);
  // Column wrappers for absolute placement
  const saasColumnRef = useRef<HTMLDivElement | null>(null);
  const providersColumnRef = useRef<HTMLDivElement | null>(null);

  const [svgSize, setSvgSize] = useState<{ width: number; height: number }>({ width: 1200, height: 800 });
  const [productRightCenter, setProductRightCenter] = useState<Point | null>(null);
  const [providerCenters, setProviderCenters] = useState<Array<Point>>([]);
  const [saasToProductLine, setSaasToProductLine] = useState<string | null>(null);
  const [productWrapperHeight, setProductWrapperHeight] = useState<number | null>(null);
  const [benchmarksHeight, setBenchmarksHeight] = useState<number | null>(null);
  const [totalWrapperHeight, setTotalWrapperHeight] = useState<number | null>(null);
  const [routerToBenchmarksPaths, setRouterToBenchmarksPaths] = useState<Array<string>>([]);
  const [zapPositions, setZapPositions] = useState<Array<Point>>([]);

  // Absolute top offsets (px) within the row for each column
  const [centerTop, setCenterTop] = useState<number>(0);
  const [providersTop, setProvidersTop] = useState<number>(0);
  const [saasTop, setSaasTop] = useState<number>(0);

  // SVG path element refs in the order we want to animate them
  const animatedPathRefs = useRef<Array<SVGPathElement | null>>([]);
  // Whether the animation loop is active
  const [animatePaths] = useState<boolean>(true);

  /** Measure the container and keep the SVG viewBox in sync with CSS pixels. */
  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const resize = () => {
      const rect = rootRef.current!.getBoundingClientRect();
      setSvgSize({ width: Math.max(1, Math.round(rect.width)), height: Math.max(1, Math.round(rect.height)) });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

  /** Compute precise midpoints for product and providers + SaaS to product straight line. */
  useEffect(() => {
    const compute = () => {
      if (!rootRef.current) return;
      const rootRect = rootRef.current.getBoundingClientRect();

      // Product center: right midpoint
      if (productRef.current) {
        const pr = productRef.current.getBoundingClientRect();
        const rightX = pr.right - rootRect.left;
        const midY = pr.top - rootRect.top + pr.height / 2;
        setProductRightCenter({ x: rightX, y: midY });
        setProductWrapperHeight(Math.round(pr.height));
      }

      // Benchmarks height
      if (benchmarksRef.current) {
        const br = benchmarksRef.current.getBoundingClientRect();
        setBenchmarksHeight(Math.round(br.height));
      }


      // Provider endpoints at left edge center
      const centers: Array<Point> = [];
      providerRefs.current.forEach((el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        centers.push({ x: r.left - rootRect.left, y: r.top - rootRect.top + r.height / 2 });
      });
      setProviderCenters(centers);

      // SaaS to Product straight line across the PRODUCT mid Y
      if (saasRef.current && productRef.current) {
        const sr = saasRef.current.getBoundingClientRect();
        const pr = productRef.current.getBoundingClientRect();
        const y = pr.top - rootRect.top + pr.height / 2;
        const startX = sr.right - rootRect.left;
        const endX = pr.left - rootRect.left;
        setSaasToProductLine(`M ${startX} ${y} L ${endX} ${y}`);
      }

      // API Router to Benchmarks vertical paths: originate centered on Unified APIs
      if (apiRouterRef.current && benchmarksRef.current && productRef.current) {
        const apiRect = apiRouterRef.current.getBoundingClientRect();
        const benchRect = benchmarksRef.current.getBoundingClientRect();
        const prodRect = productRef.current.getBoundingClientRect();

        // Calculate positions relative to root - account for parent padding
        const apiParent = apiRouterRef.current.parentElement?.parentElement; // Get the p-6 div
        const apiBottomY = apiParent ? (apiParent.getBoundingClientRect().bottom - rootRect.top) : (apiRect.bottom - rootRect.top);
        const benchTopY = benchRect.top - rootRect.top;

        // Prefer Unified APIs center X if available; otherwise fall back to fraction-based positions
        let leftPathX: number;
        let rightPathX: number;
        if (unifiedRef.current) {
          const unifiedRect = unifiedRef.current.getBoundingClientRect();
          const unifiedCenterX = unifiedRect.left - rootRect.left + unifiedRect.width / 2;
          leftPathX = unifiedCenterX;
          rightPathX = unifiedCenterX;
        } else {
          const containerWidth = prodRect.width;
          leftPathX = prodRect.left - rootRect.left + containerWidth * ROUTER_BENCHMARK_PATH_FRACTION;
          rightPathX = prodRect.left - rootRect.left + containerWidth * (1 - ROUTER_BENCHMARK_PATH_FRACTION);
        }

        // Create two vertical paths (may overlap if centered on Unified APIs)
        const leftPath = `M ${leftPathX} ${apiBottomY} L ${leftPathX} ${benchTopY}`;
        const rightPath = `M ${rightPathX} ${apiBottomY} L ${rightPathX} ${benchTopY}`;

        setRouterToBenchmarksPaths([leftPath, rightPath]);
      }

      // Calculate zap positions at path intersections
      const zapPos: Array<Point> = [];

      // SaaS to Product intersections
      if (saasRef.current && productRef.current) {
        const sr = saasRef.current.getBoundingClientRect();
        const pr = productRef.current.getBoundingClientRect();
        const midY = pr.top - rootRect.top + pr.height / 2;

        // SaaS right edge
        zapPos.push({ x: sr.right - rootRect.left, y: midY });
        // Product left edge
        zapPos.push({ x: pr.left - rootRect.left, y: midY });
      }

      // Product to Provider intersections
      if (productRef.current && providerRefs.current.length > 0) {
        const pr = productRef.current.getBoundingClientRect();
        const productRightX = pr.right - rootRect.left;
        const productMidY = pr.top - rootRect.top + pr.height / 2;

        // Product right edge (where all provider paths start)
        zapPos.push({ x: productRightX, y: productMidY });

        // Each provider's left edge (where provider paths end)
        providerRefs.current.forEach((el) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          zapPos.push({ x: r.left - rootRect.left, y: r.top - rootRect.top + r.height / 2 });
        });
      }

      // API Router to Benchmarks intersections
      if (apiRouterRef.current && benchmarksRef.current && productRef.current) {
        const apiRect = apiRouterRef.current.getBoundingClientRect();
        const benchRect = benchmarksRef.current.getBoundingClientRect();
        const prodRect = productRef.current.getBoundingClientRect();

        // API Router bottom (where paths start) - need to account for parent padding
        // The apiRouterRef is inside a div with p-6 padding, so we need the parent's bottom
        const apiParent = apiRouterRef.current.parentElement?.parentElement; // Get the p-6 div
        const apiBottomY = apiParent ? (apiParent.getBoundingClientRect().bottom - rootRect.top) : (apiRect.bottom - rootRect.top);
        let leftPathX: number;
        let rightPathX: number;
        if (unifiedRef.current) {
          const unifiedRect = unifiedRef.current.getBoundingClientRect();
          const unifiedCenterX = unifiedRect.left - rootRect.left + unifiedRect.width / 2;
          leftPathX = unifiedCenterX;
          rightPathX = unifiedCenterX;
        } else {
          leftPathX = prodRect.left - rootRect.left + prodRect.width * ROUTER_BENCHMARK_PATH_FRACTION;
          rightPathX = prodRect.left - rootRect.left + prodRect.width * (1 - ROUTER_BENCHMARK_PATH_FRACTION);
        }

        zapPos.push({ x: leftPathX, y: apiBottomY });
        zapPos.push({ x: rightPathX, y: apiBottomY });

        // Benchmarks top (where paths end)
        const benchTopY = benchRect.top - rootRect.top;
        zapPos.push({ x: leftPathX, y: benchTopY });
        zapPos.push({ x: rightPathX, y: benchTopY });
      }

      setZapPositions(zapPos);

      // No bottom padding; we do not let Benchmarks affect vertical centering height
    };

    compute();
    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    const raf = requestAnimationFrame(compute);
    // Also observe layout-affecting nodes to recompute paths when absolute Benchmarks shifts
    const ro = new ResizeObserver(compute);
    if (productRef.current) ro.observe(productRef.current);
    if (saasRef.current) ro.observe(saasRef.current);
    if (apiRouterRef.current) ro.observe(apiRouterRef.current);
    if (benchmarksRef.current) ro.observe(benchmarksRef.current);
    providerRefs.current.forEach((el) => el && ro.observe(el));
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // Calculate total wrapper height when dimensions change
  useEffect(() => {
    if (productWrapperHeight !== null && benchmarksHeight !== null) {
      const padding = 16; // 2 * 8px for p-2
      setTotalWrapperHeight(productWrapperHeight + BENCHMARK_PRODUCT_GAP + benchmarksHeight + padding);
    }
  }, [productWrapperHeight, benchmarksHeight]);

  /**
   * Compute absolute top positions for the three columns inside the row container.
   * - Centers the Product+Benchmarks stack vertically within the row
   * - Aligns the first Provider vertically so its center matches Unified APIs center
   * - Aligns the SaaS column so its center matches Classifier center
   */
  useLayoutEffect(() => {
    const computeAbsolutePositions = () => {
      if (!rowRef.current) return;
      const rowRect = rowRef.current.getBoundingClientRect();

      // 1) Product+Benchmarks vertical centering within the row
      if (totalWrapperHeight !== null) {
        const top = Math.max(0, Math.round((rowRect.height - totalWrapperHeight) / 2));
        setCenterTop(top);
      }

      // 2) Providers: align Unified APIs center with midpoint between first two providers
      if (unifiedRef.current && providerRefs.current[0] && providerRefs.current[1]) {
        const unifiedRect = unifiedRef.current.getBoundingClientRect();
        const r0 = providerRefs.current[0]!.getBoundingClientRect();
        const r1 = providerRefs.current[1]!.getBoundingClientRect();
        const unifiedMidY = unifiedRect.top - rowRect.top + unifiedRect.height / 2;

        const h0 = r0.height;
        const h1 = r1.height;
        const gap = Math.max(0, r1.top - r0.bottom);
        // Midpoint between centers relative to column top:
        // mOffset = 3/4*h0 + 1/2*gap + 1/4*h1
        const mOffset = 0.75 * h0 + 0.5 * gap + 0.25 * h1;
        const top = Math.max(0, Math.round(unifiedMidY - mOffset));
        setProvidersTop(top);
      } else if (unifiedRef.current && providerRefs.current[0]) {
        // Fallback: center first provider on Unified APIs if second not present
        const unifiedRect = unifiedRef.current.getBoundingClientRect();
        const firstRect = providerRefs.current[0]!.getBoundingClientRect();
        const unifiedMidY = unifiedRect.top - rowRect.top + unifiedRect.height / 2;
        const firstHalf = firstRect.height / 2;
        const top = Math.max(0, Math.round(unifiedMidY - firstHalf));
        setProvidersTop(top);
      }

      // 3) SaaS: centered on Classifier
      if (classifierRef.current && saasColumnRef.current) {
        const classifierRect = classifierRef.current.getBoundingClientRect();
        const saasRect = saasColumnRef.current.getBoundingClientRect();
        const classifierMidY = classifierRect.top - rowRect.top + classifierRect.height / 2;
        const top = Math.max(0, Math.round(classifierMidY - saasRect.height / 2));
        setSaasTop(top);
      }
    };

    computeAbsolutePositions();
    const onResize = () => computeAbsolutePositions();
    window.addEventListener('resize', onResize);

    const ro = new ResizeObserver(computeAbsolutePositions);
    if (rowRef.current) ro.observe(rowRef.current);
    if (productRef.current) ro.observe(productRef.current);
    if (benchmarksRef.current) ro.observe(benchmarksRef.current);
    if (unifiedRef.current) ro.observe(unifiedRef.current);
    if (classifierRef.current) ro.observe(classifierRef.current);
    if (saasColumnRef.current) ro.observe(saasColumnRef.current);
    if (providerRefs.current[0]) ro.observe(providerRefs.current[0]!);

    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [totalWrapperHeight]);

  const providerPaths = useMemo(() => {
    if (!productRightCenter || providerCenters.length === 0) return [] as string[];
    return providerCenters.map((endPoint) =>
      buildRoundedConnectorPath(
        { x: productRightCenter.x, y: productRightCenter.y },
        { x: endPoint.x, y: endPoint.y },
        {
          splitFraction: CONNECTOR_SPLIT_FRACTION,
          radiusPx: CONNECTOR_ARC_RADIUS_PX,
          radiusFraction: 0.05,
          minRadius: CONNECTOR_MIN_RADIUS_PX,
        }
      )
    );
  }, [productRightCenter, providerCenters]);

  // Drive the animated dot along paths in sequence
  const { activeIndex, position } = useSequentialPathAnimation(
    animatedPathRefs,
    { speedPxPerSec: 240, reverseSpeedPxPerSec: 320, pauseMs: 250 },
    animatePaths
  );

  // Resolve the currently active path data string and stroke width for overlay rendering
  const activePathD = useMemo(() => {
    if (activeIndex === null) return null;
    if (activeIndex === 0) return saasToProductLine ?? null;
    const providerBase = 1;
    const providerEnd = providerBase + providerPaths.length; // exclusive
    if (activeIndex >= providerBase && activeIndex < providerEnd) {
      return providerPaths[activeIndex - providerBase] ?? null;
    }
    const routerBase = providerEnd;
    const routerIdx = activeIndex - routerBase;
    return routerToBenchmarksPaths[routerIdx] ?? null;
  }, [activeIndex, saasToProductLine, providerPaths, routerToBenchmarksPaths]);

  const activeStrokeWidth = useMemo(() => {
    if (activeIndex === 0) return CONNECTOR_STROKE_WIDTH_MAIN;
    if (activeIndex && activeIndex > 0) return CONNECTOR_STROKE_WIDTH;
    return CONNECTOR_STROKE_WIDTH;
  }, [activeIndex]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div ref={rootRef} className="relative w-full max-w-7xl">
        <div className='absolute -inset-12 rounded-3xl overflow-hidden border-1 border-gray-100/50'>
        <div className="absolute inset-2 rounded-2xl overflow-hidden">
        <DotsBg color="#ffffff30" />
        </div></div>
        {/* SVG for connecting paths */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
          preserveAspectRatio="none"
        >
          {/* SaaS -> Product (straight across midline) */}
          {saasToProductLine && (
            <path
              ref={(el) => {
                animatedPathRefs.current[0] = el;
              }}
              d={saasToProductLine}
              stroke={PATH_STROKE_INACTIVE}
              strokeWidth={CONNECTOR_STROKE_WIDTH_MAIN}
              fill="none"
            />
          )}

          {/* Product -> Providers with rounded orthogonal transitions */}
          {providerPaths.map((d, idx) => (
            <path
              key={`connector-${idx}`}
              ref={(el) => {
                animatedPathRefs.current[1 + idx] = el;
              }}
              d={d}
              stroke={PATH_STROKE_INACTIVE}
              strokeWidth={CONNECTOR_STROKE_WIDTH}
              fill="none"
            />
          ))}

          {/* API Router -> Benchmarks vertical paths */}
          {routerToBenchmarksPaths.map((d, idx) => (
            <path
              key={`router-benchmark-${idx}`}
              ref={(el) => {
                const base = 1 + providerPaths.length;
                animatedPathRefs.current[base + idx] = el;
              }}
              d={d}
              stroke={PATH_STROKE_INACTIVE}
              strokeWidth={CONNECTOR_STROKE_WIDTH}
              fill="none"
            />
          ))}

          {/* Active path overlay on top for correct stacking order */}
          {animatePaths && activePathD && (
            <path d={activePathD} stroke={PATH_STROKE_ACTIVE} strokeWidth={activeStrokeWidth} fill="none" />
          )}

          {/* Animated dot following the current path */}
          {position && (
            <circle cx={position.x} cy={position.y} r={5} fill="hsl(var(--color-path-active))" />
          )}
        </svg>

        {/* Zap icons at intersection points */}
        {zapPositions.map((pos, idx) => (
          <div
            key={`zap-${idx}`}
            className="absolute w-6 h-6 bg-muted rounded-full flex items-center justify-center border border-border"
            style={{
              left: `${pos.x - 12}px`, // Center the 24px (w-6) icon on the point
              top: `${pos.y - 12}px`,
              zIndex: 10,
            }}
          >
            <Zap className="w-4 h-4 text-foreground" />
          </div>
        ))}

        <div ref={rowRef} className="relative h-[600px]">
          {/* B2B SaaS Application */}
          <div ref={saasColumnRef} className="absolute left-0" style={{ top: saasTop }}>
            <div className="bg-white rounded-lg shadow-lg w-80 h-64 relative">
              {/* Window controls */}
              <div className="flex items-center p-3 border-b border-gray-300">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                </div>
                <div className="ml-4 bg-gray-300 rounded px-3 py-1 text-sm text-gray-600">
                  app.stackone.com
                </div>
                <div className="ml-auto bg-gray-100 rounded px-2 py-1 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-400"></div>
                    <div className="w-1 h-1 bg-gray-400"></div>
                  </div>
                </div>
              </div>
              {/* Content area */}
              <div ref={saasRef} className="p-6 h-full flex items-center justify-center">
                <div className="text-gray-500 text-lg">B2B SaaS</div>
              </div>
            </div>
            <div className="text-center mt-4 hidden">
              <span className="text-green-600 font-semibold text-lg">B2B SaaS</span>
            </div>
          </div>

          {/* StackOne Integration Layer (Product) */}
          <div className="absolute p-3 rounded-xl bg-white/20 overflow-hidden" 
          style={totalWrapperHeight !== null ? { 
            height: totalWrapperHeight, top: centerTop, left: '50%', transform: 'translateX(-50%)' as const } : { top: centerTop, left: '50%', transform: 'translateX(-50%)' as const }}>
            
            <div ref={productRef} className="bg-background border-1 border-gray-100/30 rounded-lg w-96 relative overflow-hidden">

              {/* Content - Split into two sections vertically */}
              <div className="p-6 h-full relative" style={{ zIndex: 2 }}>
                <div className="flex flex-col h-full">
                  {/* API Router Section */}
                  <div ref={apiRouterRef} className="flex-1 space-y-4">
                    <div className="border-b-2 border-border pb-2">
                      <h3 className="text-primary font-bold text-lg">API Router</h3>
                    </div>

                    {/* Unified APIs */}
                    <div ref={unifiedRef} className="bg-background rounded-lg p-2 border border-border">
                      <div className="flex items-center justify-start">
                      <FileText className="w-4 h-4 text-foreground mr-2" />
                        <span className="font-semibold text-foreground">Unified APIs</span>
                      </div>
                    </div>

                    {/* Classifier */}
                    <div ref={classifierRef} className="bg-background rounded-lg p-2 border border-border">
                      <div className="flex items-center justify-start">
                        <Compass className="w-4 h-4 text-foreground mr-2" />
                        <span className="font-semibold text-foreground">Classifier</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benchmarks positioned absolutely below Product */}
            <div ref={benchmarksRef} className="absolute left-1/2 transform -translate-x-1/2 bg-none border-2 border-border rounded-lg w-96 relative overflow-hidden"
              style={{ top: BENCHMARK_PRODUCT_GAP }}
            >
          {/* Content - Split into two sections vertically */}
          <div className="p-6 h-full bg-background">
                <div className="flex flex-col h-full">
                  {/* API Router Section */}
                  <div className="flex-1 space-y-4">
                    <div className="border-b-2 border-border pb-2">
                      <h3 className="text-primary font-bold text-lg text-foreground">Benchmarks</h3>
                    </div>

                    {/* Collect */}
                    <div className="bg-background rounded-lg p-2 border border-border">
                      <div className="flex items-center justify-start">
                      <FileText className="w-4 h-4 text-foreground mr-2" />
                        <span className="font-semibold text-foreground">Collect</span>
                      </div>
                    </div>

                    {/* Train */}
                    <div className="bg-background rounded-lg p-2 border border-border">
                      <div className="flex items-center justify-start">
                        <Compass className="w-4 h-4 text-foreground mr-2" />
                        <span className="font-semibold text-foreground">Train</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-4 hidden">
              <span className="text-green-700 font-semibold text-lg">StackOne Integration Layer</span>
            </div>
          </div>

          {/* Integration Categories */}
          <div ref={providersColumnRef} className="absolute right-0" style={{ top: providersTop }}>
            <div className="space-y-6">
              {/* Claude */}
              <div ref={(el) => { providerRefs.current[0] = el; }} className="bg-background rounded-lg p-4 w-64 shadow-lg border border-border">
                <div className="flex items-center space-x-3">
                  <Image
                    src="/ai-logos/claude.png"
                    alt="Claude"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                  <span className="font-bold text-foreground">Claude</span>
                </div>
              </div>

              {/* Gemini */}
              <div ref={(el) => { providerRefs.current[1] = el; }} className="bg-background rounded-lg p-4 w-64 shadow-lg border border-border">
                <div className="flex items-center space-x-3">
                  <Image
                    src="/ai-logos/gemini.png"
                    alt="Gemini"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                  <span className="font-bold text-foreground">Gemini</span>
                </div>
              </div>

              {/* OpenAI */}
              <div ref={(el) => { providerRefs.current[2] = el; }} className="bg-background rounded-lg p-4 w-64 shadow-lg border border-border">
                <div className="flex items-center space-x-3">
                  <Image
                    src="/ai-logos/openai.png"
                    alt="OpenAI"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                  <span className="font-bold text-foreground">OpenAI</span>
                </div>
              </div>

              {/* Perplexity */}
              <div ref={(el) => { providerRefs.current[3] = el; }} className="bg-background rounded-lg p-4 w-64 shadow-lg border border-border">
                <div className="flex items-center space-x-3">
                  <Image
                    src="/ai-logos/perplexity.png"
                    alt="Perplexity"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                  <span className="font-bold text-foreground">Perplexity</span>
                </div>
              </div>

              {/* xAI */}
              <div ref={(el) => { providerRefs.current[4] = el; }} className="bg-background rounded-lg p-4 w-64 shadow-lg border border-border">
                <div className="flex items-center space-x-3">
                  <Image
                    src="/ai-logos/xai.png"
                    alt="xAI"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                  <span className="font-bold text-foreground">xAI</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Promo2Page;

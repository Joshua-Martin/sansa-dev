'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { FileText, Compass, Zap } from 'lucide-react';
import DotsBg from '@/components/dots-bg';
import SansaLogo from '@/components/brand/sansa-logo';

/**
 * A two-dimensional point in the SVG coordinate system.
 */
interface Point {
  x: number;
  y: number;
}

// Removed: legacy PathAnimationOptions (now orchestrated explicitly)

/**
 * Tunable connector geometry.
 */
const CONNECTOR_SPLIT_FRACTION = 0.5; // 20% of horizontal distance before first turn
const CONNECTOR_ARC_RADIUS_PX = 12; // quarter-arc radius (px) for rounded corners
const CONNECTOR_MIN_RADIUS_PX = 6; // minimum radius safeguard when fraction is used
const CONNECTOR_STROKE_WIDTH = 3; // default stroke width for provider connectors
const CONNECTOR_STROKE_WIDTH_MAIN = 3; // stroke width for SaaS->Product main line

// Colors for inactive vs active (animated) paths
const PATH_STROKE_INACTIVE = 'var(--color-path-inactive)'; // gray-300
const PATH_STROKE_ACTIVE = 'var(--color-path-active)'; // primary color variant

// Animation timings (ms)
const DURATION_MSG_FADE_MS = 500;
const PAUSE_AFTER_MSG_IN_MS = 400;
const DURATION_MAIN_FORWARD_MS = 1100;
const DURATION_MSG_OUT_MS = 500;
const PAUSE_AFTER_MSG_OUT_MS = 300;
const DURATION_PROVIDER_FORWARD_MS = 1200;
const DURATION_PROVIDER_REVERSE_MS = 900;
const HIGHLIGHT_PULSE_MS = 450;
const DURATION_MAIN_REVERSE_MS = 1100;


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
  const directionX = dx >= 0 ? 1 : -1;

  const splitX = start.x + splitFraction * dx;

  // Radius based on horizontal distance, clamped by vertical space and minimum radius
  const fractionRadius = Math.max(minRadius, Math.abs(safeDx * radiusFraction));
  const proposedRadius = options?.radiusPx ?? fractionRadius;
  const maxRadiusFromVertical = Math.max(2, Math.abs(dy) / 2);
  const maxRadiusFromGeometry = Math.max(1, Math.abs(splitX - start.x) - 1);
  const r = Math.max(1, Math.min(proposedRadius, maxRadiusFromVertical, maxRadiusFromGeometry));

  // Determine arc sweep based on BOTH horizontal and vertical travel directions.
  // We want quarter-arcs to flip correctly when moving left vs right.
  // First corner (horizontal -> vertical)
  const sweepToVertical = (directionX > 0 && directionY > 0) || (directionX < 0 && directionY < 0) ? 1 : 0;
  // Second corner (vertical -> horizontal) is the opposite quarter-turn
  const sweepToHorizontal = 1 - sweepToVertical;

  const xBeforeCorner = splitX - directionX * r;
  const firstCornerEndX = splitX;
  const firstCornerEndY = start.y + directionY * r;
  const verticalEndY = end.y - directionY * r;
  const secondCornerEndX = splitX + directionX * r;
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

// Removed legacy auto path animation hook in favor of a controlled orchestrator

/**
 * System Architecture Diagram - StackOne Integration Layer
 * Visual representation of B2B SaaS integration with external services
 */
const HowItWorksAnimation: React.FC = () => {
  // Message animation state
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
  const [isMessageVisible, setIsMessageVisible] = useState<boolean>(false);

  // Messages to cycle through
  const messages = [
    "Summarize this contract and identify the payment terms",
    "Thank You"
  ];

  // Controlled messages via state machine (no auto-interval)

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
  // Specific feature refs for alignment
  const unifiedRef = useRef<HTMLDivElement | null>(null);
  const classifierRef = useRef<HTMLDivElement | null>(null);
  // Column wrappers for absolute placement
  const saasColumnRef = useRef<HTMLDivElement | null>(null);
  const providersColumnRef = useRef<HTMLDivElement | null>(null);
  // Wrapper around the product card (includes padding) for correct vertical centering
  const productWrapperRef = useRef<HTMLDivElement | null>(null);

  const [svgSize, setSvgSize] = useState<{ width: number; height: number }>({ width: 1200, height: 800 });
  const [productRightCenter, setProductRightCenter] = useState<Point | null>(null);
  const [providerCenters, setProviderCenters] = useState<Array<Point>>([]);
  const [saasToProductLine, setSaasToProductLine] = useState<string | null>(null);
  const [saasEndpoints, setSaasEndpoints] = useState<{ start: Point; end: Point } | null>(null);
  const [zapPositions, setZapPositions] = useState<Array<Point>>([]);

  // Absolute top offsets (px) within the row for each column
  const [centerTop, setCenterTop] = useState<number>(0);
  const [providersTop, setProvidersTop] = useState<number>(0);
  const [saasTop, setSaasTop] = useState<number>(0);

  // Overlay path animation state (controlled per phase)
  const overlayPathRef = useRef<SVGPathElement | null>(null);
  const [overlayD, setOverlayD] = useState<string | null>(null);
  const [overlayProgress, setOverlayProgress] = useState<number>(0);
  const [overlayVisible, setOverlayVisible] = useState<boolean>(false);
  const [overlayLength, setOverlayLength] = useState<number>(0);
  const [overlayKind, setOverlayKind] = useState<'main' | 'provider'>('main');
  const [overlayDirection, setOverlayDirection] = useState<'forward' | 'reverse'>('forward');
  const [dotPosition, setDotPosition] = useState<Point | null>(null);

  // Highlights
  const [unifiedHighlight, setUnifiedHighlight] = useState<boolean>(false);
  const [benchmarkHighlight, setBenchmarkHighlight] = useState<boolean>(false);
  const [providerHighlight, setProviderHighlight] = useState<boolean[]>([false, false]);

  // Orchestrator
  const [cycleIndex, setCycleIndex] = useState<number>(0); // 0 -> Claude, 1 -> GPT-5-mini
  const [phase, setPhase] = useState<
    | 'idle'
    | 'msgIn'
    | 'mainForward'
    | 'msgOut'
    | 'providerForward'
    | 'providerReverse'
    | 'highlightBoth'
    | 'mainReverse'
  >('idle');
  const timeoutsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

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
        setSaasEndpoints({ start: { x: startX, y }, end: { x: endX, y } });
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


      setZapPositions(zapPos);

      // No bottom padding; we do not let Benchmarks affect vertical centering height
    };

    compute();
    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    const raf = requestAnimationFrame(compute);
    // Also observe layout-affecting nodes to recompute paths
    const ro = new ResizeObserver(compute);
    if (productRef.current) ro.observe(productRef.current);
    if (saasRef.current) ro.observe(saasRef.current);
    if (apiRouterRef.current) ro.observe(apiRouterRef.current);
    providerRefs.current.forEach((el) => el && ro.observe(el));
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);


  /**
   * Compute absolute top positions for the three columns inside the row container.
   * - Centers the Product vertically within the row
   * - Aligns the first Provider vertically so its center matches Unified APIs center
   * - Aligns the SaaS column so its center matches Classifier center
   */
  useLayoutEffect(() => {
    const computeAbsolutePositions = () => {
      if (!rowRef.current) return;
      const rowRect = rowRef.current.getBoundingClientRect();

      // 1) Product vertical centering within the row (center the OUTER WRAPPER that includes padding)
      if (productWrapperRef.current) {
        const wrapperRect = productWrapperRef.current.getBoundingClientRect();
        const top = Math.max(0, Math.round((rowRect.height - wrapperRect.height) / 2));
        setCenterTop(top);
      } else if (productRef.current) {
        // Fallback if wrapper not yet mounted
        const productRect = productRef.current.getBoundingClientRect();
        const top = Math.max(0, Math.round((rowRect.height - productRect.height) / 2));
        setCenterTop(top);
      }

      // 2) Providers: vertically center within the row
      if (providersColumnRef.current) {
        const providersRect = providersColumnRef.current.getBoundingClientRect();
        const top = Math.max(0, Math.round((rowRect.height - providersRect.height) / 2));
        setProvidersTop(top);
      }

      // 3) SaaS: vertically center within the row (keep x position unchanged)
      if (saasColumnRef.current) {
        const saasRect = saasColumnRef.current.getBoundingClientRect();
        const top = Math.max(0, Math.round((rowRect.height - saasRect.height) / 2));
        setSaasTop(top);
      }
    };

    computeAbsolutePositions();
    const onResize = () => computeAbsolutePositions();
    window.addEventListener('resize', onResize);

    const ro = new ResizeObserver(computeAbsolutePositions);
    if (rowRef.current) ro.observe(rowRef.current);
    if (productWrapperRef.current) ro.observe(productWrapperRef.current);
    if (productRef.current) ro.observe(productRef.current);
    if (unifiedRef.current) ro.observe(unifiedRef.current);
    if (classifierRef.current) ro.observe(classifierRef.current);
    if (saasColumnRef.current) ro.observe(saasColumnRef.current);
    if (providerRefs.current[0]) ro.observe(providerRefs.current[0]!);

    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, []);

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

  // Measure overlay path length whenever d changes
  useEffect(() => {
    if (!overlayD) return;
    const id = requestAnimationFrame(() => {
      if (overlayPathRef.current) {
        try {
          const len = overlayPathRef.current.getTotalLength();
          setOverlayLength(Math.max(1, len));
        } catch {
          setOverlayLength(1000);
        }
      }
    });
    return () => cancelAnimationFrame(id);
  }, [overlayD]);

  const overlayStrokeWidth = useMemo(() => {
    return overlayKind === 'main' ? CONNECTOR_STROKE_WIDTH_MAIN : CONNECTOR_STROKE_WIDTH;
  }, [overlayKind]);

  // Helpers to manage timers/raf
  const clearTimers = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const schedule = (fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timeoutsRef.current.push(id);
  };

  const animatePath = (
    d: string,
    kind: 'main' | 'provider',
    durationMs: number,
    direction: 'forward' | 'reverse',
    withDot: boolean,
    onDone: () => void
  ) => {
    setOverlayD(d);
    setOverlayKind(kind);
    setOverlayDirection(direction);
    setOverlayVisible(true);
    setOverlayProgress(0);
    setDotPosition(null);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / Math.max(1, durationMs)));
      setOverlayProgress(t);
      // Drive dot along the same exact path geometry in the requested direction
      if (withDot && overlayPathRef.current) {
        try {
          const len = overlayPathRef.current.getTotalLength();
          const dist = direction === 'forward' ? t * len : (1 - t) * len;
          const pt = overlayPathRef.current.getPointAtLength(dist);
          setDotPosition({ x: pt.x, y: pt.y });
        } catch {
          // ignore errors from getTotalLength/getPointAtLength
        }
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDotPosition(null);
        onDone();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const ready = Boolean(saasToProductLine && saasEndpoints && productRightCenter && providerCenters.length >= 2);

  // Orchestrate the full animation loop
  useEffect(() => {
    if (!ready) return;
    clearTimers();
    // Determine message for this cycle
    setCurrentMessageIndex(cycleIndex % messages.length);
    // Start message in
    setPhase('msgIn');
    setIsMessageVisible(true);
    schedule(() => {
      // Main forward (SaaS -> Product)
      if (!saasToProductLine) return;
      setPhase('mainForward');
      animatePath(saasToProductLine, 'main', DURATION_MAIN_FORWARD_MS, 'forward', true, () => {
        // Pulse Unified APIs at the exact end
        setUnifiedHighlight(true);
        schedule(() => setUnifiedHighlight(false), HIGHLIGHT_PULSE_MS);

        // Message out after brief pause
        schedule(() => {
          setPhase('msgOut');
          setIsMessageVisible(false);
          schedule(() => {
            // Provider forward
            const targetProviderIndex = cycleIndex % providerCenters.length;
            const forwardD = providerPaths[targetProviderIndex];
            if (!forwardD) return;
            setPhase('providerForward');
            setProviderHighlight(prev => prev.map((_, idx) => idx === targetProviderIndex));
            animatePath(forwardD, 'provider', DURATION_PROVIDER_FORWARD_MS, 'forward', true, () => {
              // Provider reverse: animate forward along a reversed-geometry path
              setPhase('providerReverse');
              const providerCenter = providerCenters[targetProviderIndex];
              const reverseProviderD = productRightCenter && providerCenter
                ? buildRoundedConnectorPath(
                    { x: providerCenter.x, y: providerCenter.y },
                    { x: productRightCenter.x, y: productRightCenter.y },
                    {
                      splitFraction: CONNECTOR_SPLIT_FRACTION,
                      radiusPx: CONNECTOR_ARC_RADIUS_PX,
                      radiusFraction: 0.05,
                      minRadius: CONNECTOR_MIN_RADIUS_PX,
                    }
                  )
                : forwardD;
              animatePath(reverseProviderD, 'provider', DURATION_PROVIDER_REVERSE_MS, 'forward', true, () => {
                // Clear provider highlight
                setProviderHighlight([false, false]);
                // Highlight both Unified APIs and Benchmark together
                setPhase('highlightBoth');
                setUnifiedHighlight(true);
                setBenchmarkHighlight(true);
                schedule(() => {
                  setUnifiedHighlight(false);
                  setBenchmarkHighlight(false);
                  // Main reverse (Product -> SaaS): animate forward along reversed straight line
                  if (!saasEndpoints) return;
                  setPhase('mainReverse');
                  const reverseMainD = `M ${saasEndpoints.end.x} ${saasEndpoints.end.y} L ${saasEndpoints.start.x} ${saasEndpoints.start.y}`;
                  animatePath(reverseMainD, 'main', DURATION_MAIN_REVERSE_MS, 'forward', true, () => {
                    setOverlayVisible(false);
                    // Next cycle
                    setCycleIndex((c) => (c + 1) % 2);
                  });
                }, HIGHLIGHT_PULSE_MS);
              });
            });
          }, DURATION_MSG_OUT_MS + PAUSE_AFTER_MSG_OUT_MS);
        }, PAUSE_AFTER_MSG_IN_MS);
      });
    }, DURATION_MSG_FADE_MS + PAUSE_AFTER_MSG_IN_MS);

    return () => {
      clearTimers();
    };
  }, [ready, cycleIndex, saasToProductLine, saasEndpoints, productRightCenter, providerCenters, providerPaths, messages.length]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div ref={rootRef} className="relative w-full max-w-7xl">
        <div className='absolute -inset-12 rounded-3xl overflow-hidden border-1 border-gray-100/50 bg-gray-50'>
        <div className="absolute inset-2 rounded-2xl overflow-hidden">
        <DotsBg color="#cccccc70" />
        </div></div>
        {/* SVG for connecting paths */}
        <svg data-phase={phase}
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
          preserveAspectRatio="none"
        >
          {/* SaaS -> Product (straight across midline) */}
          {saasToProductLine && (
            <path
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
              d={d}
              stroke={PATH_STROKE_INACTIVE}
              strokeWidth={CONNECTOR_STROKE_WIDTH}
              fill="none"
            />
          ))}

          {/* Controlled overlay animation */}
          {overlayD && overlayVisible && (
            <path
              ref={overlayPathRef}
              data-direction={overlayDirection}
              d={overlayD}
              stroke={PATH_STROKE_ACTIVE}
              strokeWidth={overlayStrokeWidth}
              strokeLinecap="round"
              fill="none"
              style={{
                // Anchor the visible dash to the moving dot ("head") for both directions
                // tail: length of the visible dash segment
                // head: absolute distance along the path where the dot is
                strokeDasharray: `${Math.max(0.0001, overlayLength * overlayProgress)} ${overlayLength}`,
                strokeDashoffset:
                  (overlayDirection === 'forward'
                    ? (overlayLength * overlayProgress) // head = tail when moving forward
                    : (overlayLength * (1 - overlayProgress)) // head moves from len -> 0 when reversing
                  ) - (overlayLength * overlayProgress), // offset = head - tail
              }}
            />
          )}

          {dotPosition && overlayVisible && (
            <circle cx={dotPosition.x} cy={dotPosition.y} r={5} fill="hsl(var(--color-path-active))" />
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
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="ml-4 bg-gray-100 rounded px-3 py-1 text-sm text-gray-600">
                  app.yourcompany.com
                </div>
              </div>
              {/* Content area */}
              <div ref={saasRef} className="p-6 h-48 flex items-center justify-center">
                <div className={`bg-white rounded-tl-xl rounded-tr-xl rounded-bl-xl p-4 shadow-md border border-gray-200 max-w-xs transition-opacity duration-500 ${isMessageVisible ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="text-gray-800 text-sm text-center">
                    {messages[currentMessageIndex]}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center mt-4 hidden">
              <span className="text-green-600 font-semibold text-lg">B2B SaaS</span>
            </div>
          </div>

          {/* StackOne Integration Layer (Product) */}
          <div ref={productWrapperRef} className="absolute p-3 rounded-xl bg-white/20 overflow-hidden"
          style={{ top: centerTop, left: '50%', transform: 'translateX(-50%)' as const }}>
            
            <div ref={productRef} className="bg-background border-1 border-gray-100/30 rounded-lg w-96 h-64 relative overflow-hidden shadow-lg">

              {/* Content - Split into two sections vertically */}
              <div className="p-6 h-full relative" style={{ zIndex: 2 }}>
                <div className="flex flex-col h-full">
                  {/* API Router Section */}
                  <div ref={apiRouterRef} className="flex-1 space-y-4">
                    <div className="border-b border-border pb-2 text-2xl">
                      <SansaLogo />
                    </div>

                    {/* Unified APIs */}
                    <div ref={unifiedRef} className={`bg-background rounded-lg p-2 ${unifiedHighlight ? 'border-primary border-2' : 'border-transparent border-2'}`}>
                      <div className="flex items-center justify-start">
                      <FileText className="w-4 h-4 text-foreground mr-2" />
                        <span className="font-semibold text-foreground">Unified APIs</span>
                      </div>
                    </div>

                    {/* Benchmark */}
                    <div ref={classifierRef} className={`bg-background rounded-lg p-2 ${benchmarkHighlight ? 'border-primary border-2' : 'border-transparent border-2'}`}>
                      <div className="flex items-center justify-start">
                        <Compass className="w-4 h-4 text-foreground mr-2" />
                        <span className="font-semibold text-foreground">Benchmark</span>
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
              {/* Claude Opus */}
              <div ref={(el) => { providerRefs.current[0] = el; }} className={`bg-background rounded-lg p-4 w-64 shadow-lg border ${providerHighlight[0] ? 'border-2 border-primary' : 'border-transparent border-2'}`}>
                <div className="flex items-center space-x-3">
                  <Image
                    src="/assets/ai-logos/claude.png"
                    alt="Claude Opus"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                  <span className="font-bold text-foreground">Claude Opus</span>
                </div>
              </div>

              {/* GPT-5-mini */}
              <div ref={(el) => { providerRefs.current[1] = el; }} className={`bg-background rounded-lg p-4 w-64 shadow-lg border ${providerHighlight[1] ? 'border-2 border-primary' : 'border-transparent border-2'}`}>
                <div className="flex items-center space-x-3">
                  <Image
                    src="/assets/ai-logos/openai.png"
                    alt="GPT-5-mini"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                  <span className="font-bold text-foreground">GPT-5-mini</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksAnimation;  

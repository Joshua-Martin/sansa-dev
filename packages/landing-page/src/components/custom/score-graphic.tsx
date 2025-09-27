'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Target, DollarSign, Zap } from 'lucide-react';
import JsonViewer from '@/components/custom/JsonViewer';

/**
 * A 2D point in pixels relative to the promo container.
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Build an orthogonal polyline with two rounded 90° arcs for smooth direction changes.
 * The path runs horizontally from start toward an interior split X, turns vertically,
 * then turns back horizontally to reach the end.
 */
function buildRoundedConnectorPath(
  start: Point,
  end: Point,
  options?: { splitFraction?: number; radiusPx?: number }
): string {
  const splitFraction = options?.splitFraction ?? 0.3;
  const r = Math.max(2, options?.radiusPx ?? 10);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dirX = Math.sign(dx) || 1;
  const dirY = Math.sign(dy) || 1;

  // Straight line if essentially horizontal alignment
  if (Math.abs(dy) <= 1) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  // Interior split X between start and end
  const splitX = start.x + splitFraction * dx;

  // Leave room for first corner based on travel direction
  const xBefore = splitX - dirX * r;

  // First arc ends r px into vertical travel toward end.y
  const firstCornerEndX = splitX;
  const firstCornerEndY = start.y + dirY * r;

  // Vertical until r px before end to leave room for second corner
  const verticalEndY = end.y - dirY * r;

  // Second arc ends r px into horizontal travel toward end.x
  const secondCornerEndX = splitX + dirX * r;
  const secondCornerEndY = end.y;

  // Sweep flags to ensure arcs bend in the correct direction
  // First arc: horizontal -> vertical
  //   CW for (dx>0 && dy>0) or (dx<0 && dy<0); CCW otherwise
  const sweepToVertical = (dx > 0) === (dy > 0) ? 1 : 0;

  // Second arc: vertical -> horizontal
  //   CW when signs differ (dy>0 && dx<0) or (dy<0 && dx>0); CCW otherwise
  const sweepToHorizontal = (dx > 0) !== (dy > 0) ? 1 : 0;

  return [
    `M ${start.x} ${start.y}`,
    `L ${xBefore} ${start.y}`,
    `A ${r} ${r} 0 0 ${sweepToVertical} ${firstCornerEndX} ${firstCornerEndY}`,
    `L ${splitX} ${verticalEndY}`,
    `A ${r} ${r} 0 0 ${sweepToHorizontal} ${secondCornerEndX} ${secondCornerEndY}`,
    `L ${end.x} ${end.y}`,
  ].join(' ');
}

/**
 * Tuning parameters for the Cost Savings -> Cost connector geometry.
 *
 * - firstHorizontalFraction: Fraction of horizontal separation to cover before the first turn (0..1).
 * - verticalLevelFractionFromEnd: Chooses the horizontal traverse level as a fraction of vertical separation measured from the end point (0..1).
 * - firstVerticalFraction: Alternative to the above; fraction of vertical separation taken by the first vertical leg measured from the start (0..1). If provided, it takes precedence.
 * - radiusPx: Corner radius in pixels for rounded 90° transitions.
 * - endHorizontalOffsetPx: Optional horizontal offset to apply at the end point (px).
 */
const COST_SAVINGS_CONNECTOR: {
  firstHorizontalFraction: number;
  verticalLevelFractionFromEnd: number;
  firstVerticalFraction?: number;
  radiusPx: number;
  endHorizontalOffsetPx?: number;
} = {
  firstHorizontalFraction: 0.5,
  verticalLevelFractionFromEnd: 0.25,
  // Equivalent to 1 - verticalLevelFractionFromEnd
  firstVerticalFraction: 0.85,
  radiusPx: 10,
};

/**
 * Tuning parameters for the Response Match -> Message connector geometry.
 * Uses the same rounded HVHV path style for consistency with Cost Savings.
 *
 * - endHorizontalOffsetPx: Horizontal offset from the message value center (px).
 *   Positive moves right, negative moves left.
 */
const RESPONSE_MATCH_CONNECTOR: {
  firstHorizontalFraction: number;
  verticalLevelFractionFromEnd: number;
  firstVerticalFraction?: number;
  radiusPx: number;
  endHorizontalOffsetPx?: number;
} = {
  // Ensure a clear initial leftward segment before the first turn
  firstHorizontalFraction: 0.4,
  // Traverse near the end's vertical level to keep the path high
  verticalLevelFractionFromEnd: 0.25,
  // Early rise to emphasize the "up" step
  firstVerticalFraction: 0.7,
  // Slightly smaller radius to avoid consuming the whole first segment
  radiusPx: 10,
  // Default to terminating at the center of the message value
  endHorizontalOffsetPx: 40,
};

/**
 * Tuning parameters for the Faster Response -> Latency connector geometry.
 */
const FASTER_RESPONSE_CONNECTOR: { splitFraction: number; radiusPx: number } = {
  splitFraction: 0.6,
  radiusPx: 10,
};

/**
 * Build a rounded HVHV orthogonal connector with three 90° corners between the Cost Savings badge
 * and the Cost (price) point. Corner transitions are rounded using SVG arc segments.
 *
 * The path segments are:
 * - Horizontal from start.x toward an interior splitX
 * - Vertical toward an intermediate horizontal level (levelY)
 * - Horizontal toward end.x
 * - Vertical into end.y
 *
 * All three direction changes are smoothed with quarter-circle arcs of radius r.
 *
 * @param start - Starting point (Cost Savings badge anchor).
 * @param end - Ending point (price bottom-center anchor).
 * @param config - Geometry tuning values. See COST_SAVINGS_CONNECTOR.
 * @returns SVG path data string with rounded corners.
 */
function buildCostSavingsRoundedHVHVPath(
  start: Point,
  end: Point,
  config: {
    firstHorizontalFraction: number;
    verticalLevelFractionFromEnd: number;
    firstVerticalFraction?: number;
    radiusPx: number;
    /** Optional horizontal offset applied at the end point (px). */
    endHorizontalOffsetPx?: number;
  } = COST_SAVINGS_CONNECTOR
): string {
  const clampedFraction = (v: number) => Math.max(0, Math.min(1, v));
  const firstFrac = clampedFraction(config.firstHorizontalFraction);
  const levelFracFromEnd = clampedFraction(config.verticalLevelFractionFromEnd);
  const firstVertFrac = config.firstVerticalFraction !== undefined ? clampedFraction(config.firstVerticalFraction) : undefined;
  const endX = end.x + (config.endHorizontalOffsetPx ?? 0);
  const dx = endX - start.x;
  const dy = end.y - start.y;
  const dirX = Math.sign(dx) || 1;
  const dirY = Math.sign(dy) || 1;

  // Early return for near-horizontal alignment
  if (Math.abs(dy) <= 1) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  // Compute interior X and horizontal level Y per configured fractions
  const splitX = start.x + firstFrac * dx;
  const levelY = firstVertFrac !== undefined
    ? start.y + firstVertFrac * dy
    : end.y + levelFracFromEnd * (start.y - end.y);

  // Corner radius, limited so it fits available segments
  const rBase = Math.max(2, config.radiusPx);
  const maxHorizontalInset = Math.min(Math.abs(splitX - start.x), Math.abs(endX - splitX));
  const maxVerticalInset = Math.min(Math.abs(levelY - start.y), Math.abs(end.y - levelY));
  const r = Math.min(rBase, maxHorizontalInset, maxVerticalInset);

  // If radius collapses to zero, fall back to sharp HVHV orthogonal polyline
  if (r < 1) {
    return [
      `M ${start.x} ${start.y}`,
      `L ${splitX} ${start.y}`,
      `L ${splitX} ${levelY}`,
      `L ${endX} ${levelY}`,
      `L ${endX} ${end.y}`,
    ].join(' ');
  }

  // Arc sweep flags for the three corners
  // 1) horizontal -> vertical (toward levelY from start.y)
  const sweep1 = (dx > 0) === (dy > 0) ? 1 : 0;
  // 2) vertical -> horizontal (toward end.x at levelY)
  const sweep2 = (dx > 0) !== (dy > 0) ? 1 : 0;
  // 3) horizontal -> vertical (down/up into end.y)
  const sweep3 = sweep1; // same orientation as first turn for consistent geometry

  // Waypoints around corners leaving room for arcs
  const xBeforeFirst = splitX - dirX * r;
  const firstArcEndX = splitX;
  const firstArcEndY = start.y + dirY * r;

  const yBeforeSecond = levelY - dirY * r;
  const secondArcEndX = splitX + dirX * r;
  const secondArcEndY = levelY;

  const xBeforeThird = endX - dirX * r;
  const thirdArcEndX = endX;
  const thirdArcEndY = levelY + dirY * r;

  return [
    `M ${start.x} ${start.y}`,
    `L ${xBeforeFirst} ${start.y}`,
    `A ${r} ${r} 0 0 ${sweep1} ${firstArcEndX} ${firstArcEndY}`,
    `L ${splitX} ${yBeforeSecond}`,
    `A ${r} ${r} 0 0 ${sweep2} ${secondArcEndX} ${secondArcEndY}`,
    `L ${xBeforeThird} ${levelY}`,
    `A ${r} ${r} 0 0 ${sweep3} ${thirdArcEndX} ${thirdArcEndY}`,
    `L ${endX} ${end.y}`,
  ].join(' ');
}

/**
 * Promo page for creating visual content for landing page screenshots.
 * Shows layered JSON comparison between models with floating accuracy badges
 * and connector lines into the GPT-5-mini response details.
 */
const ScoreGraphic: React.FC = () => {
  // Root container for coordinate system
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [svgSize, setSvgSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });

  // Stat badge refs and measured points (left-edge centers)
  const responseMatchRef = useRef<HTMLDivElement | null>(null);
  const costSavingsRef = useRef<HTMLDivElement | null>(null);
  const fasterResponseRef = useRef<HTMLDivElement | null>(null);

  const [responseMatchPoint, setResponseMatchPoint] = useState<Point | null>(null);
  const [costSavingsPoint, setCostSavingsPoint] = useState<Point | null>(null);
  const [fasterResponsePoint, setFasterResponsePoint] = useState<Point | null>(null);

  // GPT viewer measurement points (converted to root coordinates)
  const [gptPoints, setGptPoints] = useState<{
    messageValueCenterBottom?: Point;
    priceBottomCenter?: Point;
    priceTopCenter?: Point;
    latencyRightCenter?: Point;
  }>({});

  // Position for the standalone scaled message element
  const [messagePosition, setMessagePosition] = useState<Point | null>(null);

  // Support-routing call data from mockData
  const sonnetResponse = {
    "message": "I understand your frustration, let me connect you with someone who can better handle this situation",
    "classification": "billing-issue",
    "priority": "medium",
    "sentiment": "frustrated",
    "routes": [
      "fetch-billing-history",
      "queue-agent",
      "fetch-tracking-data"
    ]
  };

  const gptMiniResponse = {
    "message": "I apologize for the inconvenience, let me transfer you to a billing specialist who can resolve this for you",
    "classification": "billing-issue",
    "priority": "medium",
    "sentiment": "frustrated",
    "routes": [
      "fetch-billing-history",
      "queue-agent",
      "fetch-tracking-data"
    ]
  };

  // Keep SVG viewbox synced to root container size
  useEffect(() => {
    if (!rootRef.current) return;
    const resize = () => {
      const rect = rootRef.current!.getBoundingClientRect();
      setSvgSize({ width: Math.max(1, Math.round(rect.width)), height: Math.max(1, Math.round(rect.height)) });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(rootRef.current);
    window.addEventListener('resize', resize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Measure stat badges relative to root
  useEffect(() => {
    const measureStats = () => {
      if (!rootRef.current) return;
      const rootRect = rootRef.current.getBoundingClientRect();
      const calcLeftCenter = (el: HTMLDivElement | null): Point | null => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left - rootRect.left, y: r.top - rootRect.top + r.height / 2 };
      };
      setResponseMatchPoint(calcLeftCenter(responseMatchRef.current));
      setCostSavingsPoint(calcLeftCenter(costSavingsRef.current));
      setFasterResponsePoint(calcLeftCenter(fasterResponseRef.current));
    };
    measureStats();
    const ro = new ResizeObserver(measureStats);
    if (responseMatchRef.current) ro.observe(responseMatchRef.current);
    if (costSavingsRef.current) ro.observe(costSavingsRef.current);
    if (fasterResponseRef.current) ro.observe(fasterResponseRef.current);
    if (rootRef.current) ro.observe(rootRef.current);
    window.addEventListener('resize', measureStats);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureStats);
    };
  }, []);

  /**
   * Receives JsonViewer local measurements and converts them to root coordinates.
   */
  const handleGptMeasure = useMemo(() => {
    return (pts: {
      messageKeyCenterBottom?: Point;
      messageValueCenterBottom?: Point;
      priceBottomCenter?: Point;
      priceTopCenter?: Point;
      latencyRightCenter?: Point;
      containerRect: DOMRect;
    }) => {
      if (!rootRef.current) return;
      const rootRect = rootRef.current.getBoundingClientRect();
      const offsetX = pts.containerRect.left - rootRect.left;
      const offsetY = pts.containerRect.top - rootRect.top;
      const toRoot = (p?: Point): Point | undefined => (p ? { x: p.x + offsetX, y: p.y + offsetY } : undefined);
      setGptPoints({
        messageValueCenterBottom: toRoot(pts.messageValueCenterBottom),
        priceBottomCenter: toRoot(pts.priceBottomCenter),
        priceTopCenter: toRoot(pts.priceTopCenter),
        latencyRightCenter: toRoot(pts.latencyRightCenter),
      });
      setMessagePosition(toRoot(pts.messageValueCenterBottom) || null);
    };
  }, []);

  // Build connector paths
  const responseMatchPath = useMemo(() => {
    if (!responseMatchPoint || !gptPoints.messageValueCenterBottom) return null;
    // Route Response Match -> Message with rounded orthogonal segments (HVHV)
    return buildCostSavingsRoundedHVHVPath(
      responseMatchPoint,
      gptPoints.messageValueCenterBottom,
      RESPONSE_MATCH_CONNECTOR
    );
  }, [responseMatchPoint, gptPoints.messageValueCenterBottom]);

  const costSavingsPath = useMemo(() => {
    // Route Cost Savings -> Price with rounded orthogonal segments (HVHV)
    if (!costSavingsPoint || !gptPoints.priceBottomCenter) return null;
    return buildCostSavingsRoundedHVHVPath(costSavingsPoint, gptPoints.priceBottomCenter, COST_SAVINGS_CONNECTOR);
  }, [costSavingsPoint, gptPoints.priceBottomCenter]);

  const fasterResponsePath = useMemo(() => {
    // Route Faster Response -> Latency (right center)
    if (!fasterResponsePoint || !gptPoints.latencyRightCenter) return null;
    return buildRoundedConnectorPath(
      fasterResponsePoint,
      gptPoints.latencyRightCenter,
      FASTER_RESPONSE_CONNECTOR
    );
  }, [fasterResponsePoint, gptPoints.latencyRightCenter]);

  return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center">
      <div ref={rootRef} className="relative w-full max-w-5xl py-10">
        {/* Base Layer - Sonnet 4 */}
        <div className="w-[70%] transform -rotate-1">
          <JsonViewer
            data={sonnetResponse}
            title="Claude Sonnet 4 Response"
            price="$0.045/call"
            latency="1.57s TTF"
          />
        </div>

        {/* Overlay Layer - GPT-5-mini (offset) */}
        <div className="absolute top-18 left-16 w-[70%] shadow-2xl">
          <div className="bg-card border-2 border-foreground/80 rounded-lg overflow-hidden">
            <JsonViewer
              data={gptMiniResponse}
              title="GPT-5-mini Response"
              price="$0.0045/call"
              latency="500ms TTF"
              onMeasure={handleGptMeasure}
              shouldScale
            />
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute -right-20 -top-20 h-[60vh] w-[600px] bg-gradient-to-r from-transparent to-background z-20 pointer-events-none"></div>

        {/* SVG connectors overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
          preserveAspectRatio="none"
          style={{ zIndex: 25 }}
        >
          {responseMatchPath && (
            <path d={responseMatchPath} stroke="#86efac" strokeWidth={3} fill="none" />
          )}
          {costSavingsPath && (
            <path d={costSavingsPath} stroke="#86efac" strokeWidth={3} fill="none" />
          )}
          {fasterResponsePath && (
            <path d={fasterResponsePath} stroke="#86efac" strokeWidth={3} fill="none" />
          )}
        </svg>

        {/* Standalone scaled message element */}
        {messagePosition && (
          <div
            className="absolute shadow-lg border border-primary p-2 pr-3 rounded-lg z-50 bg-background"
            style={{
              left: messagePosition.x,
              top: messagePosition.y,
              transform: 'scale(1.1) translate(-50%, -100%)',
              transformOrigin: 'center bottom',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            <span className="text-purple-400">&quot;message&quot;</span>
            <span className="text-gray-300">: </span>
            <span className="text-yellow-400">&quot;</span>
            <span className="text-yellow-400">I apologize for the inconvenience, let me transfer you to a</span>
            <br />
            <span className="text-gray-600">                </span>
            <span className="text-yellow-400">billing specialist who can resolve this for you</span>
            <span className="text-yellow-400">&quot;</span>
          </div>
        )}

        {/* Floating Accuracy Badges */}
        <div className="absolute -right-30 top-30 z-30 flex flex-col justify-start space-y-10">
          <div ref={fasterResponseRef} className="border-2 border-primary bg-background/90 text-foreground px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3 shadow-primary">
            <Zap className="h-5 w-5" />
            68% Faster Response
          </div>

          <div ref={costSavingsRef} className="border-2 border-primary bg-background/90 text-foreground px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3 shadow-primary">
            <DollarSign className="h-5 w-5" />
            90% Cost Savings
          </div>

          <div ref={responseMatchRef} className="border-2 border-primary/70 bg-background/90 text-foreground px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3 shadow-primary">
            <Target className="h-5 w-5" />
            96.8% Response Match
          </div>

        </div>
      </div>
    </div>
  );
};

export default ScoreGraphic;

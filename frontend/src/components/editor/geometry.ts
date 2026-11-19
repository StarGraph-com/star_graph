import { AnchorPoint, DiagramShape, LineStyle, Point } from "./types";

export const ANCHOR_POINTS: AnchorPoint[] = [
  "top",
  "right",
  "bottom",
  "left",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

export function getAnchorPoint(shape: DiagramShape, anchor: AnchorPoint): Point {
  const { x, y, width, height } = shape;
  switch (anchor) {
    case "top":
      return { x: x + width / 2, y };
    case "right":
      return { x: x + width, y: y + height / 2 };
    case "bottom":
      return { x: x + width / 2, y: y + height };
    case "left":
      return { x, y: y + height / 2 };
    case "top-left":
      return { x, y };
    case "top-right":
      return { x: x + width, y };
    case "bottom-left":
      return { x, y: y + height };
    case "bottom-right":
      return { x: x + width, y: y + height };
    default:
      return { x: x + width / 2, y: y + height / 2 };
  }
}

export function snapValue(val: number, gridSize: number, enabled: boolean): number {
  if (!enabled || gridSize <= 0) return Math.round(val);
  return Math.round(val / gridSize) * gridSize;
}

export function snapPoint(p: Point, gridSize: number, enabled: boolean): Point {
  return {
    x: snapValue(p.x, gridSize, enabled),
    y: snapValue(p.y, gridSize, enabled),
  };
}

export function calculateConnectorPath(
  start: Point,
  end: Point,
  startAnchor: AnchorPoint,
  endAnchor: AnchorPoint,
  style: LineStyle
): { pathString: string; midPoint: Point } {
  if (style === "straight") {
    return {
      pathString: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      midPoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    };
  }

  if (style === "curved") {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.hypot(dx, dy);
    const curvature = Math.max(30, dist * 0.35);

    let cp1 = { x: start.x, y: start.y };
    let cp2 = { x: end.x, y: end.y };

    if (startAnchor === "right") cp1.x += curvature;
    else if (startAnchor === "left") cp1.x -= curvature;
    else if (startAnchor === "bottom") cp1.y += curvature;
    else if (startAnchor === "top") cp1.y -= curvature;
    else cp1.x += dx * 0.4;

    if (endAnchor === "left") cp2.x -= curvature;
    else if (endAnchor === "right") cp2.x += curvature;
    else if (endAnchor === "top") cp2.y -= curvature;
    else if (endAnchor === "bottom") cp2.y += curvature;
    else cp2.x -= dx * 0.4;

    // Midpoint on cubic bezier approximation
    const t = 0.5;
    const midX =
      (1 - t) ** 3 * start.x +
      3 * (1 - t) ** 2 * t * cp1.x +
      3 * (1 - t) * t ** 2 * cp2.x +
      t ** 3 * end.x;
    const midY =
      (1 - t) ** 3 * start.y +
      3 * (1 - t) ** 2 * t * cp1.y +
      3 * (1 - t) * t ** 2 * cp2.y +
      t ** 3 * end.y;

    return {
      pathString: `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`,
      midPoint: { x: midX, y: midY },
    };
  }

  // Orthogonal routing
  const offset = 20;
  const p1 = { ...start };
  const p4 = { ...end };

  // Determine initial directions
  if (startAnchor === "top") p1.y -= offset;
  else if (startAnchor === "bottom") p1.y += offset;
  else if (startAnchor === "left") p1.x -= offset;
  else if (startAnchor === "right") p1.x += offset;

  if (endAnchor === "top") p4.y -= offset;
  else if (endAnchor === "bottom") p4.y += offset;
  else if (endAnchor === "left") p4.x -= offset;
  else if (endAnchor === "right") p4.x += offset;

  let points: Point[] = [start];

  if (startAnchor === "left" || startAnchor === "right") {
    // Horizontal then vertical
    const midX = (p1.x + p4.x) / 2;
    points.push({ x: midX, y: start.y });
    points.push({ x: midX, y: end.y });
  } else if (startAnchor === "top" || startAnchor === "bottom") {
    // Vertical then horizontal
    const midY = (p1.y + p4.y) / 2;
    points.push({ x: start.x, y: midY });
    points.push({ x: end.x, y: midY });
  } else {
    // Fallback: horizontal then vertical
    const midX = (start.x + end.x) / 2;
    points.push({ x: midX, y: start.y });
    points.push({ x: midX, y: end.y });
  }
  points.push(end);

  const d = points
    .map((pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`))
    .join(" ");

  const midIndex = Math.floor(points.length / 2);
  const midPoint = {
    x: (points[midIndex - 1].x + points[midIndex].x) / 2,
    y: (points[midIndex - 1].y + points[midIndex].y) / 2,
  };

  return { pathString: d, midPoint };
}

export function rectsIntersect(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
}

export interface AlignmentGuide {
  orientation: "horizontal" | "vertical";
  pos: number;
}

export function computeAlignmentGuides(
  activeBox: { x: number; y: number; width: number; height: number },
  allShapes: DiagramShape[],
  activeId: string,
  threshold = 5
): { guides: AlignmentGuide[]; snappedDelta: Point } {
  const guides: AlignmentGuide[] = [];
  let deltaX = 0;
  let deltaY = 0;

  const activeCenterX = activeBox.x + activeBox.width / 2;
  const activeRight = activeBox.x + activeBox.width;
  const activeCenterY = activeBox.y + activeBox.height / 2;
  const activeBottom = activeBox.y + activeBox.height;

  for (const s of allShapes) {
    if (s.id === activeId) continue;
    const sCenterX = s.x + s.width / 2;
    const sRight = s.x + s.width;
    const sCenterY = s.y + s.height / 2;
    const sBottom = s.y + s.height;

    // Vertical align (x coordinates)
    if (Math.abs(activeBox.x - s.x) < threshold) {
      deltaX = s.x - activeBox.x;
      guides.push({ orientation: "vertical", pos: s.x });
    } else if (Math.abs(activeCenterX - sCenterX) < threshold) {
      deltaX = sCenterX - activeCenterX;
      guides.push({ orientation: "vertical", pos: sCenterX });
    } else if (Math.abs(activeRight - sRight) < threshold) {
      deltaX = sRight - activeRight;
      guides.push({ orientation: "vertical", pos: sRight });
    }

    // Horizontal align (y coordinates)
    if (Math.abs(activeBox.y - s.y) < threshold) {
      deltaY = s.y - activeBox.y;
      guides.push({ orientation: "horizontal", pos: s.y });
    } else if (Math.abs(activeCenterY - sCenterY) < threshold) {
      deltaY = sCenterY - activeCenterY;
      guides.push({ orientation: "horizontal", pos: sCenterY });
    } else if (Math.abs(activeBottom - sBottom) < threshold) {
      deltaY = sBottom - activeBottom;
      guides.push({ orientation: "horizontal", pos: sBottom });
    }
  }

  return { guides, snappedDelta: { x: deltaX, y: deltaY } };
}

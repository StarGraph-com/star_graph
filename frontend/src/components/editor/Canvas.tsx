import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  DiagramShape,
  DiagramConnector,
  DiagramSettings,
  AnchorPoint,
  Point,
  LineStyle,
  ArrowType,
} from "./types";
import {
  ANCHOR_POINTS,
  getAnchorPoint,
  snapValue,
  rectsIntersect,
  computeAlignmentGuides,
  AlignmentGuide,
} from "./geometry";
import { ShapeRenderer } from "./shapes/ShapeRenderer";
import { ConnectorRenderer } from "./connectors/ConnectorRenderer";
import { ConnectorMarkers } from "./connectors/ConnectorMarkers";

interface CanvasProps {
  shapes: DiagramShape[];
  connectors: DiagramConnector[];
  settings: DiagramSettings;
  viewport: { panX: number; panY: number; zoom: number };
  onUpdateViewport: (viewport: { panX: number; panY: number; zoom: number }) => void;
  selectedShapeIds: string[];
  selectedConnectorId: string | null;
  onSelectShapes: (ids: string[]) => void;
  onSelectConnector: (id: string | null) => void;
  onUpdateShapes: (
    updated: DiagramShape[],
    pushHistory?: boolean,
    historySnapshot?: { shapes: DiagramShape[]; connectors: DiagramConnector[] }
  ) => void;
  onUpdateConnector: (updated: DiagramConnector, pushHistory?: boolean) => void;
  onAddConnector: (connector: DiagramConnector) => void;
  onAddShapeFromDrop?: (shapeType: string, point: Point) => void;
  activeConnectorPreset?: {
    style: LineStyle;
    startArrow: ArrowType;
    endArrow: ArrowType;
    dashed: boolean;
    label?: string;
  };
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onCopySelected: () => void;
  onPaste: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function Canvas({
  shapes,
  connectors,
  settings,
  viewport,
  onUpdateViewport,
  selectedShapeIds,
  selectedConnectorId,
  onSelectShapes,
  onSelectConnector,
  onUpdateShapes,
  onUpdateConnector,
  onAddConnector,
  onAddShapeFromDrop,
  activeConnectorPreset,
  onDeleteSelected,
  onDuplicateSelected,
  onCopySelected,
  onPaste,
  onUndo,
  onRedo,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);
  const [hoveredAnchor, setHoveredAnchor] = useState<{ shapeId: string; point: AnchorPoint } | null>(null);

  // Interaction mode
  const [mode, setMode] = useState<
    "idle" | "panning" | "dragging" | "resizing" | "rotating" | "marquee" | "connecting"
  >("idle");

  const [dragStartMouse, setDragStartMouse] = useState<Point>({ x: 0, y: 0 });
  const [initialShapePositions, setInitialShapePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [initialResizeBox, setInitialResizeBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Connecting
  const [connectingFrom, setConnectingFrom] = useState<{ shapeId: string; point: AnchorPoint } | null>(null);
  const [connectingMouse, setConnectingMouse] = useState<Point>({ x: 0, y: 0 });

  // Marquee
  const [marqueeStart, setMarqueeStart] = useState<Point | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<Point | null>(null);

  // Inline editing
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
  const [editingShapeText, setEditingShapeText] = useState("");
  const [editingConnectorId, setEditingConnectorId] = useState<string | null>(null);
  const [editingConnectorText, setEditingConnectorText] = useState("");

  // Alignment Guides
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

  // Space key tracking for panning
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Screen to Canvas coords
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = screenX - rect.left;
      const clientY = screenY - rect.top;
      return {
        x: (clientX - viewport.panX) / viewport.zoom,
        y: (clientY - viewport.panY) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Drag/Resize/Rotate snapshot before interaction begins, for Undo history
  const dragStartSnapshotRef = useRef<{
    shapes: DiagramShape[];
    connectors: DiagramConnector[];
  } | null>(null);

  // Refs for keyboard shortcuts to always have fresh state without re-attaching window listeners
  const shortcutsRef = useRef({
    shapes,
    connectors,
    selectedShapeIds,
    onDeleteSelected,
    onSelectShapes,
    onSelectConnector,
    onUndo,
    onRedo,
    onCopySelected,
    onPaste,
    onDuplicateSelected,
    onUpdateShapes,
  });

  useEffect(() => {
    shortcutsRef.current = {
      shapes,
      connectors,
      selectedShapeIds,
      onDeleteSelected,
      onSelectShapes,
      onSelectConnector,
      onUndo,
      onRedo,
      onCopySelected,
      onPaste,
      onDuplicateSelected,
      onUpdateShapes,
    };
  });

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const {
        shapes: curShapes,
        connectors: curConnectors,
        selectedShapeIds: curSelectedIds,
        onDeleteSelected: curDelete,
        onSelectShapes: curSelectShapes,
        onSelectConnector: curSelectConnector,
        onUndo: curUndo,
        onRedo: curRedo,
        onCopySelected: curCopy,
        onPaste: curPaste,
        onDuplicateSelected: curDuplicate,
        onUpdateShapes: curUpdateShapes,
      } = shortcutsRef.current;

      if (e.code === "Space") {
        setIsSpacePressed(true);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        curDelete();
      } else if (e.key === "Escape") {
        if (dragStartSnapshotRef.current && (mode === "dragging" || mode === "resizing" || mode === "rotating")) {
          curUpdateShapes(dragStartSnapshotRef.current.shapes, false);
          dragStartSnapshotRef.current = null;
        }
        curSelectShapes([]);
        curSelectConnector(null);
        setEditingShapeId(null);
        setEditingConnectorId(null);
        setMode("idle");
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) curRedo();
        else curUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        // Standard Windows Redo shortcut
        e.preventDefault();
        curRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        curCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        curPaste();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        curDuplicate();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        curSelectShapes(curShapes.map((s) => s.id));
      } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (curSelectedIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 2;
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          const updated = curShapes.map((s) =>
            curSelectedIds.includes(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s
          );
          curUpdateShapes(updated, true, {
            shapes: curShapes,
            connectors: curConnectors,
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Keep refs for viewport & callbacks to avoid stale closures in native wheel listener
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const onUpdateViewportRef = useRef(onUpdateViewport);
  onUpdateViewportRef.current = onUpdateViewport;

  // Native non-passive Wheel listener to prevent native browser page zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      // Critical: e.preventDefault() on a non-passive listener prevents the browser from zooming the webpage
      e.preventDefault();
      e.stopPropagation();

      const currentViewport = viewportRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        // Zoom centered on cursor position
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        const newZoom = Math.min(3, Math.max(0.2, currentViewport.zoom * zoomFactor));

        const newPanX = mouseX - (mouseX - currentViewport.panX) * (newZoom / currentViewport.zoom);
        const newPanY = mouseY - (mouseY - currentViewport.panY) * (newZoom / currentViewport.zoom);

        onUpdateViewportRef.current({
          panX: newPanX,
          panY: newPanY,
          zoom: newZoom,
        });
      } else {
        // Pan canvas
        onUpdateViewportRef.current({
          panX: currentViewport.panX - e.deltaX,
          panY: currentViewport.panY - e.deltaY,
          zoom: currentViewport.zoom,
        });
      }
    };

    container.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheelNative);
    };
  }, []);

  // Canvas Mouse Down
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return; // Only left or middle click
    const canvasPt = screenToCanvas(e.clientX, e.clientY);

    // If space pressed or middle click, pan
    if (isSpacePressed || e.button === 1) {
      setMode("panning");
      setDragStartMouse({ x: e.clientX, y: e.clientY });
      return;
    }

    // Deselect if clicking on empty canvas
    onSelectShapes([]);
    onSelectConnector(null);
    setEditingShapeId(null);
    setEditingConnectorId(null);

    // Start Marquee
    setMode("marquee");
    setMarqueeStart(canvasPt);
    setMarqueeCurrent(canvasPt);
  };

  // Shape Mouse Down (Move)
  const handleShapeMouseDown = (e: React.MouseEvent, shape: DiagramShape) => {
    if (isSpacePressed) return;
    e.stopPropagation();

    onSelectConnector(null);

    let newSelected = [...selectedShapeIds];
    if (e.shiftKey) {
      if (newSelected.includes(shape.id)) {
        newSelected = newSelected.filter((id) => id !== shape.id);
      } else {
        newSelected.push(shape.id);
      }
    } else {
      if (!newSelected.includes(shape.id)) {
        newSelected = [shape.id];
      }
    }
    onSelectShapes(newSelected);

    // Prepare dragging
    setMode("dragging");
    setDragStartMouse(screenToCanvas(e.clientX, e.clientY));

    // Store snapshot before starting to drag
    dragStartSnapshotRef.current = {
      shapes: JSON.parse(JSON.stringify(shapes)),
      connectors: JSON.parse(JSON.stringify(connectors)),
    };

    const initialMap: Record<string, { x: number; y: number }> = {};
    for (const id of newSelected) {
      const s = shapes.find((item) => item.id === id);
      if (s) initialMap[id] = { x: s.x, y: s.y };
    }
    setInitialShapePositions(initialMap);
  };

  // Anchor Mouse Down (Start Connecting)
  const handleAnchorMouseDown = (
    e: React.MouseEvent,
    shapeId: string,
    point: AnchorPoint
  ) => {
    e.stopPropagation();
    const canvasPt = screenToCanvas(e.clientX, e.clientY);
    setMode("connecting");
    setConnectingFrom({ shapeId, point });
    setConnectingMouse(canvasPt);
  };

  // Resize Handle Mouse Down
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string, primaryShape: DiagramShape) => {
    e.stopPropagation();
    setMode("resizing");
    setResizeHandle(handle);
    setDragStartMouse(screenToCanvas(e.clientX, e.clientY));
    dragStartSnapshotRef.current = {
      shapes: JSON.parse(JSON.stringify(shapes)),
      connectors: JSON.parse(JSON.stringify(connectors)),
    };
    setInitialResizeBox({
      x: primaryShape.x,
      y: primaryShape.y,
      width: primaryShape.width,
      height: primaryShape.height,
    });
  };

  // Rotate Handle Mouse Down
  const handleRotateMouseDown = (e: React.MouseEvent, primaryShape: DiagramShape) => {
    e.stopPropagation();
    setMode("rotating");
    setDragStartMouse(screenToCanvas(e.clientX, e.clientY));
    dragStartSnapshotRef.current = {
      shapes: JSON.parse(JSON.stringify(shapes)),
      connectors: JSON.parse(JSON.stringify(connectors)),
    };
    setInitialResizeBox({
      x: primaryShape.x,
      y: primaryShape.y,
      width: primaryShape.width,
      height: primaryShape.height,
    });
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    const currentCanvasPt = screenToCanvas(e.clientX, e.clientY);

    // 1. Panning
    if (mode === "panning") {
      const dx = e.clientX - dragStartMouse.x;
      const dy = e.clientY - dragStartMouse.y;
      setDragStartMouse({ x: e.clientX, y: e.clientY });
      onUpdateViewport({
        panX: viewport.panX + dx,
        panY: viewport.panY + dy,
        zoom: viewport.zoom,
      });
      return;
    }

    // 2. Connecting
    if (mode === "connecting") {
      setConnectingMouse(currentCanvasPt);
      return;
    }

    // 3. Marquee
    if (mode === "marquee" && marqueeStart) {
      setMarqueeCurrent(currentCanvasPt);
      return;
    }

    // 4. Dragging Shapes
    if (mode === "dragging") {
      let rawDx = currentCanvasPt.x - dragStartMouse.x;
      let rawDy = currentCanvasPt.y - dragStartMouse.y;

      // Smart Alignment Guides & Snapping for the primary selected shape
      const primaryId = selectedShapeIds[0];
      const primaryShape = shapes.find((s) => s.id === primaryId);

      if (primaryShape && initialShapePositions[primaryId]) {
        let proposedX = initialShapePositions[primaryId].x + rawDx;
        let proposedY = initialShapePositions[primaryId].y + rawDy;

        if (settings.snapToGrid) {
          proposedX = snapValue(proposedX, settings.gridSize, true);
          proposedY = snapValue(proposedY, settings.gridSize, true);
          rawDx = proposedX - initialShapePositions[primaryId].x;
          rawDy = proposedY - initialShapePositions[primaryId].y;
        }

        const candidateBox = {
          x: proposedX,
          y: proposedY,
          width: primaryShape.width,
          height: primaryShape.height,
        };

        const { guides, snappedDelta } = computeAlignmentGuides(candidateBox, shapes, primaryId);
        setAlignmentGuides(guides);
        rawDx += snappedDelta.x;
        rawDy += snappedDelta.y;
      }

      const updated = shapes.map((s) => {
        if (selectedShapeIds.includes(s.id) && initialShapePositions[s.id]) {
          return {
            ...s,
            x: Math.round(initialShapePositions[s.id].x + rawDx),
            y: Math.round(initialShapePositions[s.id].y + rawDy),
          };
        }
        return s;
      });

      onUpdateShapes(updated, false);
      return;
    }

    // 5. Resizing
    if (mode === "resizing" && resizeHandle && initialResizeBox && selectedShapeIds[0]) {
      const primaryId = selectedShapeIds[0];
      const s = shapes.find((item) => item.id === primaryId);
      if (!s) return;

      const dx = currentCanvasPt.x - dragStartMouse.x;
      const dy = currentCanvasPt.y - dragStartMouse.y;

      let { x, y, width, height } = initialResizeBox;

      if (resizeHandle.includes("e")) width += dx;
      if (resizeHandle.includes("s")) height += dy;
      if (resizeHandle.includes("w")) {
        width -= dx;
        x += dx;
      }
      if (resizeHandle.includes("n")) {
        height -= dy;
        y += dy;
      }

      width = Math.max(40, width);
      height = Math.max(30, height);

      if (settings.snapToGrid) {
        width = snapValue(width, settings.gridSize, true);
        height = snapValue(height, settings.gridSize, true);
      }

      const updated = shapes.map((item) =>
        item.id === primaryId ? { ...item, x, y, width, height } : item
      );
      onUpdateShapes(updated, false);
      return;
    }

    // 6. Rotating
    if (mode === "rotating" && initialResizeBox && selectedShapeIds[0]) {
      const primaryId = selectedShapeIds[0];
      const s = shapes.find((item) => item.id === primaryId);
      if (!s) return;

      const centerX = s.x + s.width / 2;
      const centerY = s.y + s.height / 2;
      const radians = Math.atan2(currentCanvasPt.y - centerY, currentCanvasPt.x - centerX);
      let degrees = Math.round(radians * (180 / Math.PI)) + 90;
      if (degrees < 0) degrees += 360;

      // Snap to 15 deg if shift held
      if (e.shiftKey) degrees = Math.round(degrees / 15) * 15;

      const updated = shapes.map((item) =>
        item.id === primaryId ? { ...item, rotation: degrees } : item
      );
      onUpdateShapes(updated, false);
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    if (mode === "dragging" || mode === "resizing" || mode === "rotating") {
      const snapshot = dragStartSnapshotRef.current;
      if (snapshot) {
        let hasMoved = false;
        for (const s of shapes) {
          const oldS = snapshot.shapes.find((item) => item.id === s.id);
          if (
            !oldS ||
            oldS.x !== s.x ||
            oldS.y !== s.y ||
            oldS.width !== s.width ||
            oldS.height !== s.height ||
            oldS.rotation !== s.rotation
          ) {
            hasMoved = true;
            break;
          }
        }
        if (hasMoved) {
          // Pass pre-drag snapshot so Undo (Ctrl+Z) restores the exact previous position!
          onUpdateShapes([...shapes], true, snapshot);
        }
      }
      dragStartSnapshotRef.current = null;
    }

    if (mode === "marquee" && marqueeStart && marqueeCurrent) {
      const box = {
        x: Math.min(marqueeStart.x, marqueeCurrent.x),
        y: Math.min(marqueeStart.y, marqueeCurrent.y),
        width: Math.abs(marqueeCurrent.x - marqueeStart.x),
        height: Math.abs(marqueeCurrent.y - marqueeStart.y),
      };

      if (box.width > 4 || box.height > 4) {
        const enclosed = shapes
          .filter((s) => rectsIntersect(box, { x: s.x, y: s.y, width: s.width, height: s.height }))
          .map((s) => s.id);
        onSelectShapes(enclosed);
      }
    }

    if (mode === "connecting" && connectingFrom && hoveredAnchor) {
      if (hoveredAnchor.shapeId !== connectingFrom.shapeId) {
        const newConnector: DiagramConnector = {
          id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          from: { shapeId: connectingFrom.shapeId, point: connectingFrom.point },
          to: { shapeId: hoveredAnchor.shapeId, point: hoveredAnchor.point },
          style: activeConnectorPreset?.style || "orthogonal",
          startArrow: activeConnectorPreset?.startArrow || "none",
          endArrow: activeConnectorPreset?.endArrow || "arrow",
          dashed: activeConnectorPreset?.dashed || false,
          stroke: "#64748B",
          strokeWidth: 1.5,
          label: activeConnectorPreset?.label,
        };
        onAddConnector(newConnector);
      }
    }

    setMode("idle");
    setConnectingFrom(null);
    setMarqueeStart(null);
    setMarqueeCurrent(null);
    setAlignmentGuides([]);
    setResizeHandle(null);
    setInitialResizeBox(null);
  };

  // Window mouseup listener to guarantee drag/resize/rotate commits even when mouse leaves canvas
  const handleMouseUpRef = useRef(handleMouseUp);
  handleMouseUpRef.current = handleMouseUp;

  useEffect(() => {
    const onWindowMouseUp = () => {
      handleMouseUpRef.current();
    };
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => {
      window.removeEventListener("mouseup", onWindowMouseUp);
    };
  }, []);

  // Drop from shape library
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const shapeType = e.dataTransfer.getData("application/stargraph-shape");
    if (!shapeType || !onAddShapeFromDrop) return;
    const pt = screenToCanvas(e.clientX, e.clientY);
    const finalPt = settings.snapToGrid
      ? {
          x: snapValue(pt.x, settings.gridSize, true),
          y: snapValue(pt.y, settings.gridSize, true),
        }
      : pt;
    onAddShapeFromDrop(shapeType, finalPt);
  };

  // Primary selected shape for handles
  const primarySelectedShape =
    selectedShapeIds.length === 1
      ? shapes.find((s) => s.id === selectedShapeIds[0])
      : null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden ${
        isSpacePressed || mode === "panning" ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      }`}
      style={{ backgroundColor: settings.backgroundColor }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <svg
        className="w-full h-full absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      >
        <ConnectorMarkers />

        {/* Dotted Grid Pattern */}
        {settings.showGrid && (
          <defs>
            <pattern
              id="dot-grid"
              width={settings.gridSize * viewport.zoom}
              height={settings.gridSize * viewport.zoom}
              patternUnits="userSpaceOnUse"
              x={viewport.panX % (settings.gridSize * viewport.zoom)}
              y={viewport.panY % (settings.gridSize * viewport.zoom)}
            >
              <circle
                cx={(settings.gridSize * viewport.zoom) / 2}
                cy={(settings.gridSize * viewport.zoom) / 2}
                r={1}
                fill="#CBD5E1"
              />
            </pattern>
          </defs>
        )}

        {/* Render Background Grid */}
        {settings.showGrid && (
          <rect width="100%" height="100%" fill="url(#dot-grid)" className="pointer-events-none" />
        )}

        {/* Viewport Transform Group */}
        <g transform={`translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom})`}>
          {/* Alignment Guides */}
          {alignmentGuides.map((guide, idx) => (
            <line
              key={idx}
              x1={guide.orientation === "vertical" ? guide.pos : -5000}
              y1={guide.orientation === "horizontal" ? guide.pos : -5000}
              x2={guide.orientation === "vertical" ? guide.pos : 15000}
              y2={guide.orientation === "horizontal" ? guide.pos : 15000}
              stroke="#6366F1"
              strokeWidth={1}
              strokeDasharray="4,4"
              className="pointer-events-none"
            />
          ))}

          {/* Connectors Layer */}
          <g className="connectors-layer">
            {connectors.map((connector) => (
              <ConnectorRenderer
                key={connector.id}
                connector={connector}
                shapes={shapes}
                isSelected={selectedConnectorId === connector.id}
                onSelect={() => {
                  onSelectShapes([]);
                  onSelectConnector(connector.id);
                }}
                onDoubleClickLabel={() => {
                  setEditingConnectorId(connector.id);
                  setEditingConnectorText(connector.label || "");
                }}
              />
            ))}

            {/* Connecting in-flight line */}
            {mode === "connecting" && connectingFrom && (
              <line
                x1={(() => {
                  const s = shapes.find((item) => item.id === connectingFrom.shapeId);
                  return s ? getAnchorPoint(s, connectingFrom.point).x : 0;
                })()}
                y1={(() => {
                  const s = shapes.find((item) => item.id === connectingFrom.shapeId);
                  return s ? getAnchorPoint(s, connectingFrom.point).y : 0;
                })()}
                x2={connectingMouse.x}
                y2={connectingMouse.y}
                stroke="#6366F1"
                strokeWidth={2}
                strokeDasharray="5,4"
                className="pointer-events-none"
              />
            )}
          </g>

          {/* Shapes Layer */}
          <g className="shapes-layer">
            {shapes.map((shape) => {
              const isSelected = selectedShapeIds.includes(shape.id);
              const isHovered = hoveredShapeId === shape.id;

              return (
                <g
                  key={shape.id}
                  transform={`translate(${shape.x}, ${shape.y}) rotate(${shape.rotation || 0}, ${
                    shape.width / 2
                  }, ${shape.height / 2})`}
                  className="pointer-events-auto cursor-move"
                  onMouseEnter={() => setHoveredShapeId(shape.id)}
                  onMouseLeave={() => {
                    if (hoveredShapeId === shape.id) setHoveredShapeId(null);
                  }}
                  onMouseDown={(e) => handleShapeMouseDown(e, shape)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingShapeId(shape.id);
                    setEditingShapeText(shape.label);
                  }}
                >
                  <ShapeRenderer
                    shape={shape}
                    isSelected={isSelected}
                    onAddCompartmentLine={(shapeId, section) => {
                      const updated = shapes.map((s) => {
                        if (s.id !== shapeId) return s;
                        if (section === "attributes") {
                          return {
                            ...s,
                            attributes: [...(s.attributes || []), "- newAttribute: Type"],
                            height: Math.max(s.height, s.height + 22),
                          };
                        } else {
                          return {
                            ...s,
                            methods: [...(s.methods || []), "+ newMethod(): Void"],
                            height: Math.max(s.height, s.height + 22),
                          };
                        }
                      });
                      onUpdateShapes(updated, true);
                    }}
                  />

                  {/* Anchor Connection Points (Shown on hover or when connecting) */}
                  {(isHovered || mode === "connecting") &&
                    ANCHOR_POINTS.map((anchor) => {
                      // Relative to shape
                      const pt = getAnchorPoint({ ...shape, x: 0, y: 0 }, anchor);
                      const isPointHovered =
                        hoveredAnchor?.shapeId === shape.id && hoveredAnchor.point === anchor;

                      return (
                        <circle
                          key={anchor}
                          cx={pt.x}
                          cy={pt.y}
                          r={isPointHovered ? 6 : 4.5}
                          fill={isPointHovered ? "#4338CA" : "#6366F1"}
                          stroke="#FFFFFF"
                          strokeWidth={1.5}
                          className="cursor-crosshair pointer-events-auto transition-transform"
                          onMouseEnter={() => setHoveredAnchor({ shapeId: shape.id, point: anchor })}
                          onMouseLeave={() => setHoveredAnchor(null)}
                          onMouseDown={(e) => handleAnchorMouseDown(e, shape.id, anchor)}
                        />
                      );
                    })}
                </g>
              );
            })}
          </g>

          {/* Bounding Box & Handles for Single Selection */}
          {primarySelectedShape && mode !== "dragging" && (
            <g
              transform={`translate(${primarySelectedShape.x}, ${primarySelectedShape.y}) rotate(${
                primarySelectedShape.rotation || 0
              }, ${primarySelectedShape.width / 2}, ${primarySelectedShape.height / 2})`}
              className="pointer-events-auto"
            >
              <rect
                x={-2}
                y={-2}
                width={primarySelectedShape.width + 4}
                height={primarySelectedShape.height + 4}
                fill="none"
                stroke="#6366F1"
                strokeWidth={1}
                strokeDasharray="4,3"
                className="pointer-events-none"
              />

              {/* 8 Resize Handles */}
              {[
                { name: "nw", x: -4, y: -4, cursor: "nwse-resize" },
                { name: "n", x: primarySelectedShape.width / 2 - 4, y: -4, cursor: "ns-resize" },
                { name: "ne", x: primarySelectedShape.width - 4, y: -4, cursor: "nesw-resize" },
                { name: "e", x: primarySelectedShape.width - 4, y: primarySelectedShape.height / 2 - 4, cursor: "ew-resize" },
                { name: "se", x: primarySelectedShape.width - 4, y: primarySelectedShape.height - 4, cursor: "nwse-resize" },
                { name: "s", x: primarySelectedShape.width / 2 - 4, y: primarySelectedShape.height - 4, cursor: "ns-resize" },
                { name: "sw", x: -4, y: primarySelectedShape.height - 4, cursor: "nesw-resize" },
                { name: "w", x: -4, y: primarySelectedShape.height / 2 - 4, cursor: "ew-resize" },
              ].map((h) => (
                <rect
                  key={h.name}
                  x={h.x}
                  y={h.y}
                  width={8}
                  height={8}
                  fill="#FFFFFF"
                  stroke="#6366F1"
                  strokeWidth={1.5}
                  style={{ cursor: h.cursor }}
                  onMouseDown={(e) => handleResizeMouseDown(e, h.name, primarySelectedShape)}
                />
              ))}

              {/* Rotate Handle */}
              <g
                transform={`translate(${primarySelectedShape.width / 2}, -22)`}
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => handleRotateMouseDown(e, primarySelectedShape)}
              >
                <line x1={0} y1={20} x2={0} y2={4} stroke="#6366F1" strokeWidth={1} />
                <circle cx={0} cy={0} r={4.5} fill="#FFFFFF" stroke="#6366F1" strokeWidth={1.5} />
              </g>
            </g>
          )}

          {/* Marquee Selection Rectangle */}
          {mode === "marquee" && marqueeStart && marqueeCurrent && (
            <rect
              x={Math.min(marqueeStart.x, marqueeCurrent.x)}
              y={Math.min(marqueeStart.y, marqueeCurrent.y)}
              width={Math.abs(marqueeCurrent.x - marqueeStart.x)}
              height={Math.abs(marqueeCurrent.y - marqueeStart.y)}
              fill="rgba(99, 102, 241, 0.08)"
              stroke="#6366F1"
              strokeWidth={1}
              strokeDasharray="4,4"
              className="pointer-events-none"
            />
          )}
        </g>
      </svg>

      {/* Inline Text Editor Overlay for Shapes */}
      {editingShapeId && (() => {
        const shape = shapes.find((s) => s.id === editingShapeId);
        if (!shape) return null;
        const screenX = shape.x * viewport.zoom + viewport.panX;
        const screenY = shape.y * viewport.zoom + viewport.panY;
        const screenW = shape.width * viewport.zoom;
        const screenH = shape.height * viewport.zoom;

        return (
          <div
            className="absolute z-50 flex items-center justify-center pointer-events-auto"
            style={{
              left: screenX,
              top: screenY,
              width: screenW,
              height: screenH,
            }}
          >
            <input
              type="text"
              autoFocus
              value={editingShapeText}
              onChange={(e) => setEditingShapeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onUpdateShapes(
                    shapes.map((s) => (s.id === editingShapeId ? { ...s, label: editingShapeText } : s)),
                    true
                  );
                  setEditingShapeId(null);
                } else if (e.key === "Escape") {
                  setEditingShapeId(null);
                }
              }}
              onBlur={() => {
                onUpdateShapes(
                  shapes.map((s) => (s.id === editingShapeId ? { ...s, label: editingShapeText } : s)),
                  true
                );
                setEditingShapeId(null);
              }}
              className="w-full text-center bg-white border border-[#6366F1] rounded px-1 py-0.5 shadow-md outline-none text-xs text-slate-800"
            />
          </div>
        );
      })()}

      {/* Inline Text Editor Overlay for Connectors */}
      {editingConnectorId && (() => {
        const conn = connectors.find((c) => c.id === editingConnectorId);
        if (!conn) return null;
        const fromShape = shapes.find((s) => s.id === conn.from.shapeId);
        const toShape = shapes.find((s) => s.id === conn.to.shapeId);
        if (!fromShape || !toShape) return null;

        const startPt = getAnchorPoint(fromShape, conn.from.point);
        const endPt = getAnchorPoint(toShape, conn.to.point);
        const midX = ((startPt.x + endPt.x) / 2) * viewport.zoom + viewport.panX;
        const midY = ((startPt.y + endPt.y) / 2) * viewport.zoom + viewport.panY;

        return (
          <div
            className="absolute z-50 flex items-center justify-center pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: midX, top: midY }}
          >
            <input
              type="text"
              autoFocus
              value={editingConnectorText}
              onChange={(e) => setEditingConnectorText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onUpdateConnector({ ...conn, label: editingConnectorText }, true);
                  setEditingConnectorId(null);
                } else if (e.key === "Escape") {
                  setEditingConnectorId(null);
                }
              }}
              onBlur={() => {
                onUpdateConnector({ ...conn, label: editingConnectorText }, true);
                setEditingConnectorId(null);
              }}
              placeholder="Connector label..."
              className="bg-white border border-[#6366F1] rounded px-2 py-0.5 shadow-md outline-none text-xs text-slate-800 w-36 text-center"
            />
          </div>
        );
      })()}
    </div>
  );
}

import React from "react";
import { DiagramConnector, DiagramShape } from "../types";
import { calculateConnectorPath, getAnchorPoint } from "../geometry";
import { getMarkerUrl } from "./ConnectorMarkers";

interface ConnectorRendererProps {
  connector: DiagramConnector;
  shapes: DiagramShape[];
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClickLabel?: () => void;
}

export function ConnectorRenderer({
  connector,
  shapes,
  isSelected,
  onSelect,
  onDoubleClickLabel,
}: ConnectorRendererProps) {
  const fromShape = shapes.find((s) => s.id === connector.from.shapeId);
  const toShape = shapes.find((s) => s.id === connector.to.shapeId);

  if (!fromShape || !toShape) return null;

  const startPt = getAnchorPoint(fromShape, connector.from.point);
  const endPt = getAnchorPoint(toShape, connector.to.point);

  const { pathString, midPoint } = calculateConnectorPath(
    startPt,
    endPt,
    connector.from.point,
    connector.to.point,
    connector.style
  );

  const startMarker = getMarkerUrl(connector.startArrow, true);
  const endMarker = getMarkerUrl(connector.endArrow, false);

  // Multiplicity label positioning
  const startLabelPos = {
    x: startPt.x + (connector.from.point === "right" ? 14 : connector.from.point === "left" ? -14 : 0),
    y: startPt.y + (connector.from.point === "bottom" ? 14 : connector.from.point === "top" ? -14 : -8),
  };

  const endLabelPos = {
    x: endPt.x + (connector.to.point === "right" ? 14 : connector.to.point === "left" ? -14 : 0),
    y: endPt.y + (connector.to.point === "bottom" ? 14 : connector.to.point === "top" ? -14 : -8),
  };

  return (
    <g
      className="cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e);
      }}
    >
      {/* Invisible wider path for easy clicking / hover */}
      <path
        d={pathString}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        className="pointer-events-auto"
      />

      {/* Glow / Selection outline */}
      {isSelected && (
        <path
          d={pathString}
          fill="none"
          stroke="#6366F1"
          strokeWidth={connector.strokeWidth + 4}
          strokeOpacity={0.35}
        />
      )}

      {/* Main connector path */}
      <path
        d={pathString}
        fill="none"
        stroke={isSelected ? "#6366F1" : connector.stroke}
        strokeWidth={connector.strokeWidth}
        strokeDasharray={connector.dashed ? "6,4" : undefined}
        markerStart={startMarker}
        markerEnd={endMarker}
        style={{ color: isSelected ? "#6366F1" : connector.stroke }}
        className="transition-colors"
      />

      {/* Middle Label */}
      {connector.label && (
        <g
          transform={`translate(${midPoint.x}, ${midPoint.y})`}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onDoubleClickLabel?.();
          }}
          className="cursor-text"
        >
          <rect
            x={-((connector.label.length * 6.5 + 16) / 2)}
            y={-10}
            width={connector.label.length * 6.5 + 16}
            height={20}
            rx={4}
            fill="#FFFFFF"
            stroke={isSelected ? "#6366F1" : "#E2E8F0"}
            strokeWidth={1}
            className="shadow-xs"
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fill="#334155"
            fontSize={11}
            fontFamily="Inter, sans-serif"
            fontWeight={500}
            className="select-none"
          >
            {connector.label}
          </text>
        </g>
      )}

      {/* Start Multiplicity Label */}
      {connector.startLabel && (
        <text
          x={startLabelPos.x}
          y={startLabelPos.y}
          textAnchor="middle"
          fill="#475569"
          fontSize={10}
          fontFamily="monospace"
          fontWeight={600}
          className="select-none pointer-events-none"
        >
          {connector.startLabel}
        </text>
      )}

      {/* End Multiplicity Label */}
      {connector.endLabel && (
        <text
          x={endLabelPos.x}
          y={endLabelPos.y}
          textAnchor="middle"
          fill="#475569"
          fontSize={10}
          fontFamily="monospace"
          fontWeight={600}
          className="select-none pointer-events-none"
        >
          {connector.endLabel}
        </text>
      )}
    </g>
  );
}

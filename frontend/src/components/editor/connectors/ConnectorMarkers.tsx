import React from "react";

export function ConnectorMarkers() {
  return (
    <defs>
      {/* Standard Filled Arrow */}
      <marker
        id="marker-arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="8"
        markerHeight="8"
        orient="auto-start-reverse"
      >
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="currentColor" />
      </marker>

      {/* Open Arrow */}
      <marker
        id="marker-open_arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="8"
        markerHeight="8"
        orient="auto-start-reverse"
      >
        <path d="M 1 1.5 L 9 5 L 1 8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </marker>

      {/* Hollow Triangle (UML Inheritance / Generalization) */}
      <marker
        id="marker-hollow_triangle"
        viewBox="0 0 12 12"
        refX="11"
        refY="6"
        markerWidth="10"
        markerHeight="10"
        orient="auto-start-reverse"
      >
        <path d="M 1 1.5 L 11 6 L 1 10.5 z" fill="#FFFFFF" stroke="currentColor" strokeWidth="1.5" />
      </marker>

      {/* Filled Diamond (UML Composition) */}
      <marker
        id="marker-filled_diamond"
        viewBox="0 0 16 10"
        refX="15"
        refY="5"
        markerWidth="12"
        markerHeight="9"
        orient="auto-start-reverse"
      >
        <path d="M 0 5 L 8 1.5 L 16 5 L 8 8.5 z" fill="currentColor" />
      </marker>

      {/* Hollow Diamond (UML Aggregation) */}
      <marker
        id="marker-hollow_diamond"
        viewBox="0 0 16 10"
        refX="15"
        refY="5"
        markerWidth="12"
        markerHeight="9"
        orient="auto-start-reverse"
      >
        <path d="M 0 5 L 8 1.5 L 16 5 L 8 8.5 z" fill="#FFFFFF" stroke="currentColor" strokeWidth="1.5" />
      </marker>

      {/* Crow's Foot One (Mandatory One in ERD) */}
      <marker
        id="marker-crows_foot_one"
        viewBox="0 0 12 12"
        refX="10"
        refY="6"
        markerWidth="10"
        markerHeight="10"
        orient="auto-start-reverse"
      >
        <path d="M 4 2 L 4 10 M 8 2 L 8 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </marker>

      {/* Crow's Foot Many (Zero or More in ERD) */}
      <marker
        id="marker-crows_foot_many"
        viewBox="0 0 14 14"
        refX="12"
        refY="7"
        markerWidth="11"
        markerHeight="11"
        orient="auto-start-reverse"
      >
        <path d="M 1 2 L 12 7 L 1 12 M 1 7 L 12 7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </marker>
    </defs>
  );
}

export function getMarkerUrl(arrowType: string, isStart = false): string | undefined {
  if (!arrowType || arrowType === "none") return undefined;
  return `url(#marker-${arrowType})`;
}

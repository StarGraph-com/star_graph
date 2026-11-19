import React from "react";
import { DiagramShape } from "../types";

interface ShapeRendererProps {
  shape: DiagramShape;
  isSelected: boolean;
  onAttributeClick?: (shapeId: string, attrIndex: number, section: "attributes" | "methods") => void;
  onAddCompartmentLine?: (shapeId: string, section: "attributes" | "methods") => void;
}

export function ShapeRenderer({ shape, isSelected, onAddCompartmentLine }: ShapeRendererProps) {
  const { id, type, width, height, label, style, textStyle } = shape;
  const strokeColor = isSelected ? "#6366F1" : style.stroke;
  const strokeWidth = isSelected ? Math.max(2, style.strokeWidth) : style.strokeWidth;
  const dashArray = style.strokeDash ? "5,5" : undefined;
  const shadowFilter = style.shadow ? "drop-shadow(0px 2px 4px rgba(0,0,0,0.06))" : undefined;

  const commonStyle: React.CSSProperties = {
    fill: style.fill,
    stroke: strokeColor,
    strokeWidth,
    strokeDasharray: dashArray,
    opacity: style.opacity,
    filter: shadowFilter,
    transition: "stroke 0.15s, stroke-width 0.15s",
  };

  const textCommonStyle: React.CSSProperties = {
    fontSize: textStyle.fontSize,
    fontFamily: textStyle.fontFamily,
    fill: textStyle.color,
    fontWeight: textStyle.bold ? "bold" : "normal",
    fontStyle: textStyle.italic ? "italic" : "normal",
    textDecoration: textStyle.underline ? "underline" : "none",
    pointerEvents: "none",
    userSelect: "none",
  };

  // 1. UML Class with 3 compartments
  if (type === "uml_class" || type === "uml_interface" || type === "uml_enum") {
    const isInterface = type === "uml_interface";
    const isEnum = type === "uml_enum";
    const headerHeight = shape.stereotype || isInterface || isEnum ? 44 : 34;
    const attributes = shape.attributes || [];
    const methods = shape.methods || [];
    const attrHeight = Math.max(30, attributes.length * 18 + 12);

    return (
      <g>
        {/* Main Outer Box */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={style.cornerRadius}
          ry={style.cornerRadius}
          style={commonStyle}
        />

        {/* Header Compartment */}
        <path
          d={`M 0 ${headerHeight} L ${width} ${headerHeight}`}
          stroke={strokeColor}
          strokeWidth={1}
        />
        {shape.stereotype && (
          <text
            x={width / 2}
            y={16}
            textAnchor="middle"
            style={{ ...textCommonStyle, fontSize: 10, fill: "#64748B", fontStyle: "italic" }}
          >
            «{shape.stereotype}»
          </text>
        )}
        {isInterface && (
          <text
            x={width / 2}
            y={16}
            textAnchor="middle"
            style={{ ...textCommonStyle, fontSize: 10, fill: "#64748B", fontStyle: "italic" }}
          >
            «interface»
          </text>
        )}
        {isEnum && (
          <text
            x={width / 2}
            y={16}
            textAnchor="middle"
            style={{ ...textCommonStyle, fontSize: 10, fill: "#64748B", fontStyle: "italic" }}
          >
            «enumeration»
          </text>
        )}
        <text
          x={width / 2}
          y={shape.stereotype || isInterface || isEnum ? 33 : 22}
          textAnchor="middle"
          style={{ ...textCommonStyle, fontWeight: "bold" }}
        >
          {label}
        </text>

        {/* Attributes Compartment */}
        <g transform={`translate(10, ${headerHeight + 14})`}>
          {attributes.map((attr, idx) => (
            <text
              key={idx}
              x={0}
              y={idx * 18}
              textAnchor="start"
              style={{ ...textCommonStyle, fontSize: 11, fontFamily: "monospace" }}
            >
              {attr}
            </text>
          ))}
          {isSelected && onAddCompartmentLine && (
            <text
              x={width - 24}
              y={-2}
              textAnchor="end"
              style={{
                fontSize: 10,
                fill: "#6366F1",
                cursor: "pointer",
                userSelect: "none",
                fontWeight: "bold",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onAddCompartmentLine(id, "attributes");
              }}
            >
              + attr
            </text>
          )}
        </g>

        {/* Divider between attributes and methods */}
        <path
          d={`M 0 ${headerHeight + attrHeight} L ${width} ${headerHeight + attrHeight}`}
          stroke={strokeColor}
          strokeWidth={1}
        />

        {/* Methods Compartment */}
        <g transform={`translate(10, ${headerHeight + attrHeight + 16})`}>
          {methods.map((method, idx) => (
            <text
              key={idx}
              x={0}
              y={idx * 18}
              textAnchor="start"
              style={{ ...textCommonStyle, fontSize: 11, fontFamily: "monospace" }}
            >
              {method}
            </text>
          ))}
          {isSelected && onAddCompartmentLine && (
            <text
              x={width - 24}
              y={-2}
              textAnchor="end"
              style={{
                fontSize: 10,
                fill: "#6366F1",
                cursor: "pointer",
                userSelect: "none",
                fontWeight: "bold",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onAddCompartmentLine(id, "methods");
              }}
            >
              + method
            </text>
          )}
        </g>
      </g>
    );
  }

  // 2. ERD Entity
  if (type === "erd_entity") {
    const headerHeight = 32;
    const erdAttrs = shape.erdAttributes || [];
    return (
      <g>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={style.cornerRadius}
          ry={style.cornerRadius}
          style={commonStyle}
        />
        {/* Header fill */}
        <path
          d={`M 0 ${style.cornerRadius} A ${style.cornerRadius} ${style.cornerRadius} 0 0 1 ${style.cornerRadius} 0 L ${width - style.cornerRadius} 0 A ${style.cornerRadius} ${style.cornerRadius} 0 0 1 ${width} ${style.cornerRadius} L ${width} ${headerHeight} L 0 ${headerHeight} Z`}
          fill="#3B82F6"
          opacity={0.12}
        />
        <path d={`M 0 ${headerHeight} L ${width} ${headerHeight}`} stroke={strokeColor} strokeWidth={1} />
        <text
          x={width / 2}
          y={21}
          textAnchor="middle"
          style={{ ...textCommonStyle, fontWeight: "bold", fill: "#1E3A8A" }}
        >
          {label}
        </text>

        {/* Columns */}
        {erdAttrs.map((attr, idx) => {
          const rowY = headerHeight + 14 + idx * 22;
          return (
            <g key={idx} transform={`translate(10, ${rowY})`}>
              {attr.isPk && (
                <rect x={0} y={-10} width={22} height={14} rx={3} fill="#FEF3C7" stroke="#D97706" strokeWidth={0.5} />
              )}
              {attr.isFk && !attr.isPk && (
                <rect x={0} y={-10} width={22} height={14} rx={3} fill="#E0F2FE" stroke="#0284C7" strokeWidth={0.5} />
              )}
              <text
                x={11}
                y={1}
                textAnchor="middle"
                style={{ fontSize: 9, fontWeight: "bold", fill: attr.isPk ? "#B45309" : "#0369A1" }}
              >
                {attr.isPk ? "PK" : attr.isFk ? "FK" : ""}
              </text>
              <text
                x={30}
                y={1}
                textAnchor="start"
                style={{ ...textCommonStyle, fontSize: 11, fontFamily: "monospace" }}
              >
                {attr.name}
              </text>
              <text
                x={width - 20}
                y={1}
                textAnchor="end"
                style={{ ...textCommonStyle, fontSize: 10, fill: "#64748B", fontFamily: "monospace" }}
              >
                {attr.type}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  // 3. Flowchart Start/End (Pill)
  if (type === "flowchart_start_end") {
    const rx = height / 2;
    return (
      <g>
        <rect x={0} y={0} width={width} height={height} rx={rx} ry={rx} style={commonStyle} />
        <text x={width / 2} y={height / 2 + 4} textAnchor="middle" style={textCommonStyle}>
          {label}
        </text>
      </g>
    );
  }

  // 4. Decision (Diamond)
  if (type === "diamond" || type === "flowchart_decision") {
    const d = `M ${width / 2} 0 L ${width} ${height / 2} L ${width / 2} ${height} L 0 ${height / 2} Z`;
    return (
      <g>
        <path d={d} style={commonStyle} />
        <text x={width / 2} y={height / 2 + 4} textAnchor="middle" style={textCommonStyle}>
          {label}
        </text>
      </g>
    );
  }

  // 5. Input/Output (Parallelogram)
  if (type === "flowchart_io") {
    const slant = 18;
    const d = `M ${slant} 0 L ${width} 0 L ${width - slant} ${height} L 0 ${height} Z`;
    return (
      <g>
        <path d={d} style={commonStyle} />
        <text x={width / 2} y={height / 2 + 4} textAnchor="middle" style={textCommonStyle}>
          {label}
        </text>
      </g>
    );
  }

  // 6. Document (Curved wave at bottom)
  if (type === "flowchart_document") {
    const wave = 14;
    const h = height - wave;
    const d = `M 0 0 L ${width} 0 L ${width} ${h} Q ${width * 0.75} ${h + wave * 1.3}, ${width * 0.5} ${h} T 0 ${h} Z`;
    return (
      <g>
        <path d={d} style={commonStyle} />
        <text x={width / 2} y={(height - wave) / 2 + 4} textAnchor="middle" style={textCommonStyle}>
          {label}
        </text>
      </g>
    );
  }

  // 7. Database (Cylinder)
  if (type === "flowchart_database" || type === "arch_database") {
    const capH = 14;
    return (
      <g>
        <path
          d={`M 0 ${capH} L 0 ${height - capH} A ${width / 2} ${capH} 0 0 0 ${width} ${height - capH} L ${width} ${capH} Z`}
          style={commonStyle}
        />
        {/* Bottom curve border */}
        <path
          d={`M 0 ${height - capH} A ${width / 2} ${capH} 0 0 0 ${width} ${height - capH}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        {/* Top ellipse */}
        <ellipse
          cx={width / 2}
          cy={capH}
          rx={width / 2}
          ry={capH}
          fill={style.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        <text x={width / 2} y={height / 2 + capH / 2 + 2} textAnchor="middle" style={textCommonStyle}>
          {label}
        </text>
      </g>
    );
  }

  // 8. UML Actor (Stick Figure)
  if (type === "uml_actor" || type === "arch_user") {
    const headRadius = 14;
    const headCy = headRadius + 4;
    const bodyTop = headCy + headRadius;
    const bodyBottom = bodyTop + 26;
    return (
      <g>
        <circle cx={width / 2} cy={headCy} r={headRadius} style={commonStyle} />
        {/* Body */}
        <line x1={width / 2} y1={bodyTop} x2={width / 2} y2={bodyBottom} stroke={strokeColor} strokeWidth={2} />
        {/* Arms */}
        <line x1={width / 2 - 22} y1={bodyTop + 10} x2={width / 2 + 22} y2={bodyTop + 10} stroke={strokeColor} strokeWidth={2} />
        {/* Legs */}
        <line x1={width / 2} y1={bodyBottom} x2={width / 2 - 16} y2={height - 18} stroke={strokeColor} strokeWidth={2} />
        <line x1={width / 2} y1={bodyBottom} x2={width / 2 + 16} y2={height - 18} stroke={strokeColor} strokeWidth={2} />
        {/* Label */}
        <text x={width / 2} y={height - 2} textAnchor="middle" style={textCommonStyle}>
          {label}
        </text>
      </g>
    );
  }

  // 9. UML Sequence Lifeline
  if (type === "uml_lifeline") {
    const lineLen = shape.lifelineLength || 320;
    return (
      <g>
        {/* Header Box */}
        <rect x={0} y={0} width={width} height={height} rx={style.cornerRadius} ry={style.cornerRadius} style={commonStyle} />
        <text x={width / 2} y={height / 2 + 4} textAnchor="middle" style={textCommonStyle}>
          {label}
        </text>
        {/* Dashed vertical lifeline */}
        <line
          x1={width / 2}
          y1={height}
          x2={width / 2}
          y2={height + lineLen}
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeDasharray="6,4"
        />
      </g>
    );
  }

  // 10. UML Sequence Activation bar
  if (type === "uml_activation") {
    return (
      <g>
        <rect x={0} y={0} width={width} height={height} style={commonStyle} />
      </g>
    );
  }

  // 11. UML Fragment Box (alt, loop, opt)
  if (type === "uml_fragment") {
    const pentagonW = 48;
    const pentagonH = 22;
    return (
      <g>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          style={{ ...commonStyle, fill: "transparent", strokeDasharray: "4,4" }}
        />
        {/* Pentagonal tag */}
        <path
          d={`M 0 0 L ${pentagonW} 0 L ${pentagonW + 10} ${pentagonH / 2} L ${pentagonW} ${pentagonH} L 0 ${pentagonH} Z`}
          fill="#E2E8F0"
          stroke={strokeColor}
          strokeWidth={1}
        />
        <text
          x={pentagonW / 2}
          y={15}
          textAnchor="middle"
          style={{ ...textCommonStyle, fontSize: 11, fontWeight: "bold" }}
        >
          {shape.fragmentType || "alt"}
        </text>
        <text x={pentagonW + 20} y={15} textAnchor="start" style={textCommonStyle}>
          {label}
        </text>
      </g>
    );
  }

  // 12. Cloud (Architecture)
  if (type === "arch_cloud") {
    return (
      <g>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={20}
          ry={20}
          style={{ ...commonStyle, strokeDasharray: "6,3" }}
        />
        <text x={width / 2} y={height / 2 + 4} textAnchor="middle" style={textCommonStyle}>
          {label}
        </text>
      </g>
    );
  }

  // 13. Server / API Service / Queue
  if (type === "arch_server" || type === "arch_service" || type === "arch_queue") {
    return (
      <g>
        <rect x={0} y={0} width={width} height={height} rx={8} ry={8} style={commonStyle} />
        {/* Sub-header or rack line */}
        <line x1={0} y1={20} x2={width} y2={20} stroke={strokeColor} strokeWidth={1} opacity={0.4} />
        <circle cx={12} cy={10} r={3} fill="#10B981" />
        <circle cx={22} cy={10} r={3} fill="#F59E0B" />
        <circle cx={32} cy={10} r={3} fill="#6366F1" />
        <text x={width / 2} y={height / 2 + 10} textAnchor="middle" style={textCommonStyle}>
          {label}
        </text>
      </g>
    );
  }

  // 14. Ellipse (General / UML Use Case)
  if (type === "ellipse" || type === "uml_usecase") {
    return (
      <g>
        <ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} style={commonStyle} />
        <text x={width / 2} y={height / 2 + 4} textAnchor="middle" style={textCommonStyle}>
          {label}
        </text>
      </g>
    );
  }

  // 15. Triangle
  if (type === "triangle") {
    const d = `M ${width / 2} 0 L ${width} ${height} L 0 ${height} Z`;
    return (
      <g>
        <path d={d} style={commonStyle} />
        <text x={width / 2} y={height * 0.68} textAnchor="middle" style={textCommonStyle}>
          {label}
        </text>
      </g>
    );
  }

  // 16. Note / UML Note
  if (type === "note" || type === "uml_note") {
    const fold = 16;
    const d = `M 0 0 L ${width - fold} 0 L ${width} ${fold} L ${width} ${height} L 0 ${height} Z`;
    const foldD = `M ${width - fold} 0 L ${width - fold} ${fold} L ${width} ${fold}`;
    return (
      <g>
        <path d={d} style={{ ...commonStyle, fill: style.fill || "#FEF9C3" }} />
        <path d={foldD} fill="#FDE047" stroke={strokeColor} strokeWidth={1} />
        <text x={width / 2 - 6} y={height / 2 + 4} textAnchor="middle" style={textCommonStyle}>
          {label}
        </text>
      </g>
    );
  }

  // 17. Text only
  if (type === "text") {
    return (
      <g>
        <text x={0} y={height / 2 + 4} textAnchor="start" style={textCommonStyle}>
          {label}
        </text>
      </g>
    );
  }

  // 18. Default / Rectangle / Rounded Rectangle / Process / Swimlane / System Boundary
  const isBoundary = type === "uml_boundary" || type === "flowchart_swimlane";
  return (
    <g>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={type === "rounded_rect" ? 14 : style.cornerRadius}
        ry={type === "rounded_rect" ? 14 : style.cornerRadius}
        style={isBoundary ? { ...commonStyle, fill: "transparent", strokeDasharray: "4,4" } : commonStyle}
      />
      {isBoundary ? (
        <text x={14} y={22} textAnchor="start" style={{ ...textCommonStyle, fontWeight: "bold" }}>
          {label}
        </text>
      ) : (
        <text x={width / 2} y={height / 2 + 4} textAnchor="middle" style={textCommonStyle}>
          {label}
        </text>
      )}
    </g>
  );
}

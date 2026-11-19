import { DiagramData } from "./types";
import { calculateConnectorPath, getAnchorPoint } from "./geometry";

export function exportDiagramToSVG(diagram: DiagramData): string {
  // Compute bounding box of all shapes
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (diagram.shapes.length === 0) {
    minX = 0;
    minY = 0;
    maxX = 800;
    maxY = 600;
  } else {
    for (const s of diagram.shapes) {
      minX = Math.min(minX, s.x - 20);
      minY = Math.min(minY, s.y - 20);
      maxX = Math.max(maxX, s.x + s.width + 20);
      maxY = Math.max(maxY, s.y + s.height + 20);
    }
  }

  const width = Math.max(200, maxX - minX);
  const height = Math.max(150, maxY - minY);

  // Markers definitions
  const markersDef = `
    <defs>
      <marker id="marker-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748B" />
      </marker>
      <marker id="marker-open_arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M 1 1.5 L 9 5 L 1 8.5" fill="none" stroke="#64748B" stroke-width="1.5" />
      </marker>
      <marker id="marker-hollow_triangle" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
        <path d="M 1 1.5 L 11 6 L 1 10.5 z" fill="#FFFFFF" stroke="#6366F1" stroke-width="1.5" />
      </marker>
      <marker id="marker-filled_diamond" viewBox="0 0 16 10" refX="15" refY="5" markerWidth="12" markerHeight="9" orient="auto-start-reverse">
        <path d="M 0 5 L 8 1.5 L 16 5 L 8 8.5 z" fill="#1E293B" />
      </marker>
      <marker id="marker-hollow_diamond" viewBox="0 0 16 10" refX="15" refY="5" markerWidth="12" markerHeight="9" orient="auto-start-reverse">
        <path d="M 0 5 L 8 1.5 L 16 5 L 8 8.5 z" fill="#FFFFFF" stroke="#64748B" stroke-width="1.5" />
      </marker>
      <marker id="marker-crows_foot_one" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
        <path d="M 4 2 L 4 10 M 8 2 L 8 10" fill="none" stroke="#3B82F6" stroke-width="1.5" />
      </marker>
      <marker id="marker-crows_foot_many" viewBox="0 0 14 14" refX="12" refY="7" markerWidth="11" markerHeight="11" orient="auto-start-reverse">
        <path d="M 1 2 L 12 7 L 1 12 M 1 7 L 12 7" fill="none" stroke="#3B82F6" stroke-width="1.5" />
      </marker>
    </defs>
  `;

  // Render connectors
  const connectorsSvg = diagram.connectors
    .map((c) => {
      const fromShape = diagram.shapes.find((s) => s.id === c.from.shapeId);
      const toShape = diagram.shapes.find((s) => s.id === c.to.shapeId);
      if (!fromShape || !toShape) return "";

      const startPt = getAnchorPoint(fromShape, c.from.point);
      const endPt = getAnchorPoint(toShape, c.to.point);
      const { pathString, midPoint } = calculateConnectorPath(
        startPt,
        endPt,
        c.from.point,
        c.to.point,
        c.style
      );

      const markerStart = c.startArrow !== "none" ? `marker-start="url(#marker-${c.startArrow})"` : "";
      const markerEnd = c.endArrow !== "none" ? `marker-end="url(#marker-${c.endArrow})"` : "";
      const dash = c.dashed ? 'stroke-dasharray="6,4"' : "";

      let labelSvg = "";
      if (c.label) {
        const textLen = c.label.length * 7 + 16;
        labelSvg = `
          <g transform="translate(${midPoint.x}, ${midPoint.y})">
            <rect x="${-textLen / 2}" y="-10" width="${textLen}" height="20" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
            <text x="0" y="4" text-anchor="middle" fill="#334155" font-size="11" font-family="sans-serif">${c.label}</text>
          </g>
        `;
      }

      return `
        <path d="${pathString}" fill="none" stroke="${c.stroke}" stroke-width="${c.strokeWidth}" ${dash} ${markerStart} ${markerEnd} />
        ${labelSvg}
      `;
    })
    .join("\n");

  // Render shapes
  const shapesSvg = diagram.shapes
    .map((s) => {
      const rx = s.type === "flowchart_start_end" ? s.height / 2 : s.style.cornerRadius;
      const fill = s.style.fill;
      const stroke = s.style.stroke;
      const strokeW = s.style.strokeWidth;

      if (s.type === "diamond" || s.type === "flowchart_decision") {
        const d = `M ${s.width / 2} 0 L ${s.width} ${s.height / 2} L ${s.width / 2} ${s.height} L 0 ${s.height / 2} Z`;
        return `
          <g transform="translate(${s.x}, ${s.y})">
            <path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" />
            <text x="${s.width / 2}" y="${s.height / 2 + 4}" text-anchor="middle" fill="${s.textStyle.color}" font-size="${s.textStyle.fontSize}" font-family="sans-serif">${s.label}</text>
          </g>
        `;
      }

      if (s.type === "uml_class") {
        const attrs = (s.attributes || [])
          .map((a, i) => `<text x="10" y="${48 + i * 16}" fill="#334155" font-size="11" font-family="monospace">${a}</text>`)
          .join("");
        const methods = (s.methods || [])
          .map((m, i) => `<text x="10" y="${120 + i * 16}" fill="#334155" font-size="11" font-family="monospace">${m}</text>`)
          .join("");

        return `
          <g transform="translate(${s.x}, ${s.y})">
            <rect x="0" y="0" width="${s.width}" height="${s.height}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" />
            <text x="${s.width / 2}" y="22" text-anchor="middle" font-weight="bold" fill="#1E293B" font-size="13" font-family="sans-serif">${s.label}</text>
            <line x1="0" y1="32" x2="${s.width}" y2="32" stroke="${stroke}" stroke-width="1" />
            ${attrs}
            <line x1="0" y1="104" x2="${s.width}" y2="104" stroke="${stroke}" stroke-width="1" />
            ${methods}
          </g>
        `;
      }

      return `
        <g transform="translate(${s.x}, ${s.y})">
          <rect x="0" y="0" width="${s.width}" height="${s.height}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" />
          <text x="${s.width / 2}" y="${s.height / 2 + 4}" text-anchor="middle" fill="${s.textStyle.color}" font-size="${s.textStyle.fontSize}" font-family="sans-serif">${s.label}</text>
        </g>
      `;
    })
    .join("\n");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">
      <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${diagram.settings.backgroundColor}" />
      ${markersDef}
      ${connectorsSvg}
      ${shapesSvg}
    </svg>
  `;
}

export function downloadSVG(diagram: DiagramData) {
  const svgContent = exportDiagramToSVG(diagram);
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${diagram.name.toLowerCase().replace(/\s+/g, "_")}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPNG(diagram: DiagramData) {
  const svgContent = exportDiagramToSVG(diagram);
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width * 2; // high res 2x
    canvas.height = img.height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const pngUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `${diagram.name.toLowerCase().replace(/\s+/g, "_")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(pngUrl);
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  img.src = url;
}

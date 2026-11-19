import React, { useState } from "react";
import {
  DiagramShape,
  DiagramConnector,
  DiagramSettings,
  LineStyle,
  ArrowType,
} from "./types";
import {
  Sliders,
  Type,
  Layers,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  Group,
  Ungroup,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Grid,
  Magnet,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRight,
} from "lucide-react";

interface FormatPanelProps {
  selectedShapes: DiagramShape[];
  selectedConnector: DiagramConnector | null;
  diagramSettings: DiagramSettings;
  onUpdateShapes: (shapes: DiagramShape[], pushHistory?: boolean) => void;
  onUpdateConnector: (connector: DiagramConnector, pushHistory?: boolean) => void;
  onUpdateDiagramSettings: (settings: DiagramSettings) => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onGroupSelected: () => void;
  onUngroupSelected: () => void;
  onAlign: (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  onDistribute: (direction: "horizontal" | "vertical") => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function FormatPanel({
  selectedShapes,
  selectedConnector,
  diagramSettings,
  onUpdateShapes,
  onUpdateConnector,
  onUpdateDiagramSettings,
  onBringToFront,
  onSendToBack,
  onGroupSelected,
  onUngroupSelected,
  onAlign,
  onDistribute,
  isCollapsed,
  onToggleCollapse,
}: FormatPanelProps) {
  const [activeTab, setActiveTab] = useState<"style" | "text" | "arrange">("style");

  const colorPalette = [
    "#FFFFFF",
    "#F8FAFC",
    "#F1F5F9",
    "#E2E8F0",
    "#CBD5E1",
    "#64748B",
    "#1E293B",
    "#EEF2FF",
    "#C7D2FE",
    "#6366F1",
    "#4338CA",
    "#DCFCE7",
    "#22C55E",
    "#FEF3C7",
    "#F59E0B",
    "#FEE2E2",
    "#EF4444",
    "#E0F2FE",
    "#0284C7",
  ];

  if (isCollapsed) {
    return (
      <div className="w-10 bg-white border-l border-slate-200 flex flex-col items-center py-2 select-none z-20 shrink-0">
        <button
          onClick={onToggleCollapse}
          title="Open Format Panel"
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // --- CASE 1: CONNECTOR SELECTED ---
  if (selectedConnector) {
    return (
      <div className="w-[260px] bg-white border-l border-slate-200 flex flex-col select-none z-20 shrink-0 font-sans text-xs">
        <div className="h-9 px-3 border-b border-slate-200 flex items-center justify-between font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
          <span>Connector Format</span>
          <button
            onClick={onToggleCollapse}
            title="Collapse Format Panel"
            className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
          {/* Line Style */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase">
              Routing Style
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["straight", "orthogonal", "curved"] as LineStyle[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onUpdateConnector({ ...selectedConnector, style: st }, true)}
                  className={`py-1 px-1.5 rounded border text-center capitalize transition-colors ${
                    selectedConnector.style === st
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Arrowheads */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase">
              Arrowheads
            </label>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-slate-500 mb-0.5 block">Start Arrow</span>
                <select
                  value={selectedConnector.startArrow}
                  onChange={(e) =>
                    onUpdateConnector({ ...selectedConnector, startArrow: e.target.value as ArrowType }, true)
                  }
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 outline-none"
                >
                  <option value="none">None</option>
                  <option value="arrow">Filled Arrow</option>
                  <option value="open_arrow">Open Arrow</option>
                  <option value="hollow_triangle">Hollow Triangle (UML)</option>
                  <option value="filled_diamond">Filled Diamond (Composition)</option>
                  <option value="hollow_diamond">Hollow Diamond (Aggregation)</option>
                  <option value="crows_foot_one">Crow&apos;s Foot One (ERD)</option>
                  <option value="crows_foot_many">Crow&apos;s Foot Many (ERD)</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 mb-0.5 block">End Arrow</span>
                <select
                  value={selectedConnector.endArrow}
                  onChange={(e) =>
                    onUpdateConnector({ ...selectedConnector, endArrow: e.target.value as ArrowType }, true)
                  }
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 outline-none"
                >
                  <option value="none">None</option>
                  <option value="arrow">Filled Arrow</option>
                  <option value="open_arrow">Open Arrow</option>
                  <option value="hollow_triangle">Hollow Triangle (UML)</option>
                  <option value="filled_diamond">Filled Diamond (Composition)</option>
                  <option value="hollow_diamond">Hollow Diamond (Aggregation)</option>
                  <option value="crows_foot_one">Crow&apos;s Foot One (ERD)</option>
                  <option value="crows_foot_many">Crow&apos;s Foot Many (ERD)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stroke & Dashed */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase">
              Stroke & Pattern
            </label>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600">Dashed Line</span>
              <input
                type="checkbox"
                checked={selectedConnector.dashed}
                onChange={(e) =>
                  onUpdateConnector({ ...selectedConnector, dashed: e.target.checked }, true)
                }
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-slate-600 w-16">Width</span>
              <input
                type="range"
                min="1"
                max="6"
                step="0.5"
                value={selectedConnector.strokeWidth}
                onChange={(e) =>
                  onUpdateConnector(
                    { ...selectedConnector, strokeWidth: parseFloat(e.target.value) },
                    false
                  )
                }
                className="flex-1 accent-indigo-600"
              />
              <span className="w-8 text-right font-mono text-slate-500">
                {selectedConnector.strokeWidth}px
              </span>
            </div>

            {/* Color Palette */}
            <div>
              <span className="text-[10px] text-slate-500 mb-1 block">Line Color</span>
              <div className="flex flex-wrap gap-1">
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateConnector({ ...selectedConnector, stroke: c }, true)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded border ${
                      selectedConnector.stroke === c ? "border-indigo-600 ring-2 ring-indigo-400" : "border-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Labels & Multiplicity */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase">
              Labels & Multiplicity
            </label>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-slate-500 mb-0.5 block">Middle Label</span>
                <input
                  type="text"
                  placeholder="e.g. validates, 1..*"
                  value={selectedConnector.label || ""}
                  onChange={(e) =>
                    onUpdateConnector({ ...selectedConnector, label: e.target.value }, false)
                  }
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 mb-0.5 block">Start Multiplicity</span>
                  <input
                    type="text"
                    placeholder="1, 0..1"
                    value={selectedConnector.startLabel || ""}
                    onChange={(e) =>
                      onUpdateConnector({ ...selectedConnector, startLabel: e.target.value }, false)
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 mb-0.5 block">End Multiplicity</span>
                  <input
                    type="text"
                    placeholder="0..*, 1..*"
                    value={selectedConnector.endLabel || ""}
                    onChange={(e) =>
                      onUpdateConnector({ ...selectedConnector, endLabel: e.target.value }, false)
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- CASE 2: SHAPES SELECTED ---
  if (selectedShapes.length > 0) {
    const primary = selectedShapes[0];

    const updateSelected = (updater: (s: DiagramShape) => DiagramShape, pushHistory = true) => {
      const updated = selectedShapes.map(updater);
      onUpdateShapes(updated, pushHistory);
    };

    return (
      <div className="w-[260px] bg-white border-l border-slate-200 flex flex-col select-none z-20 shrink-0 font-sans text-xs">
        {/* Header & Tabs */}
        <div className="border-b border-slate-200">
          <div className="h-9 px-3 flex items-center justify-between font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
            <span>
              Format ({selectedShapes.length} {selectedShapes.length === 1 ? "Item" : "Items"})
            </span>
            <button
              onClick={onToggleCollapse}
              title="Collapse Format Panel"
              className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex border-t border-slate-100">
            <button
              onClick={() => setActiveTab("style")}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1 font-medium border-b-2 transition-colors ${
                activeTab === "style"
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/30"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Style</span>
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1 font-medium border-b-2 transition-colors ${
                activeTab === "text"
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/30"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text</span>
            </button>
            <button
              onClick={() => setActiveTab("arrange")}
              className={`flex-1 py-1.5 flex items-center justify-center gap-1 font-medium border-b-2 transition-colors ${
                activeTab === "arrange"
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/30"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Arrange</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Style */}
        {activeTab === "style" && (
          <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
            {/* Fill Color */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase">
                Fill Color
              </label>
              <div className="flex flex-wrap gap-1 mb-2">
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateSelected((s) => ({ ...s, style: { ...s.style, fill: c } }))}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded border ${
                      primary.style.fill === c ? "border-indigo-600 ring-2 ring-indigo-400" : "border-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Color */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase">
                Stroke Color
              </label>
              <div className="flex flex-wrap gap-1 mb-2">
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateSelected((s) => ({ ...s, style: { ...s.style, stroke: c } }))}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded border ${
                      primary.style.stroke === c ? "border-indigo-600 ring-2 ring-indigo-400" : "border-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <div className="flex items-center justify-between text-slate-600 mb-1">
                <span>Stroke Width</span>
                <span className="font-mono text-slate-500">{primary.style.strokeWidth}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={primary.style.strokeWidth}
                onChange={(e) =>
                  updateSelected(
                    (s) => ({ ...s, style: { ...s.style, strokeWidth: parseInt(e.target.value) } }),
                    false
                  )
                }
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Opacity */}
            <div>
              <div className="flex items-center justify-between text-slate-600 mb-1">
                <span>Opacity</span>
                <span className="font-mono text-slate-500">{Math.round(primary.style.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={primary.style.opacity}
                onChange={(e) =>
                  updateSelected(
                    (s) => ({ ...s, style: { ...s.style, opacity: parseFloat(e.target.value) } }),
                    false
                  )
                }
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Corner Radius & Options */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Dashed Stroke</span>
                <input
                  type="checkbox"
                  checked={primary.style.strokeDash}
                  onChange={(e) =>
                    updateSelected((s) => ({ ...s, style: { ...s.style, strokeDash: e.target.checked } }))
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Drop Shadow</span>
                <input
                  type="checkbox"
                  checked={primary.style.shadow}
                  onChange={(e) =>
                    updateSelected((s) => ({ ...s, style: { ...s.style, shadow: e.target.checked } }))
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Text */}
        {activeTab === "text" && (
          <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
            {/* Font Size & Family */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase">
                Typography
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Size</span>
                  <select
                    value={primary.textStyle.fontSize}
                    onChange={(e) =>
                      updateSelected((s) => ({
                        ...s,
                        textStyle: { ...s.textStyle, fontSize: parseInt(e.target.value) },
                      }))
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 outline-none"
                  >
                    {[10, 11, 12, 13, 14, 16, 18, 20, 24, 28].map((size) => (
                      <option key={size} value={size}>
                        {size}px
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Font</span>
                  <select
                    value={primary.textStyle.fontFamily}
                    onChange={(e) =>
                      updateSelected((s) => ({
                        ...s,
                        textStyle: { ...s.textStyle, fontFamily: e.target.value },
                      }))
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 outline-none"
                  >
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="monospace">Monospace</option>
                    <option value="serif">Serif</option>
                  </select>
                </div>
              </div>

              {/* Bold, Italic, Underline */}
              <div className="flex items-center gap-1 border border-slate-200 rounded-md p-1 bg-slate-50">
                <button
                  onClick={() =>
                    updateSelected((s) => ({
                      ...s,
                      textStyle: { ...s.textStyle, bold: !s.textStyle.bold },
                    }))
                  }
                  className={`p-1.5 rounded flex-1 flex justify-center ${
                    primary.textStyle.bold ? "bg-white text-indigo-600 shadow-2xs font-bold" : "text-slate-600"
                  }`}
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    updateSelected((s) => ({
                      ...s,
                      textStyle: { ...s.textStyle, italic: !s.textStyle.italic },
                    }))
                  }
                  className={`p-1.5 rounded flex-1 flex justify-center ${
                    primary.textStyle.italic ? "bg-white text-indigo-600 shadow-2xs italic" : "text-slate-600"
                  }`}
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    updateSelected((s) => ({
                      ...s,
                      textStyle: { ...s.textStyle, underline: !s.textStyle.underline },
                    }))
                  }
                  className={`p-1.5 rounded flex-1 flex justify-center ${
                    primary.textStyle.underline ? "bg-white text-indigo-600 shadow-2xs underline" : "text-slate-600"
                  }`}
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Alignment */}
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Alignment</span>
              <div className="flex items-center gap-1 border border-slate-200 rounded-md p-1 bg-slate-50">
                <button
                  onClick={() =>
                    updateSelected((s) => ({ ...s, textStyle: { ...s.textStyle, align: "left" } }))
                  }
                  className={`p-1.5 rounded flex-1 flex justify-center ${
                    primary.textStyle.align === "left" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    updateSelected((s) => ({ ...s, textStyle: { ...s.textStyle, align: "center" } }))
                  }
                  className={`p-1.5 rounded flex-1 flex justify-center ${
                    primary.textStyle.align === "center" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
                  }`}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    updateSelected((s) => ({ ...s, textStyle: { ...s.textStyle, align: "right" } }))
                  }
                  className={`p-1.5 rounded flex-1 flex justify-center ${
                    primary.textStyle.align === "right" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
                  }`}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Text Color */}
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Text Color</span>
              <div className="flex flex-wrap gap-1">
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateSelected((s) => ({ ...s, textStyle: { ...s.textStyle, color: c } }))}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded border ${
                      primary.textStyle.color === c ? "border-indigo-600 ring-2 ring-indigo-400" : "border-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Arrange */}
        {activeTab === "arrange" && (
          <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
            {/* Geometry */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase">
                Position & Size
              </label>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-500 block">X</span>
                  <input
                    type="number"
                    value={Math.round(primary.x)}
                    onChange={(e) =>
                      updateSelected((s) => ({ ...s, x: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Y</span>
                  <input
                    type="number"
                    value={Math.round(primary.y)}
                    onChange={(e) =>
                      updateSelected((s) => ({ ...s, y: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Width</span>
                  <input
                    type="number"
                    value={Math.round(primary.width)}
                    onChange={(e) =>
                      updateSelected((s) => ({ ...s, width: Math.max(30, parseInt(e.target.value) || 30) }))
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Height</span>
                  <input
                    type="number"
                    value={Math.round(primary.height)}
                    onChange={(e) =>
                      updateSelected((s) => ({ ...s, height: Math.max(20, parseInt(e.target.value) || 20) }))
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Layer Order */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase">
                Layer Order
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={onBringToFront}
                  className="px-2 py-1.5 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 transition-colors"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Bring to Front</span>
                </button>
                <button
                  onClick={onSendToBack}
                  className="px-2 py-1.5 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 transition-colors"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Send to Back</span>
                </button>
              </div>
            </div>

            {/* Align & Distribute (Multi-selection) */}
            {selectedShapes.length > 1 && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase">
                  Align & Distribute
                </label>
                <div className="grid grid-cols-3 gap-1 mb-2">
                  <button
                    onClick={() => onAlign("left")}
                    className="py-1 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-center"
                  >
                    Align Left
                  </button>
                  <button
                    onClick={() => onAlign("center")}
                    className="py-1 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-center"
                  >
                    Align Center
                  </button>
                  <button
                    onClick={() => onAlign("right")}
                    className="py-1 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-center"
                  >
                    Align Right
                  </button>
                  <button
                    onClick={() => onAlign("top")}
                    className="py-1 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-center"
                  >
                    Align Top
                  </button>
                  <button
                    onClick={() => onAlign("middle")}
                    className="py-1 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-center"
                  >
                    Align Middle
                  </button>
                  <button
                    onClick={() => onAlign("bottom")}
                    className="py-1 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-center"
                  >
                    Align Bottom
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onDistribute("horizontal")}
                    className="py-1 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-center"
                  >
                    Distribute Horiz.
                  </button>
                  <button
                    onClick={() => onDistribute("vertical")}
                    className="py-1 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-center"
                  >
                    Distribute Vert.
                  </button>
                </div>
              </div>
            )}

            {/* Grouping / Lock */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              {selectedShapes.length > 1 ? (
                <button
                  onClick={onGroupSelected}
                  className="w-full py-1.5 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700"
                >
                  <Group className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Group Shapes (Ctrl+G)</span>
                </button>
              ) : primary.groupId ? (
                <button
                  onClick={onUngroupSelected}
                  className="w-full py-1.5 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700"
                >
                  <Ungroup className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ungroup Shapes</span>
                </button>
              ) : null}

              <button
                onClick={() => updateSelected((s) => ({ ...s, locked: !s.locked }))}
                className="w-full py-1.5 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700"
              >
                {primary.locked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Unlock Shape</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lock Shape</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- CASE 3: NOTHING SELECTED -> DIAGRAM SETTINGS ---
  return (
    <div className="w-[260px] bg-white border-l border-slate-200 flex flex-col select-none z-20 shrink-0 font-sans text-xs">
      <div className="h-9 px-3 border-b border-slate-200 flex items-center justify-between font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
        <span>Diagram Settings</span>
        <button
          onClick={onToggleCollapse}
          title="Collapse Format Panel"
          className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
        >
          <PanelRightClose className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3.5 space-y-4 overflow-y-auto flex-1">
        {/* Grid Toggle */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Grid className="w-4 h-4 text-slate-500" />
            <span>Show Grid</span>
          </div>
          <input
            type="checkbox"
            checked={diagramSettings.showGrid}
            onChange={(e) =>
              onUpdateDiagramSettings({ ...diagramSettings, showGrid: e.target.checked })
            }
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
        </div>

        {/* Snap to Grid */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Magnet className="w-4 h-4 text-slate-500" />
            <span>Snap to Grid</span>
          </div>
          <input
            type="checkbox"
            checked={diagramSettings.snapToGrid}
            onChange={(e) =>
              onUpdateDiagramSettings({ ...diagramSettings, snapToGrid: e.target.checked })
            }
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
        </div>

        {/* Grid Size */}
        <div>
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span>Grid Size</span>
            <span className="font-mono text-slate-500">{diagramSettings.gridSize}px</span>
          </div>
          <select
            value={diagramSettings.gridSize}
            onChange={(e) =>
              onUpdateDiagramSettings({
                ...diagramSettings,
                gridSize: parseInt(e.target.value),
              })
            }
            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 outline-none"
          >
            <option value={10}>10px (Fine)</option>
            <option value={20}>20px (Default)</option>
            <option value={40}>40px (Coarse)</option>
          </select>
        </div>

        {/* Canvas Background Color */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase">
            Background Color
          </label>
          <div className="flex flex-wrap gap-1.5">
            {["#F8FAFC", "#FFFFFF", "#F1F5F9", "#FEFCE8", "#F0FDF4", "#EFF6FF"].map((bg) => (
              <button
                key={bg}
                onClick={() => onUpdateDiagramSettings({ ...diagramSettings, backgroundColor: bg })}
                style={{ backgroundColor: bg }}
                className={`w-7 h-7 rounded-md border ${
                  diagramSettings.backgroundColor === bg
                    ? "border-indigo-600 ring-2 ring-indigo-400"
                    : "border-slate-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-[11px] space-y-1">
          <p className="font-semibold text-slate-700">Quick Tips:</p>
          <p>• Drag shapes from the left library.</p>
          <p>• Hover over shapes to reveal blue connection ports.</p>
          <p>• Hold <kbd className="px-1 py-0.5 bg-white border rounded">Space</kbd> + drag to pan.</p>
          <p>• Double-click shapes to edit text.</p>
        </div>
      </div>
    </div>
  );
}

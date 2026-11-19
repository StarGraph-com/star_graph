import React, { useState, useRef, useEffect } from "react";
import {
  Undo2,
  Redo2,
  Share2,
  Download,
  ChevronDown,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  FileCode,
  Image as ImageIcon,
  Check,
  Loader2,
  AlertCircle,
  Cloud,
} from "lucide-react";
import { DiagramData } from "./types";
import { downloadPNG, downloadSVG } from "./exportUtils";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorTopBarProps {
  projectName: string;
  onUpdateProjectName: (name: string) => void;
  folderName: string;
  activeDiagram: DiagramData;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitToScreen: () => void;
  saveStatus?: SaveStatus;
}

export function EditorTopBar({
  projectName,
  onUpdateProjectName,
  folderName,
  activeDiagram,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitToScreen,
  saveStatus = "saved",
}: EditorTopBarProps) {
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(projectName);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const zoomMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempProjectName(projectName);
  }, [projectName]);

  // Click outside listener for dropdown menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target as Node)) {
        setShowZoomMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-12 bg-white border-b border-slate-200 px-3.5 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Logo & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-slate-900">
            Star<span className="text-indigo-600">graph</span>
          </span>
        </div>

        {/* Breadcrumb & Project Name */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          {isEditingProject ? (
            <input
              type="text"
              autoFocus
              value={tempProjectName}
              onChange={(e) => setTempProjectName(e.target.value)}
              onBlur={() => {
                if (tempProjectName.trim()) onUpdateProjectName(tempProjectName.trim());
                setIsEditingProject(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (tempProjectName.trim()) onUpdateProjectName(tempProjectName.trim());
                  setIsEditingProject(false);
                } else if (e.key === "Escape") {
                  setTempProjectName(projectName);
                  setIsEditingProject(false);
                }
              }}
              className="px-1.5 py-0.5 border border-indigo-500 rounded text-slate-900 text-xs font-medium outline-none bg-slate-50"
            />
          ) : (
            <span
              onClick={() => setIsEditingProject(true)}
              className="font-medium text-slate-800 hover:bg-slate-100 hover:text-indigo-600 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
              title="Click to rename project"
            >
              {projectName}
            </span>
          )}
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">{folderName}</span>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-900">{activeDiagram.name}</span>

          {/* Auto-Save Status Indicator */}
          <div className="ml-2 pl-2 border-l border-slate-200 flex items-center gap-1.5 text-[11px]">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-indigo-600 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-slate-500">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Saved</span>
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <AlertCircle className="w-3 h-3" />
                <span>Save failed</span>
              </span>
            )}
            {saveStatus === "idle" && (
              <span className="flex items-center gap-1 text-slate-400">
                <Cloud className="w-3 h-3" />
                <span>Synced</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: Undo / Redo & Zoom Control */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Zoom Menu */}
        <div className="relative" ref={zoomMenuRef}>
          <button
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:bg-slate-100 px-2 py-1.5 rounded transition-colors"
          >
            <span>{Math.round(zoom * 100)}%</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showZoomMenu && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
              <button
                onClick={() => {
                  onZoomChange(Math.min(3, zoom + 0.1));
                  setShowZoomMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
                <span>Zoom In</span>
              </button>
              <button
                onClick={() => {
                  onZoomChange(Math.max(0.2, zoom - 0.1));
                  setShowZoomMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                <ZoomOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Zoom Out</span>
              </button>
              <button
                onClick={() => {
                  onZoomChange(1);
                  setShowZoomMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                <span className="w-3.5 text-center font-bold text-[10px]">1:1</span>
                <span>100%</span>
              </button>
              <button
                onClick={() => {
                  onFitToScreen();
                  setShowZoomMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Fit to Screen</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Export & Share Actions */}
      <div className="flex items-center gap-2">
        {/* Export Button */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
              <button
                onClick={() => {
                  downloadSVG(activeDiagram);
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Download SVG</span>
              </button>
              <button
                onClick={() => {
                  downloadPNG(activeDiagram);
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Download PNG</span>
              </button>
            </div>
          )}
        </div>

        {/* Share Button (Inactive per requirements) */}
        <button
          disabled
          title="Sharing features coming soon"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-400 rounded-md cursor-not-allowed border border-slate-200"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      </div>
    </header>
  );
}

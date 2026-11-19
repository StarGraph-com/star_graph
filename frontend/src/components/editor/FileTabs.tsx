import React from "react";
import { X, Workflow, Box, GitBranch, UserCheck, Database, Network, FileText } from "lucide-react";
import { DiagramType } from "./types";

export interface TabItem {
  id: string;
  name: string;
  diagramType: DiagramType;
}

interface FileTabsProps {
  openTabs: TabItem[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
}

export function FileTabs({
  openTabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}: FileTabsProps) {
  const getTabIcon = (type: DiagramType) => {
    switch (type) {
      case "flowchart":
        return <Workflow className="w-3.5 h-3.5 text-amber-500" />;
      case "uml_class":
        return <Box className="w-3.5 h-3.5 text-indigo-500" />;
      case "uml_sequence":
        return <GitBranch className="w-3.5 h-3.5 text-emerald-500" />;
      case "uml_usecase":
        return <UserCheck className="w-3.5 h-3.5 text-pink-500" />;
      case "erd":
        return <Database className="w-3.5 h-3.5 text-blue-500" />;
      case "architecture":
        return <Network className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="h-9 bg-slate-100 border-b border-slate-200 flex items-center px-1 overflow-x-auto select-none shrink-0 text-xs">
      {openTabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`group h-8 px-3 mr-1 flex items-center gap-2 rounded-t-md cursor-pointer border-t-2 transition-all max-w-52 shrink-0 ${
              isActive
                ? "bg-white text-slate-900 border-indigo-600 font-medium shadow-2xs"
                : "bg-transparent text-slate-600 border-transparent hover:bg-slate-200/70"
            }`}
          >
            {getTabIcon(tab.diagramType)}
            <span className="truncate flex-1">{tab.name}</span>
            <button
              onClick={(e) => onCloseTab(tab.id, e)}
              title="Close tab"
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 hover:text-slate-800 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

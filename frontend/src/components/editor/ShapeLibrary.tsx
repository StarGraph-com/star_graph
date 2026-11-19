import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Workflow,
  Box,
  GitBranch,
  UserCheck,
  Database,
  Network,
  Shapes,
  Link2,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { ArrowType, DiagramType, LineStyle } from "./types";

interface ShapeLibraryProps {
  activeDiagramType: DiagramType;
  onAddShapeAtCenter: (shapeType: string) => void;
  onSelectConnectorPreset: (preset: {
    style: LineStyle;
    startArrow: ArrowType;
    endArrow: ArrowType;
    dashed: boolean;
    label?: string;
  }) => void;
  activeConnectorPreset?: {
    style: LineStyle;
    startArrow: ArrowType;
    endArrow: ArrowType;
    dashed: boolean;
    label?: string;
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface ShapeItem {
  type: string;
  label: string;
  iconSvg: React.ReactNode;
}

interface ConnectorPresetItem {
  id: string;
  name: string;
  style: LineStyle;
  startArrow: ArrowType;
  endArrow: ArrowType;
  dashed: boolean;
  label?: string;
}

export function ShapeLibrary({
  activeDiagramType,
  onAddShapeAtCenter,
  onSelectConnectorPreset,
  activeConnectorPreset,
  isCollapsed,
  onToggleCollapse,
}: ShapeLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    flowchart: false,
    uml_class: false,
    uml_usecase: false,
    uml_sequence: false,
    erd: false,
    architecture: false,
    connectors: true,
  });

  // Automatically open the matching category when active diagram type changes
  useEffect(() => {
    setOpenSections((prev) => ({
      ...prev,
      [activeDiagramType]: true,
    }));
  }, [activeDiagramType]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const categories: Array<{
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: ShapeItem[];
  }> = [
    {
      id: "general",
      title: "General",
      icon: Shapes,
      items: [
        {
          type: "rect",
          label: "Rectangle",
          iconSvg: <rect x="2" y="5" width="20" height="14" rx="1" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />,
        },
        {
          type: "rounded_rect",
          label: "Rounded",
          iconSvg: <rect x="2" y="5" width="20" height="14" rx="4" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />,
        },
        {
          type: "ellipse",
          label: "Ellipse",
          iconSvg: <ellipse cx="12" cy="12" rx="10" ry="7" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />,
        },
        {
          type: "diamond",
          label: "Diamond",
          iconSvg: <polygon points="12,2 22,12 12,22 2,12" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />,
        },
        {
          type: "triangle",
          label: "Triangle",
          iconSvg: <polygon points="12,3 22,21 2,21" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />,
        },
        {
          type: "text",
          label: "Text",
          iconSvg: (
            <text x="12" y="16" textAnchor="middle" fill="#334155" fontSize="12" fontWeight="bold">
              T
            </text>
          ),
        },
        {
          type: "note",
          label: "Note",
          iconSvg: (
            <path
              d="M 4 3 L 16 3 L 20 7 L 20 21 L 4 21 Z"
              fill="#FEF9C3"
              stroke="#CA8A04"
              strokeWidth="1.5"
            />
          ),
        },
      ],
    },
    {
      id: "flowchart",
      title: "Flowchart",
      icon: Workflow,
      items: [
        {
          type: "flowchart_start_end",
          label: "Start / End",
          iconSvg: <rect x="2" y="6" width="20" height="12" rx="6" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1.5" />,
        },
        {
          type: "flowchart_process",
          label: "Process",
          iconSvg: <rect x="2" y="5" width="20" height="14" rx="2" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />,
        },
        {
          type: "flowchart_decision",
          label: "Decision",
          iconSvg: <polygon points="12,3 21,12 12,21 3,12" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />,
        },
        {
          type: "flowchart_io",
          label: "Input / Output",
          iconSvg: <polygon points="5,4 22,4 19,20 2,20" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />,
        },
        {
          type: "flowchart_document",
          label: "Document",
          iconSvg: (
            <path
              d="M 3 4 L 21 4 L 21 16 Q 16 19 12 16 T 3 16 Z"
              fill="#F8FAFC"
              stroke="#64748B"
              strokeWidth="1.5"
            />
          ),
        },
        {
          type: "flowchart_database",
          label: "Database",
          iconSvg: (
            <g>
              <path d="M 4 8 L 4 18 A 8 3 0 0 0 20 18 L 20 8" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
              <ellipse cx="12" cy="7" rx="8" ry="3" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
            </g>
          ),
        },
        {
          type: "flowchart_swimlane",
          label: "Swimlane",
          iconSvg: (
            <g>
              <rect x="2" y="3" width="20" height="18" fill="none" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3,2" />
              <line x1="2" y1="8" x2="22" y2="8" stroke="#64748B" strokeWidth="1" />
            </g>
          ),
        },
      ],
    },
    {
      id: "uml_class",
      title: "UML Class",
      icon: Box,
      items: [
        {
          type: "uml_class",
          label: "Class",
          iconSvg: (
            <g>
              <rect x="2" y="3" width="20" height="18" rx="1" fill="#FFFFFF" stroke="#6366F1" strokeWidth="1.5" />
              <line x1="2" y1="8" x2="22" y2="8" stroke="#6366F1" strokeWidth="1" />
              <line x1="2" y1="13" x2="22" y2="13" stroke="#6366F1" strokeWidth="1" />
            </g>
          ),
        },
        {
          type: "uml_interface",
          label: "Interface",
          iconSvg: (
            <g>
              <rect x="2" y="3" width="20" height="18" rx="1" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
              <line x1="2" y1="9" x2="22" y2="9" stroke="#64748B" strokeWidth="1" />
            </g>
          ),
        },
        {
          type: "uml_enum",
          label: "Enum",
          iconSvg: (
            <g>
              <rect x="2" y="3" width="20" height="18" rx="1" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
              <line x1="2" y1="9" x2="22" y2="9" stroke="#64748B" strokeWidth="1" />
            </g>
          ),
        },
        {
          type: "uml_package",
          label: "Package",
          iconSvg: (
            <g>
              <path d="M 2 5 L 8 5 L 10 7 L 22 7 L 22 20 L 2 20 Z" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
            </g>
          ),
        },
        {
          type: "uml_note",
          label: "UML Note",
          iconSvg: <path d="M 3 3 L 15 3 L 20 8 L 20 21 L 3 21 Z" fill="#FEF9C3" stroke="#CA8A04" strokeWidth="1.5" />,
        },
      ],
    },
    {
      id: "uml_usecase",
      title: "UML Use Case",
      icon: UserCheck,
      items: [
        {
          type: "uml_actor",
          label: "Actor",
          iconSvg: (
            <g stroke="#334155" strokeWidth="1.5" fill="none">
              <circle cx="12" cy="6" r="3" />
              <line x1="12" y1="9" x2="12" y2="16" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="12" y1="16" x2="7" y2="21" />
              <line x1="12" y1="16" x2="17" y2="21" />
            </g>
          ),
        },
        {
          type: "uml_usecase",
          label: "Use Case",
          iconSvg: <ellipse cx="12" cy="12" rx="10" ry="7" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />,
        },
        {
          type: "uml_boundary",
          label: "System Boundary",
          iconSvg: (
            <rect x="2" y="2" width="20" height="20" fill="none" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3,2" />
          ),
        },
      ],
    },
    {
      id: "uml_sequence",
      title: "UML Sequence",
      icon: GitBranch,
      items: [
        {
          type: "uml_lifeline",
          label: "Lifeline",
          iconSvg: (
            <g>
              <rect x="5" y="2" width="14" height="8" rx="1" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1.5" />
              <line x1="12" y1="10" x2="12" y2="22" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="3,2" />
            </g>
          ),
        },
        {
          type: "uml_activation",
          label: "Activation Bar",
          iconSvg: <rect x="9" y="3" width="6" height="18" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />,
        },
        {
          type: "uml_fragment",
          label: "Fragment Box",
          iconSvg: (
            <g>
              <rect x="2" y="2" width="20" height="20" fill="none" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3,2" />
              <polygon points="2,2 8,2 10,6 8,10 2,10" fill="#E2E8F0" stroke="#64748B" strokeWidth="1" />
            </g>
          ),
        },
      ],
    },
    {
      id: "erd",
      title: "ERD",
      icon: Database,
      items: [
        {
          type: "erd_entity",
          label: "Entity Table",
          iconSvg: (
            <g>
              <rect x="2" y="3" width="20" height="18" rx="1" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="1.5" />
              <rect x="2" y="3" width="20" height="6" fill="#3B82F6" opacity="0.3" />
              <line x1="2" y1="9" x2="22" y2="9" stroke="#3B82F6" strokeWidth="1" />
              <line x1="2" y1="14" x2="22" y2="14" stroke="#E2E8F0" strokeWidth="1" />
            </g>
          ),
        },
      ],
    },
    {
      id: "architecture",
      title: "Architecture",
      icon: Network,
      items: [
        {
          type: "arch_server",
          label: "Server",
          iconSvg: (
            <g>
              <rect x="3" y="3" width="18" height="18" rx="2" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
              <circle cx="7" cy="7" r="1.5" fill="#10B981" />
              <circle cx="12" cy="7" r="1.5" fill="#6366F1" />
              <line x1="3" y1="12" x2="21" y2="12" stroke="#CBD5E1" strokeWidth="1" />
            </g>
          ),
        },
        {
          type: "arch_database",
          label: "Database",
          iconSvg: (
            <g>
              <path d="M 4 8 L 4 18 A 8 3 0 0 0 20 18 L 20 8" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
              <ellipse cx="12" cy="7" rx="8" ry="3" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
            </g>
          ),
        },
        {
          type: "arch_cloud",
          label: "Cloud",
          iconSvg: <rect x="2" y="5" width="20" height="14" rx="7" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="3,2" />,
        },
        {
          type: "arch_user",
          label: "User",
          iconSvg: (
            <g stroke="#334155" strokeWidth="1.5" fill="none">
              <circle cx="12" cy="6" r="3" />
              <line x1="12" y1="9" x2="12" y2="16" />
              <line x1="6" y1="12" x2="18" y2="12" />
            </g>
          ),
        },
        {
          type: "arch_service",
          label: "API / Service",
          iconSvg: <rect x="2" y="4" width="20" height="16" rx="3" fill="#F1F5F9" stroke="#475569" strokeWidth="1.5" />,
        },
        {
          type: "arch_queue",
          label: "Queue",
          iconSvg: (
            <g>
              <rect x="2" y="6" width="20" height="12" rx="2" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
              <line x1="8" y1="6" x2="8" y2="18" stroke="#DC2626" strokeWidth="1" />
              <line x1="14" y1="6" x2="14" y2="18" stroke="#DC2626" strokeWidth="1" />
            </g>
          ),
        },
      ],
    },
  ];

  const connectorPresets: ConnectorPresetItem[] = [
    {
      id: "assoc",
      name: "Association",
      style: "straight",
      startArrow: "none",
      endArrow: "none",
      dashed: false,
    },
    {
      id: "dir_assoc",
      name: "Directed Association",
      style: "straight",
      startArrow: "none",
      endArrow: "arrow",
      dashed: false,
    },
    {
      id: "inheritance",
      name: "Inheritance",
      style: "straight",
      startArrow: "none",
      endArrow: "hollow_triangle",
      dashed: false,
    },
    {
      id: "composition",
      name: "Composition",
      style: "straight",
      startArrow: "filled_diamond",
      endArrow: "arrow",
      dashed: false,
    },
    {
      id: "aggregation",
      name: "Aggregation",
      style: "straight",
      startArrow: "hollow_diamond",
      endArrow: "arrow",
      dashed: false,
    },
    {
      id: "realization",
      name: "Realization",
      style: "straight",
      startArrow: "none",
      endArrow: "hollow_triangle",
      dashed: true,
    },
    {
      id: "dependency",
      name: "Dependency",
      style: "straight",
      startArrow: "none",
      endArrow: "open_arrow",
      dashed: true,
    },
    {
      id: "include",
      name: "«include»",
      style: "straight",
      startArrow: "none",
      endArrow: "open_arrow",
      dashed: true,
      label: "«include»",
    },
    {
      id: "extend",
      name: "«extend»",
      style: "straight",
      startArrow: "none",
      endArrow: "open_arrow",
      dashed: true,
      label: "«extend»",
    },
    {
      id: "sync_msg",
      name: "Sync message",
      style: "straight",
      startArrow: "none",
      endArrow: "arrow",
      dashed: false,
    },
    {
      id: "async_msg",
      name: "Async message",
      style: "straight",
      startArrow: "none",
      endArrow: "open_arrow",
      dashed: false,
    },
    {
      id: "return_msg",
      name: "Return message",
      style: "straight",
      startArrow: "none",
      endArrow: "open_arrow",
      dashed: true,
    },
  ];

  if (isCollapsed) {
    return (
      <div className="w-10 bg-white border-r border-slate-200 flex flex-col items-center py-2 select-none z-20 shrink-0">
        <button
          onClick={onToggleCollapse}
          title="Open Shape Library"
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[240px] bg-white border-r border-slate-200 flex flex-col select-none z-20 shrink-0 font-sans text-xs">
      {/* Header */}
      <div className="h-9 px-3 border-b border-slate-200 flex items-center justify-between text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
        <span>Shapes</span>
        <button
          onClick={onToggleCollapse}
          title="Collapse Shape Library"
          className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-slate-200">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search shapes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Categories Accordion */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {/* Shape Categories */}
        {categories.map((cat) => {
          const isOpen = openSections[cat.id];
          const filteredItems = cat.items.filter((item) =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (searchQuery && filteredItems.length === 0) return null;

          return (
            <div key={cat.id}>
              <button
                onClick={() => toggleSection(cat.id)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <cat.icon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{cat.title}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="p-2 grid grid-cols-2 gap-1.5 bg-slate-50/50">
                  {filteredItems.map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/stargraph-shape", item.type);
                      }}
                      onClick={() => onAddShapeAtCenter(item.type)}
                      title={`Click or drag to canvas: ${item.label}`}
                      className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-xs cursor-grab active:cursor-grabbing transition-all group"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" className="mb-1 text-slate-600">
                        {item.iconSvg}
                      </svg>
                      <span className="text-[10px] text-slate-600 group-hover:text-indigo-600 truncate max-w-full font-medium">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Connectors Category */}
        <div>
          <button
            onClick={() => toggleSection("connectors")}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 text-slate-700 font-medium transition-colors"
          >
            <div className="flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Connectors & UML</span>
            </div>
            {openSections["connectors"] ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {openSections["connectors"] && (
            <div className="p-2 space-y-1 bg-slate-50/50">
              <p className="text-[10px] text-slate-500 px-1 pb-1">
                Select a preset to draw arrows between shapes:
              </p>
              {connectorPresets.map((preset) => {
                const isActive = activeConnectorPreset?.endArrow === preset.endArrow &&
                  activeConnectorPreset?.startArrow === preset.startArrow &&
                  activeConnectorPreset?.dashed === preset.dashed;

                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectConnectorPreset(preset)}
                    className={`w-full px-2 py-1.5 rounded-md flex items-center justify-between text-left transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-400 font-medium"
                        : "hover:bg-white text-slate-700 border border-transparent"
                    }`}
                  >
                    <span className="text-[11px] truncate">{preset.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {preset.dashed ? "dashed" : "solid"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { DiagramType } from "./types";
import { GitBranch, Box, Database, Network, Workflow, UserCheck, X } from "lucide-react";

interface NewDiagramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string;
  onCreate: (name: string, type: DiagramType) => void;
}

const diagramTypes: Array<{ type: DiagramType; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }> = [
  {
    type: "flowchart",
    label: "Flowchart",
    desc: "Process workflows, decision logic, and step-by-step algorithms.",
    icon: Workflow,
  },
  {
    type: "uml_class",
    label: "UML Class",
    desc: "Object-oriented structures, interfaces, and inheritance hierarchies.",
    icon: Box,
  },
  {
    type: "uml_sequence",
    label: "UML Sequence",
    desc: "Lifelines, sync/async messages, and temporal interactions.",
    icon: GitBranch,
  },
  {
    type: "uml_usecase",
    label: "UML Use Case",
    desc: "Actor roles, system boundaries, and user interactions.",
    icon: UserCheck,
  },
  {
    type: "erd",
    label: "Database ERD",
    desc: "Relational database tables, primary/foreign keys, and cardinalities.",
    icon: Database,
  },
  {
    type: "architecture",
    label: "System Architecture",
    desc: "Cloud services, servers, queues, and distributed topology.",
    icon: Network,
  },
];

export function NewDiagramDialog({
  isOpen,
  onClose,
  folderName,
  onCreate,
}: NewDiagramDialogProps) {
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState<DiagramType>("flowchart");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), selectedType);
    setName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="w-[460px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Create New Diagram</h2>
            <p className="text-xs text-slate-500">Creating in folder: <span className="font-medium text-slate-700">{folderName}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Diagram Name</label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Payment Gateway Flow"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Diagram Type</label>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {diagramTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedType === item.type;
                return (
                  <div
                    key={item.type}
                    onClick={() => setSelectedType(item.type)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1 rounded ${isSelected ? "text-indigo-600" : "text-slate-500"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-md shadow-2xs transition-colors"
            >
              Create Diagram
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Minimize2,
  Workflow,
  Box,
  GitBranch,
  UserCheck,
  Database,
  Network,
  FileText,
  MoreVertical,
  Trash2,
  Copy,
  Edit2,
  FolderPlus,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { DiagramType, FileItem, FolderItem, ProjectTree } from "./types";
import { NewDiagramDialog } from "./NewDiagramDialog";

interface ExplorerSidebarProps {
  projectTree: ProjectTree;
  activeFileId: string;
  onOpenFile: (fileId: string) => void;
  onUpdateTree: (tree: ProjectTree) => void;
  onDeleteFile: (fileId: string) => void;
  onDuplicateFile: (fileId: string) => void;
  onCreateDiagramInFolder: (folderId: string, name: string, type: DiagramType) => void;
  onCreateFolder: (parentFolderId?: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ExplorerSidebar({
  projectTree,
  activeFileId,
  onOpenFile,
  onUpdateTree,
  onDeleteFile,
  onDuplicateFile,
  onCreateDiagramInFolder,
  onCreateFolder,
  isCollapsed,
  onToggleCollapse,
}: ExplorerSidebarProps) {
  const [width, setWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetId: string;
    targetKind: "folder" | "file";
  } | null>(null);

  // Inline Rename
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // New Diagram Dialog
  const [dialogFolder, setDialogFolder] = useState<{ id: string; name: string } | null>(null);

  // Drag and drop tracking
  const [draggingFileId, setDraggingFileId] = useState<string | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);

  // Delete Confirmation
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{
    id: string;
    name: string;
    kind: "folder" | "file";
  } | null>(null);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Resize drag listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(180, Math.min(480, e.clientX));
      setWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  const getDiagramIcon = (type: DiagramType) => {
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

  // Collapse all folders
  const handleCollapseAll = () => {
    const collapseItems = (items: Array<FolderItem | FileItem>): Array<FolderItem | FileItem> => {
      return items.map((item) => {
        if (item.kind === "folder") {
          return {
            ...item,
            isOpen: false,
            children: collapseItems(item.children),
          };
        }
        return item;
      });
    };
    onUpdateTree({ ...projectTree, items: collapseItems(projectTree.items) });
  };

  // Toggle single folder
  const handleToggleFolder = (folderId: string) => {
    const toggleFolder = (items: Array<FolderItem | FileItem>): Array<FolderItem | FileItem> => {
      return items.map((item) => {
        if (item.kind === "folder") {
          if (item.id === folderId) {
            return { ...item, isOpen: !item.isOpen };
          }
          return { ...item, children: toggleFolder(item.children) };
        }
        return item;
      });
    };
    onUpdateTree({ ...projectTree, items: toggleFolder(projectTree.items) });
  };

  // Rename commit
  const handleCommitRename = () => {
    if (!editingId || !editingName.trim()) {
      setEditingId(null);
      return;
    }
    const renameInTree = (items: Array<FolderItem | FileItem>): Array<FolderItem | FileItem> => {
      return items.map((item) => {
        if (item.id === editingId) {
          return { ...item, name: editingName.trim() };
        }
        if (item.kind === "folder") {
          return { ...item, children: renameInTree(item.children) };
        }
        return item;
      });
    };
    onUpdateTree({ ...projectTree, items: renameInTree(projectTree.items) });
    setEditingId(null);
  };

  // Drag and drop file to folder move
  const handleFileDropOnFolder = (targetFolderId: string) => {
    if (!draggingFileId || draggingFileId === targetFolderId) return;

    let extractedFile: FileItem | null = null;

    // 1. Remove from original location
    const removeItem = (items: Array<FolderItem | FileItem>): Array<FolderItem | FileItem> => {
      const result: Array<FolderItem | FileItem> = [];
      for (const it of items) {
        if (it.id === draggingFileId && it.kind === "file") {
          extractedFile = it;
        } else if (it.kind === "folder") {
          result.push({ ...it, children: removeItem(it.children) });
        } else {
          result.push(it);
        }
      }
      return result;
    };

    const treeWithoutFile = removeItem(projectTree.items);

    if (!extractedFile) return;

    // 2. Add to target folder
    const addToFolder = (items: Array<FolderItem | FileItem>): Array<FolderItem | FileItem> => {
      return items.map((it) => {
        if (it.kind === "folder") {
          if (it.id === targetFolderId) {
            return {
              ...it,
              isOpen: true,
              children: [...it.children, extractedFile!],
            };
          }
          return { ...it, children: addToFolder(it.children) };
        }
        return it;
      });
    };

    onUpdateTree({ ...projectTree, items: addToFolder(treeWithoutFile) });
    setDraggingFileId(null);
    setDropTargetFolderId(null);
  };

  // Filter items by search
  const filterTree = (items: Array<FolderItem | FileItem>): Array<FolderItem | FileItem> => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();

    return items
      .map((item) => {
        if (item.kind === "folder") {
          const matchingChildren = filterTree(item.children);
          const folderMatches = item.name.toLowerCase().includes(query);
          if (folderMatches || matchingChildren.length > 0) {
            return { ...item, isOpen: true, children: matchingChildren };
          }
          return null;
        }
        return item.name.toLowerCase().includes(query) ? item : null;
      })
      .filter(Boolean) as Array<FolderItem | FileItem>;
  };

  if (isCollapsed) {
    return (
      <div className="w-10 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-2 select-none z-20 shrink-0">
        <button
          onClick={onToggleCollapse}
          title="Open Explorer (Ctrl+B)"
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ width }}
      className="relative h-full bg-slate-50 border-r border-slate-200 flex flex-col select-none z-20 shrink-0 font-sans text-xs"
    >
      {/* Explorer Top Header */}
      <div className="h-9 px-3 border-b border-slate-200 flex items-center justify-between text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
        <span>Explorer</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCreateFolder()}
            title="New Folder"
            className="p-1 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCollapseAll}
            title="Collapse All Folders"
            className="p-1 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
            className="p-1 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-slate-200">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto py-1">
        {filterTree(projectTree.items).map((item) => (
          <TreeItemRow
            key={item.id}
            item={item}
            level={0}
            activeFileId={activeFileId}
            onOpenFile={onOpenFile}
            onToggleFolder={handleToggleFolder}
            editingId={editingId}
            editingName={editingName}
            setEditingName={setEditingName}
            onCommitRename={handleCommitRename}
            onStartRename={(id, name) => {
              setEditingId(id);
              setEditingName(name);
            }}
            onContextMenu={(e, id, kind) => {
              e.preventDefault();
              setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetId: id, targetKind: kind });
            }}
            draggingFileId={draggingFileId}
            setDraggingFileId={setDraggingFileId}
            dropTargetFolderId={dropTargetFolderId}
            setDropTargetFolderId={setDropTargetFolderId}
            onFileDropOnFolder={handleFileDropOnFolder}
            onOpenNewDiagramDialog={(folderId, folderName) =>
              setDialogFolder({ id: folderId, name: folderName })
            }
            getDiagramIcon={getDiagramIcon}
          />
        ))}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-400 transition-colors"
      />

      {/* Right-click Context Menu */}
      {contextMenu?.visible && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-44 bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-xs text-slate-700"
        >
          {contextMenu.targetKind === "folder" ? (
            <>
              <button
                onClick={() => {
                  const f = projectTree.items.find((i) => i.id === contextMenu.targetId);
                  setDialogFolder({ id: contextMenu.targetId, name: f?.name || "Folder" });
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>New Diagram</span>
              </button>
              <button
                onClick={() => {
                  onCreateFolder(contextMenu.targetId);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700"
              >
                <FolderPlus className="w-3.5 h-3.5 text-slate-500" />
                <span>New Subfolder</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onDuplicateFile(contextMenu.targetId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Duplicate</span>
            </button>
          )}

          <button
            onClick={() => {
              const findName = (items: Array<FolderItem | FileItem>): string => {
                for (const item of items) {
                  if (item.id === contextMenu.targetId) return item.name;
                  if (item.kind === "folder") {
                    const res = findName(item.children);
                    if (res) return res;
                  }
                }
                return "";
              };
              setEditingId(contextMenu.targetId);
              setEditingName(findName(projectTree.items));
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-700"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Rename</span>
          </button>

          <div className="h-px bg-slate-100 my-1" />

          <button
            onClick={() => {
              const findName = (items: Array<FolderItem | FileItem>): string => {
                for (const item of items) {
                  if (item.id === contextMenu.targetId) return item.name;
                  if (item.kind === "folder") {
                    const res = findName(item.children);
                    if (res) return res;
                  }
                }
                return "";
              };
              setConfirmDeleteItem({
                id: contextMenu.targetId,
                name: findName(projectTree.items) || "Item",
                kind: contextMenu.targetKind,
              });
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Delete {confirmDeleteItem.kind === "folder" ? "Folder" : "Diagram"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmDeleteItem.kind === "folder" ? (
                <>
                  Are you sure you want to delete the folder{" "}
                  <strong className="text-slate-900">&quot;{confirmDeleteItem.name}&quot;</strong>? Everything inside it will also be permanently deleted.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete the diagram{" "}
                  <strong className="text-slate-900">&quot;{confirmDeleteItem.name}&quot;</strong>?
                </>
              )}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteItem(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteFile(confirmDeleteItem.id);
                  setConfirmDeleteItem(null);
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Diagram Modal */}
      <NewDiagramDialog
        isOpen={Boolean(dialogFolder)}
        onClose={() => setDialogFolder(null)}
        folderName={dialogFolder?.name || ""}
        onCreate={(name, type) => {
          if (dialogFolder) {
            onCreateDiagramInFolder(dialogFolder.id, name, type);
          }
        }}
      />
    </div>
  );
}

// Sub-component for rendering tree rows
interface TreeItemRowProps {
  item: FolderItem | FileItem;
  level: number;
  activeFileId: string;
  onOpenFile: (fileId: string) => void;
  onToggleFolder: (id: string) => void;
  editingId: string | null;
  editingName: string;
  setEditingName: (name: string) => void;
  onCommitRename: () => void;
  onStartRename: (id: string, name: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string, kind: "folder" | "file") => void;
  draggingFileId: string | null;
  setDraggingFileId: (id: string | null) => void;
  dropTargetFolderId: string | null;
  setDropTargetFolderId: (id: string | null) => void;
  onFileDropOnFolder: (folderId: string) => void;
  onOpenNewDiagramDialog: (folderId: string, folderName: string) => void;
  getDiagramIcon: (type: DiagramType) => React.ReactNode;
}

function TreeItemRow({
  item,
  level,
  activeFileId,
  onOpenFile,
  onToggleFolder,
  editingId,
  editingName,
  setEditingName,
  onCommitRename,
  onStartRename,
  onContextMenu,
  draggingFileId,
  setDraggingFileId,
  dropTargetFolderId,
  setDropTargetFolderId,
  onFileDropOnFolder,
  onOpenNewDiagramDialog,
  getDiagramIcon,
}: TreeItemRowProps) {
  const isFolder = item.kind === "folder";
  const isEditing = editingId === item.id;
  const isFileActive = item.kind === "file" && item.id === activeFileId;
  const isTargetFolder = dropTargetFolderId === item.id;

  const paddingLeft = 12 + level * 14;

  if (isFolder) {
    const folder = item as FolderItem;
    return (
      <div>
        <div
          style={{ paddingLeft }}
          onClick={() => onToggleFolder(folder.id)}
          onContextMenu={(e) => onContextMenu(e, folder.id, "folder")}
          onDragOver={(e) => {
            e.preventDefault();
            if (draggingFileId) setDropTargetFolderId(folder.id);
          }}
          onDragLeave={() => {
            if (dropTargetFolderId === folder.id) setDropTargetFolderId(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            onFileDropOnFolder(folder.id);
          }}
          className={`h-7 pr-2 flex items-center justify-between cursor-pointer group transition-colors ${
            isTargetFolder
              ? "bg-indigo-100 ring-1 ring-indigo-400"
              : "hover:bg-slate-200/60 text-slate-700"
          }`}
        >
          <div className="flex items-center gap-1.5 truncate flex-1">
            <span className="text-slate-400">
              {folder.isOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
            <span className="text-amber-500">
              {folder.isOpen ? (
                <FolderOpen className="w-3.5 h-3.5" />
              ) : (
                <Folder className="w-3.5 h-3.5" />
              )}
            </span>

            {isEditing ? (
              <input
                type="text"
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={onCommitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCommitRename();
                  else if (e.key === "Escape") setEditingName("");
                }}
                className="w-full px-1 py-0.5 bg-white border border-indigo-500 rounded text-slate-800 text-xs outline-none"
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onStartRename(folder.id, folder.name);
                }}
                className="font-medium text-slate-700 truncate"
              >
                {folder.name}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenNewDiagramDialog(folder.id, folder.name);
            }}
            title="Create Diagram in this Folder"
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-300 rounded text-slate-600 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Children */}
        {folder.isOpen &&
          folder.children.map((child) => (
            <TreeItemRow
              key={child.id}
              item={child}
              level={level + 1}
              activeFileId={activeFileId}
              onOpenFile={onOpenFile}
              onToggleFolder={onToggleFolder}
              editingId={editingId}
              editingName={editingName}
              setEditingName={setEditingName}
              onCommitRename={onCommitRename}
              onStartRename={onStartRename}
              onContextMenu={onContextMenu}
              draggingFileId={draggingFileId}
              setDraggingFileId={setDraggingFileId}
              dropTargetFolderId={dropTargetFolderId}
              setDropTargetFolderId={setDropTargetFolderId}
              onFileDropOnFolder={onFileDropOnFolder}
              onOpenNewDiagramDialog={onOpenNewDiagramDialog}
              getDiagramIcon={getDiagramIcon}
            />
          ))}
      </div>
    );
  }

  // File row
  const file = item as FileItem;
  return (
    <div
      style={{ paddingLeft }}
      draggable
      onDragStart={() => setDraggingFileId(file.id)}
      onDragEnd={() => setDraggingFileId(null)}
      onClick={() => onOpenFile(file.id)}
      onContextMenu={(e) => onContextMenu(e, file.id, "file")}
      className={`h-7 pr-2 flex items-center justify-between cursor-pointer group transition-colors ${
        isFileActive
          ? "bg-indigo-50 text-indigo-700 font-medium"
          : "hover:bg-slate-200/60 text-slate-600"
      }`}
    >
      <div className="flex items-center gap-2 truncate flex-1">
        {getDiagramIcon(file.diagramType)}

        {isEditing ? (
          <input
            type="text"
            autoFocus
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={onCommitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCommitRename();
              else if (e.key === "Escape") setEditingName("");
            }}
            className="w-full px-1 py-0.5 bg-white border border-indigo-500 rounded text-slate-800 text-xs outline-none"
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              onStartRename(file.id, file.name);
            }}
            className="truncate"
          >
            {file.name}
          </span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu(e, file.id, "file");
        }}
        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-300 rounded text-slate-500 transition-opacity"
      >
        <MoreVertical className="w-3 h-3" />
      </button>
    </div>
  );
}

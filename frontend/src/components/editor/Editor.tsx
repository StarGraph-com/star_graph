"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  DiagramData,
  DiagramShape,
  DiagramConnector,
  DiagramSettings,
  DiagramType,
  FileItem,
  FolderItem,
  Point,
  ProjectTree,
  LineStyle,
  ArrowType,
} from "./types";
import {
  defaultShapeStyle,
  defaultTextStyle,
  initialDiagrams,
  initialProjectTree,
} from "./mockData";
import { EditorTopBar, SaveStatus } from "./EditorTopBar";
import { ExplorerSidebar } from "./ExplorerSidebar";
import { ShapeLibrary } from "./ShapeLibrary";
import { FileTabs, TabItem } from "./FileTabs";
import { Canvas } from "./Canvas";
import { FormatPanel } from "./FormatPanel";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  isSupabaseConfigured,
  getSupabase,
  apiFetchNodes,
  apiCreateNode,
  apiRenameNode,
  apiMoveNode,
  apiDuplicateNode,
  apiDeleteNode,
  apiUpdateProjectName,
  apiFetchDiagramContent,
  apiSaveDiagramContent,
  apiFetchProjects,
} from "@/lib/supabaseClient";
import { NodeRow } from "@/types/database";
import { Loader2 } from "lucide-react";

interface HistoryEntry {
  shapes: DiagramShape[];
  connectors: DiagramConnector[];
}

function buildTreeFromNodes(
  nodes: NodeRow[],
  projectName: string,
  projectId: string
): ProjectTree {
  const nodeMap: Record<string, FolderItem | FileItem> = {};

  for (const n of nodes) {
    if (n.type === "folder") {
      nodeMap[n.id] = {
        id: n.id,
        name: n.name,
        kind: "folder",
        isOpen: true,
        children: [],
      };
    } else {
      nodeMap[n.id] = {
        id: n.id,
        name: n.name,
        kind: "file",
        diagramType: (n.diagram_type as DiagramType) || "flowchart",
      };
    }
  }

  const rootItems: Array<FolderItem | FileItem> = [];
  for (const n of nodes) {
    const item = nodeMap[n.id];
    if (n.parent_id && nodeMap[n.parent_id] && nodeMap[n.parent_id].kind === "folder") {
      (nodeMap[n.parent_id] as FolderItem).children.push(item);
    } else {
      rootItems.push(item);
    }
  }

  return {
    id: projectId,
    name: projectName,
    items: rootItems,
  };
}

export function Editor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectParam = searchParams.get("project");

  const { user, loadingSession } = useAuth();
  const toast = useToast();

  const [projectId, setProjectId] = useState<string>(projectParam || "");
  const [projectLoading, setProjectLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);

  // Project & Tree State
  const [projectTree, setProjectTree] = useState<ProjectTree>(initialProjectTree);

  // All Diagram Files Data in State
  const [diagrams, setDiagrams] = useState<Record<string, DiagramData>>(initialDiagrams);

  // Open Tabs State
  const [openTabs, setOpenTabs] = useState<TabItem[]>([
    { id: "diag_login_flow", name: "Login Flow", diagramType: "flowchart" },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("diag_login_flow");

  // Selection
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);

  // Clipboard
  const [clipboard, setClipboard] = useState<{
    shapes: DiagramShape[];
    connectors: DiagramConnector[];
  } | null>(null);

  // Active connector preset
  const [activeConnectorPreset, setActiveConnectorPreset] = useState<{
    style: LineStyle;
    startArrow: ArrowType;
    endArrow: ArrowType;
    dashed: boolean;
    label?: string;
  }>({
    style: "orthogonal",
    startArrow: "none",
    endArrow: "arrow",
    dashed: false,
  });

  // Sidebar Collapsed States
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);
  const [isFormatCollapsed, setIsFormatCollapsed] = useState(false);

  // History per diagram
  const [history, setHistory] = useState<
    Record<string, { past: HistoryEntry[]; future: HistoryEntry[] }>
  >({
    diag_login_flow: { past: [], future: [] },
  });

  // Auto-Save Status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Protect route: Logged-out users see only auth screen
  useEffect(() => {
    if (!loadingSession && !user) {
      router.replace("/login");
    }
  }, [loadingSession, user, router]);

  // Load Project and File Tree
  useEffect(() => {
    let active = true;

    async function initProject() {
      if (!user) return;
      setProjectLoading(true);

      try {
        let currentProjId = projectParam;

        if (!currentProjId) {
          const lastProj = localStorage.getItem("stargraph_last_project");
          if (lastProj) {
            currentProjId = lastProj;
          } else if (isSupabaseConfigured) {
            const list = await apiFetchProjects();
            if (list.length > 0) {
              currentProjId = list[0].id;
            }
          }
        }

        if (currentProjId) {
          setProjectId(currentProjId);
          localStorage.setItem("stargraph_last_project", currentProjId);

          if (isSupabaseConfigured) {
            const sb = getSupabase();
            const { data: projData, error: projError } = await sb
              .from("projects")
              .select("name")
              .eq("id", currentProjId)
              .single();

            if (projError) throw projError;

            const nodes = await apiFetchNodes(currentProjId);
            if (!active) return;

            const tree = buildTreeFromNodes(nodes, projData.name, currentProjId);
            setProjectTree(tree);

            const savedTabsJson = localStorage.getItem(`stargraph_tabs_${currentProjId}`);
            const savedActiveTab = localStorage.getItem(`stargraph_active_${currentProjId}`);

            const firstFile = nodes.find((n) => n.type === "diagram");
            let initialTabList: TabItem[] = [];

            if (savedTabsJson) {
              try {
                initialTabList = JSON.parse(savedTabsJson);
              } catch {
                initialTabList = [];
              }
            }

            if (initialTabList.length === 0 && firstFile) {
              initialTabList = [
                {
                  id: firstFile.id,
                  name: firstFile.name,
                  diagramType: (firstFile.diagram_type as DiagramType) || "flowchart",
                },
              ];
            }

            if (initialTabList.length > 0) {
              setOpenTabs(initialTabList);
              const targetActive =
                savedActiveTab && initialTabList.some((t) => t.id === savedActiveTab)
                  ? savedActiveTab
                  : initialTabList[0].id;
              setActiveTabId(targetActive);
            }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load project";
        toast.error("Database Error", msg);
      } finally {
        if (active) setProjectLoading(false);
      }
    }

    if (user) {
      initProject();
    }

    return () => {
      active = false;
    };
  }, [user, projectParam, toast]);

  // Load Diagram Content when active tab changes
  useEffect(() => {
    let active = true;

    async function loadContent() {
      if (!isSupabaseConfigured || !activeTabId || activeTabId.startsWith("diag_login_flow")) {
        return;
      }

      if (diagrams[activeTabId]?.shapes !== undefined) {
        return;
      }

      setContentLoading(true);
      try {
        const remoteContent = await apiFetchDiagramContent(activeTabId);
        if (!active) return;

        const typedContent = remoteContent as {
          shapes?: DiagramShape[];
          connectors?: DiagramConnector[];
          viewport?: { panX: number; panY: number; zoom: number };
          settings?: DiagramSettings;
        };

        const activeTabInfo = openTabs.find((t) => t.id === activeTabId);

        setDiagrams((prev) => ({
          ...prev,
          [activeTabId]: {
            id: activeTabId,
            name: activeTabInfo?.name || "Diagram",
            type: activeTabInfo?.diagramType || "flowchart",
            shapes: typedContent?.shapes || [],
            connectors: typedContent?.connectors || [],
            viewport: typedContent?.viewport || { panX: 60, panY: 60, zoom: 1 },
            settings: typedContent?.settings || {
              showGrid: true,
              snapToGrid: true,
              gridSize: 20,
              backgroundColor: "#F8FAFC",
            },
          },
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load diagram content";
        toast.error("Load Error", msg);
      } finally {
        if (active) setContentLoading(false);
      }
    }

    loadContent();

    return () => {
      active = false;
    };
  }, [activeTabId, diagrams, openTabs, toast]);

  // Save tabs state to localStorage for refresh persistence
  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`stargraph_tabs_${projectId}`, JSON.stringify(openTabs));
      localStorage.setItem(`stargraph_active_${projectId}`, activeTabId);
    }
  }, [openTabs, activeTabId, projectId]);

  // Active Diagram
  const activeDiagram: DiagramData = useMemo(() => {
    return (
      diagrams[activeTabId] || {
        id: activeTabId,
        name: openTabs.find((t) => t.id === activeTabId)?.name || "Untitled Diagram",
        type: openTabs.find((t) => t.id === activeTabId)?.diagramType || "flowchart",
        shapes: [],
        connectors: [],
        viewport: { panX: 50, panY: 50, zoom: 1 },
        settings: {
          showGrid: true,
          snapToGrid: true,
          gridSize: 20,
          backgroundColor: "#F8FAFC",
        },
      }
    );
  }, [diagrams, activeTabId, openTabs]);

  // Debounced Auto-Save to Supabase after 1.5 seconds of inactivity
  const triggerAutoSave = useCallback(
    (diagram: DiagramData) => {
      if (!isSupabaseConfigured || !diagram.id || diagram.id.startsWith("diag_login_flow")) {
        setSaveStatus("saved");
        return;
      }

      setSaveStatus("saving");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await apiSaveDiagramContent(diagram.id, {
            shapes: diagram.shapes,
            connectors: diagram.connectors,
            viewport: diagram.viewport,
            settings: diagram.settings,
          });
          setSaveStatus("saved");
        } catch (err: unknown) {
          setSaveStatus("error");
          const msg = err instanceof Error ? err.message : "Auto-save failed";
          toast.error("Save Failed", msg);
        }
      }, 1500);
    },
    [toast]
  );

  // Breadcrumbs folder name
  const currentFolderName = useMemo(() => {
    const findFolder = (items: Array<FolderItem | FileItem>, parent = "Root"): string => {
      for (const it of items) {
        if (it.id === activeTabId) return parent;
        if (it.kind === "folder") {
          const res = findFolder(it.children, it.name);
          if (res) return res;
        }
      }
      return parent;
    };
    return findFolder(projectTree.items);
  }, [projectTree, activeTabId]);

  // Push to Undo History
  const pushHistory = useCallback(
    (diagramId: string, currentShapes: DiagramShape[], currentConnectors: DiagramConnector[]) => {
      setHistory((prev) => {
        const diagramHistory = prev[diagramId] || { past: [], future: [] };
        return {
          ...prev,
          [diagramId]: {
            past: [
              ...diagramHistory.past.slice(-30),
              {
                shapes: JSON.parse(JSON.stringify(currentShapes)),
                connectors: JSON.parse(JSON.stringify(currentConnectors)),
              },
            ],
            future: [],
          },
        };
      });
    },
    []
  );

  // Undo Handler
  const handleUndo = useCallback(() => {
    const diagramHistory = history[activeTabId];
    if (!diagramHistory || diagramHistory.past.length === 0) return;

    const previous = diagramHistory.past[diagramHistory.past.length - 1];
    const newPast = diagramHistory.past.slice(0, -1);

    setHistory((prev) => ({
      ...prev,
      [activeTabId]: {
        past: newPast,
        future: [
          {
            shapes: JSON.parse(JSON.stringify(activeDiagram.shapes)),
            connectors: JSON.parse(JSON.stringify(activeDiagram.connectors)),
          },
          ...diagramHistory.future,
        ],
      },
    }));

    const updatedDiagram: DiagramData = {
      ...activeDiagram,
      shapes: previous.shapes,
      connectors: previous.connectors,
    };

    setDiagrams((prev) => ({
      ...prev,
      [activeTabId]: updatedDiagram,
    }));

    triggerAutoSave(updatedDiagram);
  }, [history, activeTabId, activeDiagram, triggerAutoSave]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    const diagramHistory = history[activeTabId];
    if (!diagramHistory || diagramHistory.future.length === 0) return;

    const next = diagramHistory.future[0];
    const newFuture = diagramHistory.future.slice(1);

    setHistory((prev) => ({
      ...prev,
      [activeTabId]: {
        past: [
          ...diagramHistory.past,
          {
            shapes: JSON.parse(JSON.stringify(activeDiagram.shapes)),
            connectors: JSON.parse(JSON.stringify(activeDiagram.connectors)),
          },
        ],
        future: newFuture,
      },
    }));

    const updatedDiagram: DiagramData = {
      ...activeDiagram,
      shapes: next.shapes,
      connectors: next.connectors,
    };

    setDiagrams((prev) => ({
      ...prev,
      [activeTabId]: updatedDiagram,
    }));

    triggerAutoSave(updatedDiagram);
  }, [history, activeTabId, activeDiagram, triggerAutoSave]);

  // Update shapes
  const handleUpdateShapes = useCallback(
    (
      newShapes: DiagramShape[],
      pushToHistory = false,
      historySnapshot?: { shapes: DiagramShape[]; connectors: DiagramConnector[] }
    ) => {
      if (pushToHistory) {
        const snapShapes = historySnapshot ? historySnapshot.shapes : activeDiagram.shapes;
        const snapConnectors = historySnapshot ? historySnapshot.connectors : activeDiagram.connectors;
        pushHistory(activeTabId, snapShapes, snapConnectors);
      }
      const updatedShapeMap = new Map(newShapes.map((s) => [s.id, s]));
      const mergedShapes = activeDiagram.shapes.map((s) => updatedShapeMap.get(s.id) || s);
      const existingIds = new Set(activeDiagram.shapes.map((s) => s.id));
      for (const s of newShapes) {
        if (!existingIds.has(s.id)) {
          mergedShapes.push(s);
        }
      }

      const updatedDiagram: DiagramData = {
        ...activeDiagram,
        shapes: mergedShapes,
      };
      setDiagrams((prev) => ({
        ...prev,
        [activeTabId]: updatedDiagram,
      }));
      triggerAutoSave(updatedDiagram);
    },
    [activeTabId, activeDiagram, pushHistory, triggerAutoSave]
  );

  // Update connector
  const handleUpdateConnector = useCallback(
    (updated: DiagramConnector, pushToHistory = false) => {
      if (pushToHistory) {
        pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);
      }
      const updatedDiagram: DiagramData = {
        ...activeDiagram,
        connectors: activeDiagram.connectors.map((c) => (c.id === updated.id ? updated : c)),
      };
      setDiagrams((prev) => ({
        ...prev,
        [activeTabId]: updatedDiagram,
      }));
      triggerAutoSave(updatedDiagram);
    },
    [activeTabId, activeDiagram, pushHistory, triggerAutoSave]
  );

  // Add connector
  const handleAddConnector = useCallback(
    (newConnector: DiagramConnector) => {
      pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);
      const updatedDiagram: DiagramData = {
        ...activeDiagram,
        connectors: [...activeDiagram.connectors, newConnector],
      };
      setDiagrams((prev) => ({
        ...prev,
        [activeTabId]: updatedDiagram,
      }));
      setSelectedConnectorId(newConnector.id);
      setSelectedShapeIds([]);
      triggerAutoSave(updatedDiagram);
    },
    [activeTabId, activeDiagram, pushHistory, triggerAutoSave]
  );

  // Update Viewport
  const handleUpdateViewport = useCallback(
    (newViewport: { panX: number; panY: number; zoom: number }) => {
      setDiagrams((prev) => ({
        ...prev,
        [activeTabId]: {
          ...prev[activeTabId],
          viewport: newViewport,
        },
      }));
    },
    [activeTabId]
  );

  // Update Settings
  const handleUpdateSettings = useCallback(
    (newSettings: DiagramSettings) => {
      const updatedDiagram: DiagramData = {
        ...activeDiagram,
        settings: newSettings,
      };
      setDiagrams((prev) => ({
        ...prev,
        [activeTabId]: updatedDiagram,
      }));
      triggerAutoSave(updatedDiagram);
    },
    [activeTabId, activeDiagram, triggerAutoSave]
  );

  // Create Shape Factory
  const createShape = useCallback(
    (shapeType: string, point: Point): DiagramShape => {
      const id = `shape_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      let width = 140;
      let height = 70;
      let label = "New Shape";
      let style = { ...defaultShapeStyle };
      let textStyle = { ...defaultTextStyle };

      let attributes: string[] | undefined;
      let methods: string[] | undefined;
      let stereotype: string | undefined;
      let erdAttributes: DiagramShape["erdAttributes"] | undefined;
      let lifelineLength: number | undefined;

      switch (shapeType) {
        case "flowchart_start_end":
          label = "Start / End";
          width = 120;
          height = 50;
          style.fill = "#EEF2FF";
          style.stroke = "#6366F1";
          break;
        case "flowchart_process":
          label = "Process";
          width = 140;
          height = 50;
          break;
        case "flowchart_decision":
          label = "Condition?";
          width = 110;
          height = 80;
          style.fill = "#FEF3C7";
          style.stroke = "#D97706";
          break;
        case "flowchart_io":
          label = "Data Input/Output";
          width = 140;
          height = 55;
          break;
        case "flowchart_document":
          label = "Document";
          width = 130;
          height = 65;
          break;
        case "flowchart_database":
        case "arch_database":
          label = "Database";
          width = 120;
          height = 80;
          style.fill = "#E0F2FE";
          style.stroke = "#0284C7";
          break;
        case "flowchart_swimlane":
          label = "Swimlane Pool";
          width = 400;
          height = 200;
          break;
        case "uml_class":
          label = "ClassName";
          width = 200;
          height = 160;
          style.stroke = "#6366F1";
          attributes = ["- id: UUID", "- name: String"];
          methods = ["+ execute(): Boolean"];
          break;
        case "uml_interface":
          label = "InterfaceName";
          width = 200;
          height = 140;
          stereotype = "interface";
          methods = ["+ execute(): Boolean"];
          break;
        case "uml_enum":
          label = "StatusEnum";
          width = 160;
          height = 130;
          stereotype = "enumeration";
          attributes = ["PENDING", "ACTIVE", "ARCHIVED"];
          break;
        case "uml_actor":
        case "arch_user":
          label = "User";
          width = 80;
          height = 90;
          break;
        case "uml_usecase":
          label = "Place Order";
          width = 130;
          height = 70;
          break;
        case "uml_boundary":
          label = "System Boundary";
          width = 380;
          height = 260;
          break;
        case "uml_lifeline":
          label = ":Service";
          width = 120;
          height = 50;
          lifelineLength = 340;
          style.fill = "#EEF2FF";
          style.stroke = "#6366F1";
          break;
        case "uml_activation":
          label = "";
          width = 20;
          height = 100;
          style.fill = "#E2E8F0";
          break;
        case "uml_fragment":
          label = "[condition]";
          width = 280;
          height = 140;
          break;
        case "erd_entity":
          label = "entity_name";
          width = 210;
          height = 150;
          style.stroke = "#3B82F6";
          erdAttributes = [
            { name: "id", type: "UUID", isPk: true },
            { name: "attribute_one", type: "VARCHAR(100)" },
            { name: "created_at", type: "TIMESTAMP" },
          ];
          break;
        case "arch_server":
          label = "Microservice";
          width = 140;
          height = 80;
          break;
        case "arch_cloud":
          label = "AWS Cloud";
          width = 160;
          height = 100;
          style.stroke = "#6366F1";
          break;
        case "arch_service":
          label = "Auth Service";
          width = 140;
          height = 80;
          break;
        case "arch_queue":
          label = "Kafka Stream";
          width = 130;
          height = 70;
          style.fill = "#FEE2E2";
          style.stroke = "#DC2626";
          break;
        case "diamond":
          label = "Decision";
          width = 100;
          height = 100;
          break;
        case "ellipse":
          label = "Ellipse";
          width = 120;
          height = 80;
          break;
        case "triangle":
          label = "Triangle";
          width = 110;
          height = 90;
          break;
        case "note":
        case "uml_note":
          label = "Note text...";
          width = 130;
          height = 90;
          style.fill = "#FEF9C3";
          style.stroke = "#CA8A04";
          break;
        case "text":
          label = "Heading or Text";
          width = 140;
          height = 40;
          break;
        default:
          label = "Rectangle";
          width = 130;
          height = 70;
      }

      return {
        id,
        type: shapeType,
        x: point.x - width / 2,
        y: point.y - height / 2,
        width,
        height,
        rotation: 0,
        label,
        style,
        textStyle,
        zIndex: activeDiagram.shapes.length + 1,
        attributes,
        methods,
        stereotype,
        erdAttributes,
        lifelineLength,
      };
    },
    [activeDiagram]
  );

  // Add shape from library center click
  const handleAddShapeAtCenter = useCallback(
    (shapeType: string) => {
      const centerX = (600 - activeDiagram.viewport.panX) / activeDiagram.viewport.zoom;
      const centerY = (400 - activeDiagram.viewport.panY) / activeDiagram.viewport.zoom;
      const newShape = createShape(shapeType, { x: centerX, y: centerY });

      pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);
      const updatedDiagram: DiagramData = {
        ...activeDiagram,
        shapes: [...activeDiagram.shapes, newShape],
      };
      setDiagrams((prev) => ({
        ...prev,
        [activeTabId]: updatedDiagram,
      }));
      setSelectedShapeIds([newShape.id]);
      setSelectedConnectorId(null);
      triggerAutoSave(updatedDiagram);
    },
    [activeDiagram, activeTabId, createShape, pushHistory, triggerAutoSave]
  );

  // Add shape from drop
  const handleAddShapeFromDrop = useCallback(
    (shapeType: string, point: Point) => {
      const newShape = createShape(shapeType, point);
      pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);
      const updatedDiagram: DiagramData = {
        ...activeDiagram,
        shapes: [...activeDiagram.shapes, newShape],
      };
      setDiagrams((prev) => ({
        ...prev,
        [activeTabId]: updatedDiagram,
      }));
      setSelectedShapeIds([newShape.id]);
      setSelectedConnectorId(null);
      triggerAutoSave(updatedDiagram);
    },
    [activeDiagram, activeTabId, createShape, pushHistory, triggerAutoSave]
  );

  // Delete Selected
  const handleDeleteSelected = useCallback(() => {
    if (selectedConnectorId) {
      pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);
      const updatedDiagram: DiagramData = {
        ...activeDiagram,
        connectors: activeDiagram.connectors.filter((c) => c.id !== selectedConnectorId),
      };
      setDiagrams((prev) => ({
        ...prev,
        [activeTabId]: updatedDiagram,
      }));
      setSelectedConnectorId(null);
      triggerAutoSave(updatedDiagram);
      toast.info("Connector deleted", undefined, {
        label: "Undo (Ctrl+Z)",
        onClick: handleUndo,
      });
    } else if (selectedShapeIds.length > 0) {
      pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);
      const count = selectedShapeIds.length;
      const updatedDiagram: DiagramData = {
        ...activeDiagram,
        shapes: activeDiagram.shapes.filter((s) => !selectedShapeIds.includes(s.id)),
        connectors: activeDiagram.connectors.filter(
          (c) =>
            !selectedShapeIds.includes(c.from.shapeId) &&
            !selectedShapeIds.includes(c.to.shapeId)
        ),
      };
      setDiagrams((prev) => ({
        ...prev,
        [activeTabId]: updatedDiagram,
      }));
      setSelectedShapeIds([]);
      triggerAutoSave(updatedDiagram);
      toast.info(count === 1 ? "Shape deleted" : `${count} shapes deleted`, undefined, {
        label: "Undo (Ctrl+Z)",
        onClick: handleUndo,
      });
    }
  }, [
    selectedConnectorId,
    selectedShapeIds,
    activeTabId,
    activeDiagram,
    pushHistory,
    triggerAutoSave,
    toast,
    handleUndo,
  ]);

  // Duplicate Selected
  const handleDuplicateSelected = useCallback(() => {
    if (selectedShapeIds.length === 0) return;
    pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);

    const clonedShapes: DiagramShape[] = [];

    for (const id of selectedShapeIds) {
      const s = activeDiagram.shapes.find((item) => item.id === id);
      if (s) {
        const newId = `shape_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        clonedShapes.push({
          ...JSON.parse(JSON.stringify(s)),
          id: newId,
          x: s.x + 30,
          y: s.y + 30,
        });
      }
    }

    const updatedDiagram: DiagramData = {
      ...activeDiagram,
      shapes: [...activeDiagram.shapes, ...clonedShapes],
    };

    setDiagrams((prev) => ({
      ...prev,
      [activeTabId]: updatedDiagram,
    }));
    setSelectedShapeIds(clonedShapes.map((s) => s.id));
    triggerAutoSave(updatedDiagram);
  }, [selectedShapeIds, activeDiagram, activeTabId, pushHistory, triggerAutoSave]);

  // Copy
  const handleCopySelected = useCallback(() => {
    const toCopy = activeDiagram.shapes.filter((s) => selectedShapeIds.includes(s.id));
    if (toCopy.length > 0) {
      setClipboard({
        shapes: JSON.parse(JSON.stringify(toCopy)),
        connectors: [],
      });
      toast.info("Copied selection to clipboard");
    }
  }, [selectedShapeIds, activeDiagram, toast]);

  // Paste
  const handlePaste = useCallback(() => {
    if (!clipboard || clipboard.shapes.length === 0) return;
    pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);

    const pastedShapes = clipboard.shapes.map((s) => ({
      ...JSON.parse(JSON.stringify(s)),
      id: `shape_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: s.x + 40,
      y: s.y + 40,
    }));

    const updatedDiagram: DiagramData = {
      ...activeDiagram,
      shapes: [...activeDiagram.shapes, ...pastedShapes],
    };

    setDiagrams((prev) => ({
      ...prev,
      [activeTabId]: updatedDiagram,
    }));
    setSelectedShapeIds(pastedShapes.map((s) => s.id));
    triggerAutoSave(updatedDiagram);
  }, [clipboard, activeTabId, activeDiagram, pushHistory, triggerAutoSave]);

  // Layer Order
  const handleBringToFront = useCallback(() => {
    if (selectedShapeIds.length === 0) return;
    pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);
    const unselected = activeDiagram.shapes.filter((s) => !selectedShapeIds.includes(s.id));
    const selected = activeDiagram.shapes.filter((s) => selectedShapeIds.includes(s.id));
    handleUpdateShapes([...unselected, ...selected], false);
  }, [selectedShapeIds, activeDiagram, handleUpdateShapes, pushHistory, activeTabId]);

  const handleSendToBack = useCallback(() => {
    if (selectedShapeIds.length === 0) return;
    pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);
    const unselected = activeDiagram.shapes.filter((s) => !selectedShapeIds.includes(s.id));
    const selected = activeDiagram.shapes.filter((s) => selectedShapeIds.includes(s.id));
    handleUpdateShapes([...selected, ...unselected], false);
  }, [selectedShapeIds, activeDiagram, handleUpdateShapes, pushHistory, activeTabId]);

  // Grouping
  const handleGroupSelected = useCallback(() => {
    if (selectedShapeIds.length < 2) return;
    pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);
    const groupId = `group_${Date.now()}`;
    const updated = activeDiagram.shapes.map((s) =>
      selectedShapeIds.includes(s.id) ? { ...s, groupId } : s
    );
    handleUpdateShapes(updated, false);
  }, [selectedShapeIds, activeDiagram, handleUpdateShapes, pushHistory, activeTabId]);

  const handleUngroupSelected = useCallback(() => {
    if (selectedShapeIds.length === 0) return;
    pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);
    const updated = activeDiagram.shapes.map((s) =>
      selectedShapeIds.includes(s.id) ? { ...s, groupId: undefined } : s
    );
    handleUpdateShapes(updated, false);
  }, [selectedShapeIds, activeDiagram, handleUpdateShapes, pushHistory, activeTabId]);

  // Alignment
  const handleAlign = useCallback(
    (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      const selected = activeDiagram.shapes.filter((s) => selectedShapeIds.includes(s.id));
      if (selected.length < 2) return;

      pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);

      let targetVal = 0;
      if (alignment === "left") targetVal = Math.min(...selected.map((s) => s.x));
      if (alignment === "right") targetVal = Math.max(...selected.map((s) => s.x + s.width));
      if (alignment === "center") {
        const minX = Math.min(...selected.map((s) => s.x));
        const maxX = Math.max(...selected.map((s) => s.x + s.width));
        targetVal = (minX + maxX) / 2;
      }
      if (alignment === "top") targetVal = Math.min(...selected.map((s) => s.y));
      if (alignment === "bottom") targetVal = Math.max(...selected.map((s) => s.y + s.height));
      if (alignment === "middle") {
        const minY = Math.min(...selected.map((s) => s.y));
        const maxY = Math.max(...selected.map((s) => s.y + s.height));
        targetVal = (minY + maxY) / 2;
      }

      const updated = activeDiagram.shapes.map((s) => {
        if (!selectedShapeIds.includes(s.id)) return s;
        if (alignment === "left") return { ...s, x: targetVal };
        if (alignment === "right") return { ...s, x: targetVal - s.width };
        if (alignment === "center") return { ...s, x: targetVal - s.width / 2 };
        if (alignment === "top") return { ...s, y: targetVal };
        if (alignment === "bottom") return { ...s, y: targetVal - s.height };
        if (alignment === "middle") return { ...s, y: targetVal - s.height / 2 };
        return s;
      });

      handleUpdateShapes(updated, false);
    },
    [selectedShapeIds, activeDiagram, handleUpdateShapes, pushHistory, activeTabId]
  );

  // Distribute
  const handleDistribute = useCallback(
    (direction: "horizontal" | "vertical") => {
      const selected = activeDiagram.shapes.filter((s) => selectedShapeIds.includes(s.id));
      if (selected.length < 3) return;

      pushHistory(activeTabId, activeDiagram.shapes, activeDiagram.connectors);

      if (direction === "horizontal") {
        const sorted = [...selected].sort((a, b) => a.x - b.x);
        const minX = sorted[0].x;
        const maxX = sorted[sorted.length - 1].x;
        const totalGap = maxX - minX;
        const step = totalGap / (sorted.length - 1);

        const posMap: Record<string, number> = {};
        sorted.forEach((item, idx) => {
          posMap[item.id] = minX + idx * step;
        });

        const updated = activeDiagram.shapes.map((s) =>
          posMap[s.id] !== undefined ? { ...s, x: posMap[s.id] } : s
        );
        handleUpdateShapes(updated, false);
      } else {
        const sorted = [...selected].sort((a, b) => a.y - b.y);
        const minY = sorted[0].y;
        const maxY = sorted[sorted.length - 1].y;
        const totalGap = maxY - minY;
        const step = totalGap / (sorted.length - 1);

        const posMap: Record<string, number> = {};
        sorted.forEach((item, idx) => {
          posMap[item.id] = minY + idx * step;
        });

        const updated = activeDiagram.shapes.map((s) =>
          posMap[s.id] !== undefined ? { ...s, y: posMap[s.id] } : s
        );
        handleUpdateShapes(updated, false);
      }
    },
    [selectedShapeIds, activeDiagram, handleUpdateShapes, pushHistory, activeTabId]
  );

  // Fit To Screen
  const handleFitToScreen = useCallback(() => {
    if (activeDiagram.shapes.length === 0) {
      handleUpdateViewport({ panX: 100, panY: 100, zoom: 1 });
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const s of activeDiagram.shapes) {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    }

    const bboxWidth = maxX - minX;
    const bboxHeight = maxY - minY;

    const availableW = 760;
    const availableH = 540;

    const scaleW = availableW / (bboxWidth + 120);
    const scaleH = availableH / (bboxHeight + 120);
    const targetZoom = Math.min(1.2, Math.max(0.4, Math.min(scaleW, scaleH)));

    const targetPanX = 400 - (minX + bboxWidth / 2) * targetZoom;
    const targetPanY = 300 - (minY + bboxHeight / 2) * targetZoom;

    handleUpdateViewport({ panX: targetPanX, panY: targetPanY, zoom: targetZoom });
  }, [activeDiagram, handleUpdateViewport]);

  // Open file in Tab
  const handleOpenFile = useCallback(
    (fileId: string) => {
      const findFile = (items: Array<FolderItem | FileItem>): FileItem | null => {
        for (const it of items) {
          if (it.id === fileId && it.kind === "file") return it;
          if (it.kind === "folder") {
            const res = findFile(it.children);
            if (res) return res;
          }
        }
        return null;
      };

      const fileItem = findFile(projectTree.items);
      if (!fileItem) return;

      if (!openTabs.some((t) => t.id === fileId)) {
        setOpenTabs((prev) => [
          ...prev,
          { id: fileId, name: fileItem.name, diagramType: fileItem.diagramType },
        ]);
      }
      setActiveTabId(fileId);
      setSelectedShapeIds([]);
      setSelectedConnectorId(null);
    },
    [projectTree, openTabs]
  );

  // Close Tab
  const handleCloseTab = useCallback(
    (fileId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newTabs = openTabs.filter((t) => t.id !== fileId);
      setOpenTabs(newTabs);

      if (activeTabId === fileId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
    },
    [openTabs, activeTabId]
  );

  // Create Diagram File in Folder
  const handleCreateDiagramInFolder = useCallback(
    async (folderId: string, name: string, type: DiagramType) => {
      try {
        let newFileId = `diag_${Date.now()}`;

        if (isSupabaseConfigured && projectId) {
          const createdNode = await apiCreateNode(
            projectId,
            folderId,
            "diagram",
            name,
            type
          );
          newFileId = createdNode.id;
        }

        const newFileItem: FileItem = {
          id: newFileId,
          name,
          kind: "file",
          diagramType: type,
        };

        const addToFileTree = (items: Array<FolderItem | FileItem>): Array<FolderItem | FileItem> => {
          return items.map((it) => {
            if (it.kind === "folder") {
              if (it.id === folderId) {
                return { ...it, isOpen: true, children: [...it.children, newFileItem] };
              }
              return { ...it, children: addToFileTree(it.children) };
            }
            return it;
          });
        };

        setProjectTree((prev) => ({
          ...prev,
          items: addToFileTree(prev.items),
        }));

        setDiagrams((prev) => ({
          ...prev,
          [newFileId]: {
            id: newFileId,
            name,
            type,
            shapes: [],
            connectors: [],
            viewport: { panX: 80, panY: 80, zoom: 1 },
            settings: {
              showGrid: true,
              snapToGrid: true,
              gridSize: 20,
              backgroundColor: "#F8FAFC",
            },
          },
        }));

        setOpenTabs((prev) => [...prev, { id: newFileId, name, diagramType: type }]);
        setActiveTabId(newFileId);
        setSelectedShapeIds([]);
        setSelectedConnectorId(null);
        toast.success(`Created diagram "${name}"`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create diagram";
        toast.error("Creation Error", msg);
      }
    },
    [projectId, toast]
  );

  // Create Folder
  const handleCreateFolder = useCallback(
    async (parentFolderId?: string) => {
      try {
        let newFolderId = `folder_${Date.now()}`;

        if (isSupabaseConfigured && projectId) {
          const createdFolderNode = await apiCreateNode(
            projectId,
            parentFolderId || null,
            "folder",
            "New Folder"
          );
          newFolderId = createdFolderNode.id;
        }

        const newFolder: FolderItem = {
          id: newFolderId,
          name: "New Folder",
          kind: "folder",
          isOpen: true,
          children: [],
        };

        if (!parentFolderId) {
          setProjectTree((prev) => ({
            ...prev,
            items: [...prev.items, newFolder],
          }));
        } else {
          const addToParent = (
            items: Array<FolderItem | FileItem>
          ): Array<FolderItem | FileItem> => {
            return items.map((it) => {
              if (it.kind === "folder") {
                if (it.id === parentFolderId) {
                  return { ...it, isOpen: true, children: [...it.children, newFolder] };
                }
                return { ...it, children: addToParent(it.children) };
              }
              return it;
            });
          };
          setProjectTree((prev) => ({ ...prev, items: addToParent(prev.items) }));
        }
        toast.success("Folder created");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create folder";
        toast.error("Creation Error", msg);
      }
    },
    [projectId, toast]
  );

  // Delete file or folder
  const handleDeleteFileOrFolder = useCallback(
    async (itemId: string) => {
      try {
        if (isSupabaseConfigured && projectId) {
          await apiDeleteNode(itemId);
        }

        const removeFromTree = (
          items: Array<FolderItem | FileItem>
        ): Array<FolderItem | FileItem> => {
          const result: Array<FolderItem | FileItem> = [];
          for (const it of items) {
            if (it.id === itemId) continue;
            if (it.kind === "folder") {
              result.push({ ...it, children: removeFromTree(it.children) });
            } else {
              result.push(it);
            }
          }
          return result;
        };

        setProjectTree((prev) => ({ ...prev, items: removeFromTree(prev.items) }));
        const newTabs = openTabs.filter((t) => t.id !== itemId);
        setOpenTabs(newTabs);
        if (activeTabId === itemId && newTabs.length > 0) {
          setActiveTabId(newTabs[0].id);
        }
        toast.success("Item deleted successfully");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to delete item";
        toast.error("Deletion Error", msg);
      }
    },
    [openTabs, activeTabId, projectId, toast]
  );

  // Duplicate file
  const handleDuplicateFile = useCallback(
    async (fileId: string) => {
      try {
        const srcDiagram = diagrams[fileId];
        let newId = `diag_${Date.now()}`;
        const newName = srcDiagram ? `${srcDiagram.name} Copy` : "Duplicated Diagram";

        if (isSupabaseConfigured && projectId) {
          const dupNode = await apiDuplicateNode(fileId);
          newId = dupNode.id;
        }

        const duplicateInTree = (
          items: Array<FolderItem | FileItem>
        ): Array<FolderItem | FileItem> => {
          const result: Array<FolderItem | FileItem> = [];
          for (const it of items) {
            result.push(it);
            if (it.id === fileId && it.kind === "file") {
              result.push({
                id: newId,
                name: newName,
                kind: "file",
                diagramType: it.diagramType,
              });
            } else if (it.kind === "folder") {
              it.children = duplicateInTree(it.children);
            }
          }
          return result;
        };

        setProjectTree((prev) => ({ ...prev, items: duplicateInTree(prev.items) }));

        if (srcDiagram) {
          setDiagrams((prev) => ({
            ...prev,
            [newId]: {
              ...JSON.parse(JSON.stringify(srcDiagram)),
              id: newId,
              name: newName,
            },
          }));
        }

        setOpenTabs((prev) => [
          ...prev,
          { id: newId, name: newName, diagramType: srcDiagram?.type || "flowchart" },
        ]);
        setActiveTabId(newId);
        toast.success(`Duplicated diagram`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to duplicate diagram";
        toast.error("Duplicate Error", msg);
      }
    },
    [diagrams, projectId, toast]
  );

  // Update tree on inline rename or drag & drop move
  const handleUpdateTree = useCallback(
    async (newTree: ProjectTree) => {
      setProjectTree(newTree);
      if (isSupabaseConfigured && projectId) {
        try {
          const findAndSync = async (items: Array<FolderItem | FileItem>, parentId: string | null = null) => {
            for (const item of items) {
              await apiRenameNode(item.id, item.name).catch(() => {});
              await apiMoveNode(item.id, parentId).catch(() => {});
              if (item.kind === "folder") {
                await findAndSync(item.children, item.id);
              }
            }
          };
          await findAndSync(newTree.items);
        } catch {
          // Optimistic update
        }
      }
    },
    [projectId]
  );

  // Rename Project
  const handleUpdateProjectName = useCallback(
    async (name: string) => {
      setProjectTree((prev) => ({ ...prev, name }));
      if (isSupabaseConfigured && projectId) {
        try {
          await apiUpdateProjectName(projectId, name);
          toast.success("Project renamed");
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to rename project";
          toast.error("Rename Error", msg);
        }
      }
    },
    [projectId, toast]
  );

  const selectedShapesList = useMemo(() => {
    return activeDiagram.shapes.filter((s) => selectedShapeIds.includes(s.id));
  }, [activeDiagram, selectedShapeIds]);

  const selectedConnectorObj = useMemo(() => {
    return activeDiagram.connectors.find((c) => c.id === selectedConnectorId) || null;
  }, [activeDiagram, selectedConnectorId]);

  if (projectLoading) {
    return (
      <div className="h-screen w-screen grid place-content-center bg-slate-100 text-slate-700">
        <div className="flex items-center gap-2.5 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading project workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans text-sm select-none">
      {/* 1. Top Bar (48px) */}
      <EditorTopBar
        projectName={projectTree.name}
        onUpdateProjectName={handleUpdateProjectName}
        folderName={currentFolderName}
        activeDiagram={activeDiagram}
        canUndo={(history[activeTabId]?.past.length || 0) > 0}
        canRedo={(history[activeTabId]?.future.length || 0) > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={activeDiagram.viewport.zoom}
        onZoomChange={(zoom) =>
          handleUpdateViewport({ ...activeDiagram.viewport, zoom })
        }
        onFitToScreen={handleFitToScreen}
        saveStatus={saveStatus}
      />

      {/* 2. Workspace Body: Explorer | Shape Library | Canvas | Format Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Explorer Sidebar (260px) */}
        <ExplorerSidebar
          projectTree={projectTree}
          activeFileId={activeTabId}
          onOpenFile={handleOpenFile}
          onUpdateTree={handleUpdateTree}
          onDeleteFile={handleDeleteFileOrFolder}
          onDuplicateFile={handleDuplicateFile}
          onCreateDiagramInFolder={handleCreateDiagramInFolder}
          onCreateFolder={handleCreateFolder}
          isCollapsed={isExplorerCollapsed}
          onToggleCollapse={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
        />

        {/* Left of Canvas: Shape Library Panel (240px) */}
        <ShapeLibrary
          activeDiagramType={activeDiagram.type}
          onAddShapeAtCenter={handleAddShapeAtCenter}
          onSelectConnectorPreset={setActiveConnectorPreset}
          activeConnectorPreset={activeConnectorPreset}
          isCollapsed={isLibraryCollapsed}
          onToggleCollapse={() => setIsLibraryCollapsed(!isLibraryCollapsed)}
        />

        {/* Center: File Tabs on top + Canvas below */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <FileTabs
            openTabs={openTabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onCloseTab={handleCloseTab}
          />

          <div className="flex-1 relative overflow-hidden">
            {contentLoading ? (
              <div className="absolute inset-0 z-30 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Loading diagram content...</span>
                </div>
              </div>
            ) : null}

            <Canvas
              shapes={activeDiagram.shapes}
              connectors={activeDiagram.connectors}
              settings={activeDiagram.settings}
              viewport={activeDiagram.viewport}
              onUpdateViewport={handleUpdateViewport}
              selectedShapeIds={selectedShapeIds}
              selectedConnectorId={selectedConnectorId}
              onSelectShapes={(ids) => {
                setSelectedShapeIds(ids);
                if (ids.length > 0) setSelectedConnectorId(null);
              }}
              onSelectConnector={(id) => {
                setSelectedConnectorId(id);
                if (id) setSelectedShapeIds([]);
              }}
              onUpdateShapes={handleUpdateShapes}
              onUpdateConnector={handleUpdateConnector}
              onAddConnector={handleAddConnector}
              onAddShapeFromDrop={handleAddShapeFromDrop}
              activeConnectorPreset={activeConnectorPreset}
              onDeleteSelected={handleDeleteSelected}
              onDuplicateSelected={handleDuplicateSelected}
              onCopySelected={handleCopySelected}
              onPaste={handlePaste}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
          </div>
        </div>

        {/* Right: Format Panel (260px) */}
        <FormatPanel
          selectedShapes={selectedShapesList}
          selectedConnector={selectedConnectorObj}
          diagramSettings={activeDiagram.settings}
          onUpdateShapes={handleUpdateShapes}
          onUpdateConnector={handleUpdateConnector}
          onUpdateDiagramSettings={handleUpdateSettings}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onGroupSelected={handleGroupSelected}
          onUngroupSelected={handleUngroupSelected}
          onAlign={handleAlign}
          onDistribute={handleDistribute}
          isCollapsed={isFormatCollapsed}
          onToggleCollapse={() => setIsFormatCollapsed(!isFormatCollapsed)}
        />
      </div>
    </div>
  );
}

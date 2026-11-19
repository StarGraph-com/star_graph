import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NodeDiagramType, NodeType, NodeRow, ProjectRow, DiagramContentRow } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!isSupabaseConfigured) {
      console.warn(
        "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set. Database persistence will be disabled until configured."
      );
    }
    client = createClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseAnonKey || "placeholder-key",
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );
  }
  return client;
}

export const supabase = getSupabase();

// ============================================================================
// PROJECTS API
// ============================================================================

export async function apiFetchProjects(): Promise<ProjectRow[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function apiCreateProject(
  name: string,
  starterTemplate: "blank" | "sample" = "blank"
): Promise<{ project: ProjectRow; rootNodes: NodeRow[] }> {
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) throw new Error("You must be signed in to create a project.");

  // 1. Create project
  const { data: project, error: pError } = await sb
    .from("projects")
    .insert({ name, owner_id: user.id })
    .select()
    .single();

  if (pError) throw pError;

  const createdNodes: NodeRow[] = [];

  if (starterTemplate === "sample") {
    // 2. Create sample starter folders and diagrams
    const { data: authFolder, error: fError1 } = await sb
      .from("nodes")
      .insert({
        project_id: project.id,
        parent_id: null,
        type: "folder",
        name: "Authentication",
        sort_order: 1,
      })
      .select()
      .single();
    if (fError1) throw fError1;
    createdNodes.push(authFolder);

    const { data: loginDiagram, error: dError1 } = await sb
      .from("nodes")
      .insert({
        project_id: project.id,
        parent_id: authFolder.id,
        type: "diagram",
        diagram_type: "flowchart",
        name: "Login Flow",
        sort_order: 1,
      })
      .select()
      .single();
    if (dError1) throw dError1;
    createdNodes.push(loginDiagram);

    // Initial Diagram Content
    await sb.from("diagram_content").insert({
      node_id: loginDiagram.id,
      content: {
        shapes: [
          {
            id: "s1",
            type: "flowchart_start_end",
            x: 80,
            y: 120,
            width: 120,
            height: 50,
            rotation: 0,
            label: "Start",
            style: { fill: "#EEF2FF", stroke: "#6366F1", strokeWidth: 1.5, opacity: 1, cornerRadius: 25, shadow: true },
            textStyle: { fontSize: 13, fontFamily: "Inter, sans-serif", color: "#4338CA", bold: true, align: "center" },
            zIndex: 1,
          },
          {
            id: "s2",
            type: "flowchart_process",
            x: 260,
            y: 120,
            width: 150,
            height: 50,
            rotation: 0,
            label: "Verify Credentials",
            style: { fill: "#FFFFFF", stroke: "#64748B", strokeWidth: 1.5, opacity: 1, cornerRadius: 6, shadow: true },
            textStyle: { fontSize: 13, fontFamily: "Inter, sans-serif", color: "#1E293B", bold: false, align: "center" },
            zIndex: 2,
          },
        ],
        connectors: [
          {
            id: "c1",
            from: { shapeId: "s1", point: "right" },
            to: { shapeId: "s2", point: "left" },
            style: "orthogonal",
            startArrow: "none",
            endArrow: "arrow",
            dashed: false,
            stroke: "#64748B",
            strokeWidth: 1.5,
          },
        ],
        viewport: { panX: 60, panY: 60, zoom: 1 },
        settings: { showGrid: true, snapToGrid: true, gridSize: 20, backgroundColor: "#F8FAFC" },
      },
    });

    const { data: backendFolder, error: fError2 } = await sb
      .from("nodes")
      .insert({
        project_id: project.id,
        parent_id: null,
        type: "folder",
        name: "Backend",
        sort_order: 2,
      })
      .select()
      .single();
    if (fError2) throw fError2;
    createdNodes.push(backendFolder);

    const { data: domainDiagram, error: dError2 } = await sb
      .from("nodes")
      .insert({
        project_id: project.id,
        parent_id: backendFolder.id,
        type: "diagram",
        diagram_type: "uml_class",
        name: "Domain Model",
        sort_order: 1,
      })
      .select()
      .single();
    if (dError2) throw dError2;
    createdNodes.push(domainDiagram);

    await sb.from("diagram_content").insert({
      node_id: domainDiagram.id,
      content: {
        shapes: [
          {
            id: "u1",
            type: "uml_class",
            x: 100,
            y: 80,
            width: 220,
            height: 160,
            rotation: 0,
            label: "User",
            attributes: ["- id: UUID", "- email: String"],
            methods: ["+ authenticate(): Boolean"],
            style: { fill: "#FFFFFF", stroke: "#6366F1", strokeWidth: 1.5, opacity: 1, cornerRadius: 6, shadow: true },
            textStyle: { fontSize: 13, fontFamily: "Inter, sans-serif", color: "#1E293B", bold: false, align: "center" },
            zIndex: 1,
          },
        ],
        connectors: [],
        viewport: { panX: 60, panY: 60, zoom: 1 },
        settings: { showGrid: true, snapToGrid: true, gridSize: 20, backgroundColor: "#F8FAFC" },
      },
    });
  } else {
    // Blank project: create one starter diagram
    const { data: starterDiagram, error: dError } = await sb
      .from("nodes")
      .insert({
        project_id: project.id,
        parent_id: null,
        type: "diagram",
        diagram_type: "flowchart",
        name: "Main Diagram",
        sort_order: 1,
      })
      .select()
      .single();
    if (dError) throw dError;
    createdNodes.push(starterDiagram);

    await sb.from("diagram_content").insert({
      node_id: starterDiagram.id,
      content: {
        shapes: [],
        connectors: [],
        viewport: { panX: 60, panY: 60, zoom: 1 },
        settings: { showGrid: true, snapToGrid: true, gridSize: 20, backgroundColor: "#F8FAFC" },
      },
    });
  }

  return { project, rootNodes: createdNodes };
}

export async function apiDeleteProject(projectId: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

export async function apiUpdateProjectName(projectId: string, name: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("projects")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", projectId);
  if (error) throw error;
}

// ============================================================================
// NODES (FILE TREE) API
// ============================================================================

export async function apiFetchNodes(projectId: string): Promise<NodeRow[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("nodes")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function apiCreateNode(
  projectId: string,
  parentId: string | null,
  type: NodeType,
  name: string,
  diagramType: NodeDiagramType | null = null
): Promise<NodeRow> {
  const sb = getSupabase();
  const { data: node, error } = await sb
    .from("nodes")
    .insert({
      project_id: projectId,
      parent_id: parentId,
      type,
      name,
      diagram_type: diagramType,
    })
    .select()
    .single();

  if (error) throw error;

  // If it's a diagram, initialize blank diagram_content
  if (type === "diagram") {
    await sb.from("diagram_content").insert({
      node_id: node.id,
      content: {
        shapes: [],
        connectors: [],
        viewport: { panX: 60, panY: 60, zoom: 1 },
        settings: { showGrid: true, snapToGrid: true, gridSize: 20, backgroundColor: "#F8FAFC" },
      },
    });
  }

  return node;
}

export async function apiRenameNode(nodeId: string, name: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("nodes")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", nodeId);
  if (error) throw error;
}

export async function apiMoveNode(nodeId: string, targetParentId: string | null): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("nodes")
    .update({ parent_id: targetParentId, updated_at: new Date().toISOString() })
    .eq("id", nodeId);
  if (error) throw error;
}

export async function apiDuplicateNode(nodeId: string): Promise<NodeRow> {
  const sb = getSupabase();
  // 1. Fetch original node
  const { data: origNode, error: nError } = await sb
    .from("nodes")
    .select("*")
    .eq("id", nodeId)
    .single();
  if (nError) throw nError;

  // 2. Insert copy
  const { data: newNode, error: insError } = await sb
    .from("nodes")
    .insert({
      project_id: origNode.project_id,
      parent_id: origNode.parent_id,
      type: origNode.type,
      diagram_type: origNode.diagram_type,
      name: `${origNode.name} Copy`,
    })
    .select()
    .single();
  if (insError) throw insError;

  // 3. If diagram, copy content
  if (origNode.type === "diagram") {
    const { data: origContent } = await sb
      .from("diagram_content")
      .select("*")
      .eq("node_id", nodeId)
      .single();

    if (origContent) {
      await sb.from("diagram_content").insert({
        node_id: newNode.id,
        content: origContent.content,
      });
    }
  }

  return newNode;
}

export async function apiDeleteNode(nodeId: string): Promise<void> {
  const sb = getSupabase();
  // Postgres cascade delete handles child nodes and diagram_content
  const { error } = await sb.from("nodes").delete().eq("id", nodeId);
  if (error) throw error;
}

// ============================================================================
// DIAGRAM CONTENT API
// ============================================================================

export async function apiFetchDiagramContent(nodeId: string): Promise<DiagramContentRow["content"] | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("diagram_content")
    .select("*")
    .eq("node_id", nodeId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Row not found, create empty one
      const emptyContent = {
        shapes: [],
        connectors: [],
        viewport: { panX: 60, panY: 60, zoom: 1 },
        settings: { showGrid: true, snapToGrid: true, gridSize: 20, backgroundColor: "#F8FAFC" },
      };
      await sb.from("diagram_content").insert({
        node_id: nodeId,
        content: emptyContent,
      });
      return emptyContent;
    }
    throw error;
  }

  return data.content;
}

export async function apiSaveDiagramContent(
  nodeId: string,
  content: unknown
): Promise<void> {
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const { error } = await sb
    .from("diagram_content")
    .upsert(
      {
        node_id: nodeId,
        content,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "node_id" }
    );

  if (error) throw error;
}

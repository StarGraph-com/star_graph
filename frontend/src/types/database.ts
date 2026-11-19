export type Role = "owner" | "editor" | "commenter" | "viewer";
export type NodeType = "folder" | "diagram";
export type NodeDiagramType =
  | "flowchart"
  | "uml_class"
  | "uml_usecase"
  | "uml_sequence"
  | "erd"
  | "architecture"
  | "general"
  | "blank";

export interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectRow {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  member_role?: Role;
}

export interface ProjectMemberRow {
  id: string;
  project_id: string;
  user_id: string;
  role: Role;
  created_at: string;
  profile?: ProfileRow;
}

export interface NodeRow {
  id: string;
  project_id: string;
  parent_id: string | null;
  type: NodeType;
  diagram_type: NodeDiagramType | null;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DiagramContentRow {
  node_id: string;
  content: {
    shapes: unknown[];
    connectors: unknown[];
    viewport?: { panX: number; panY: number; zoom: number };
    settings?: { showGrid: boolean; snapToGrid: boolean; gridSize: number; backgroundColor: string };
  };
  version: number;
  updated_by: string | null;
  updated_at: string;
}

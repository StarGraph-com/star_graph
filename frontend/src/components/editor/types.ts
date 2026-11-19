export type DiagramType =
  | "flowchart"
  | "uml_class"
  | "uml_usecase"
  | "uml_sequence"
  | "erd"
  | "architecture"
  | "general";

export type LineStyle = "straight" | "orthogonal" | "curved";

export type ArrowType =
  | "none"
  | "arrow"
  | "open_arrow"
  | "hollow_triangle"
  | "filled_diamond"
  | "hollow_diamond"
  | "crows_foot_one"
  | "crows_foot_many";

export type AnchorPoint = "top" | "right" | "bottom" | "left" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface ShapeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDash: boolean;
  opacity: number;
  cornerRadius: number;
  shadow: boolean;
}

export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
}

export interface ShapeAttribute {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
}

export interface DiagramShape {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
  style: ShapeStyle;
  textStyle: TextStyle;
  zIndex: number;
  locked?: boolean;
  groupId?: string;

  // UML Class & Enum
  attributes?: string[];
  methods?: string[];
  stereotype?: string;

  // ERD
  erdAttributes?: ShapeAttribute[];

  // UML Sequence
  lifelineLength?: number;
  fragmentType?: "alt" | "loop" | "opt" | "par";
}

export interface ConnectorEndpoint {
  shapeId: string;
  point: AnchorPoint;
}

export interface DiagramConnector {
  id: string;
  from: ConnectorEndpoint;
  to: ConnectorEndpoint;
  style: LineStyle;
  startArrow: ArrowType;
  endArrow: ArrowType;
  dashed: boolean;
  stroke: string;
  strokeWidth: number;
  label?: string;
  startLabel?: string; // Multiplicity like "1"
  endLabel?: string;   // Multiplicity like "0..*"
}

export interface DiagramSettings {
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  backgroundColor: string;
}

export interface DiagramData {
  id: string;
  name: string;
  type: DiagramType;
  shapes: DiagramShape[];
  connectors: DiagramConnector[];
  viewport: {
    panX: number;
    panY: number;
    zoom: number;
  };
  settings: DiagramSettings;
}

export interface FileItem {
  id: string;
  name: string;
  kind: "file";
  diagramType: DiagramType;
}

export interface FolderItem {
  id: string;
  name: string;
  kind: "folder";
  isOpen: boolean;
  children: Array<FolderItem | FileItem>;
}

export interface ProjectTree {
  id: string;
  name: string;
  items: Array<FolderItem | FileItem>;
}

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

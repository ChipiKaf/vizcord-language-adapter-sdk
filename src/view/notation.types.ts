import type {
  CanonicalNodeKind,
  CanonicalEdgeKind,
} from "../canonical/index.js";

/** Shape vocabulary — maps to vizcraft shape builder methods. */
export type NodeShape =
  | "rect"
  | "roundedRect"
  | "circle"
  | "diamond"
  | "hexagon"
  | "pill"
  | "parallelogram"
  | "trapezoid"
  | "cylinder";

/** Arrow/line vocabulary. */
export type LineStyle = "solid" | "dashed" | "dotted";
export type ArrowHead = "triangle" | "diamond" | "circle" | "none" | "vee";

/** Color role — resolved against the active theme. */
export type ColorRole =
  | "class"
  | "interface"
  | "function"
  | "module"
  | "package"
  | "field"
  | "variable"
  | "enum"
  | "typeAlias"
  | "cfgBlock"
  | "expression"
  | "neutral";

/** Per-node-kind visual specification. */
export interface NodeNotation {
  readonly shape: NodeShape;
  readonly icon: string;
  readonly colorRole: ColorRole;
  readonly stereotype?: string;
  readonly compartments?: boolean;
  readonly defaultLabel: "name" | "qualifiedName";
}

/** Per-edge-kind visual specification. */
export interface EdgeNotation {
  readonly lineStyle: LineStyle;
  readonly arrowHead: ArrowHead;
  readonly colorRole: ColorRole;
  readonly label?: string;
  readonly bidirectional?: boolean;
}

/** The complete notation standard — exhaustive over all canonical kinds. */
export interface NotationStandard {
  readonly nodes: Readonly<Record<CanonicalNodeKind, NodeNotation>>;
  readonly edges: Readonly<Record<CanonicalEdgeKind, EdgeNotation>>;
}

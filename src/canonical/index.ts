import type {
  StructuralNode,
  StructuralEdge,
  StructuralNodeKind,
  StructuralEdgeKind,
} from "./structural.types.js";

import type {
  BehaviouralNode,
  BehaviouralEdge,
  BehaviouralNodeKind,
  BehaviouralEdgeKind,
} from "./behavioural.types.js";

export type CanonicalNode = StructuralNode | BehaviouralNode;
export type CanonicalNodeKind = StructuralNodeKind | BehaviouralNodeKind;

export type CanonicalEdgeType = StructuralEdge | BehaviouralEdge;
export type CanonicalEdgeKind = StructuralEdgeKind | BehaviouralEdgeKind;

/** Runtime list of all canonical node kinds. */
export const CANONICAL_NODE_KINDS: readonly CanonicalNodeKind[] = [
  "package",
  "module",
  "class",
  "interface",
  "function",
  "field",
  "variable",
  "enum",
  "typeAlias",
  "cfgBlock",
  "expression",
] as const;

/** Runtime list of all canonical edge kinds. */
export const CANONICAL_EDGE_KINDS: readonly CanonicalEdgeKind[] = [
  "containment",
  "inheritance",
  "implements",
  "import",
  "invocation",
  "access",
  "dependency",
  "controlFlow",
  "dataFlow",
] as const;

/** The full canonical graph produced by a language adapter. */
export interface CanonicalGraph {
  readonly nodes: readonly CanonicalNode[];
  readonly edges: readonly CanonicalEdgeType[];
}

/** A delta describing incremental changes to the canonical graph. */
export interface CanonicalDelta {
  readonly addedNodes: readonly CanonicalNode[];
  readonly removedNodeIds: readonly string[];
  readonly updatedNodes: readonly CanonicalNode[];
  readonly addedEdges: readonly CanonicalEdgeType[];
  readonly removedEdgeIds: readonly string[];
}

export * from "./brand.js";
export * from "./structural.types.js";
export * from "./behavioural.types.js";

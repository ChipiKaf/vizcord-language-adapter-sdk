// ---------------------------------------------------------------------------
// Canonical Graph – the full model combining structural + behavioural
// ---------------------------------------------------------------------------

import type {
  StructuralNode,
  StructuralEdge,
  StructuralNodeKind,
  StructuralEdgeKind,
} from "./structural.js";

import type {
  BehaviouralNode,
  BehaviouralEdge,
  BehaviouralNodeKind,
  BehaviouralEdgeKind,
} from "./behavioural.js";

export type CanonicalNode = StructuralNode | BehaviouralNode;
export type CanonicalNodeKind = StructuralNodeKind | BehaviouralNodeKind;

export type CanonicalEdgeType = StructuralEdge | BehaviouralEdge;
export type CanonicalEdgeKind = StructuralEdgeKind | BehaviouralEdgeKind;

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
export * from "./structural.js";
export * from "./behavioural.js";

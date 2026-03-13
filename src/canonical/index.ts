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
  nodes: CanonicalNode[];
  edges: CanonicalEdgeType[];
}

/** A delta describing incremental changes to the canonical graph. */
export interface CanonicalDelta {
  addedNodes: CanonicalNode[];
  removedNodeIds: string[];
  updatedNodes: CanonicalNode[];
  addedEdges: CanonicalEdgeType[];
  removedEdgeIds: string[];
}

export * from "./structural.js";
export * from "./behavioural.js";

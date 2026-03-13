// ---------------------------------------------------------------------------
// Canonical IR – Behavioural Sub-model (CPG inspired)
// ---------------------------------------------------------------------------

import type {
  SourceRange,
  CanonicalNodeBase,
  CanonicalEdge,
} from "./structural.js";

// ---- Behavioural node types -----------------------------------------------

export interface CfgBlockNode extends CanonicalNodeBase {
  kind: "cfgBlock";
  /** ID of the owning function */
  functionId: string;
  /** Is this the entry or exit block? */
  blockType?: "entry" | "exit" | "normal" | "branch" | "loop";
}

export interface ExpressionNode extends CanonicalNodeBase {
  kind: "expression";
  /** ID of the owning CFG block */
  blockId: string;
  expressionType?: string;
  /** Source text snippet for display */
  snippet?: string;
}

export type BehaviouralNode = CfgBlockNode | ExpressionNode;

export type BehaviouralNodeKind = BehaviouralNode["kind"];

// ---- Behavioural edge types -----------------------------------------------

export interface ControlFlowEdge extends CanonicalEdge {
  kind: "controlFlow";
  /** Label for conditional branches */
  label?: string;
}

export interface DataFlowEdge extends CanonicalEdge {
  kind: "dataFlow";
  /** Name of the variable flowing between nodes */
  variable?: string;
}

export type BehaviouralEdge = ControlFlowEdge | DataFlowEdge;

export type BehaviouralEdgeKind = BehaviouralEdge["kind"];

// Re-export SourceRange for convenience
export type { SourceRange, CanonicalNodeBase, CanonicalEdge };

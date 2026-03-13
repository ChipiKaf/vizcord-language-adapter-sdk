// ---------------------------------------------------------------------------
// Canonical IR – Behavioural Sub-model (CPG inspired)
// ---------------------------------------------------------------------------

import type { CanonicalId } from "./brand.js";
import type {
  SourceRange,
  CanonicalNodeBase,
  CanonicalEdge,
} from "./structural.js";

// ---- Behavioural node types -----------------------------------------------

export interface CfgBlockNode extends CanonicalNodeBase {
  readonly kind: "cfgBlock";
  /** ID of the owning function */
  readonly functionId: CanonicalId;
  /** Is this the entry or exit block? */
  readonly blockType?: "entry" | "exit" | "normal" | "branch" | "loop";
}

export interface ExpressionNode extends CanonicalNodeBase {
  readonly kind: "expression";
  /** ID of the owning CFG block */
  readonly blockId: CanonicalId;
  readonly expressionType?: string;
  /** Source text snippet for display */
  readonly snippet?: string;
}

export type BehaviouralNode = CfgBlockNode | ExpressionNode;

export type BehaviouralNodeKind = BehaviouralNode["kind"];

// ---- Behavioural edge types -----------------------------------------------

export interface ControlFlowEdge extends CanonicalEdge {
  readonly kind: "controlFlow";
  /** Label for conditional branches */
  readonly label?: string;
}

export interface DataFlowEdge extends CanonicalEdge {
  readonly kind: "dataFlow";
  /** Name of the variable flowing between nodes */
  readonly variable?: string;
}

export type BehaviouralEdge = ControlFlowEdge | DataFlowEdge;

export type BehaviouralEdgeKind = BehaviouralEdge["kind"];

// Re-export SourceRange for convenience
export type { SourceRange, CanonicalNodeBase, CanonicalEdge };

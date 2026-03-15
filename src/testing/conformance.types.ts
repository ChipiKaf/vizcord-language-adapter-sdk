import type {
  NodeCompleteness,
  Visibility,
} from "../canonical/structural.types.js";

/** Expected node shape for structural matching (language-agnostic). */
export interface ExpectedNode {
  readonly kind: string;
  readonly name: string;
  readonly visibility?: Visibility;
  readonly completeness?: NodeCompleteness;
}

/** Expected edge shape for structural matching (matches by kind + endpoint names). */
export interface ExpectedEdge {
  readonly kind: string;
  readonly sourceName: string;
  readonly targetName: string;
}

/** Language-agnostic expected graph shape for fixture-based conformance. */
export interface ExpectedGraph {
  readonly nodes: readonly ExpectedNode[];
  readonly edges: readonly ExpectedEdge[];
}

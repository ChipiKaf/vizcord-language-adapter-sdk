import type { CanonicalId } from "../canonical/brand.js";
import type { CanonicalNodeKind } from "../canonical/index.js";
import type { TraceLinkKind } from "./trace-links.types.js";

/**
 * A trace rule declares that a given canonical node kind MUST
 * (or SHOULD) produce a trace link of a given layer.
 *
 * Rules are contract lens predicates — invariants that the forward
 * lens (get) and backward lens (put) must satisfy.
 */
export interface TraceRule {
  /** Unique rule identifier, e.g. "source:class", "view:structural:method" */
  readonly id: string;
  /** Which canonical node kind this rule applies to */
  readonly canonicalKind: CanonicalNodeKind;
  /** Which layer the link connects to */
  readonly layer: TraceLinkKind;
  /** If true, a missing link is severity "error"; if false, "warning" */
  readonly required: boolean;
  /** Human-readable explanation of why this link must exist */
  readonly description: string;
  /** For view-layer rules, the specific view type (e.g. "structural", "dependency") */
  readonly viewType?: string;
}

/** Diagnostic produced when a trace rule is violated. */
export interface TraceDiagnostic {
  readonly severity: "error" | "warning";
  /** The rule that was violated */
  readonly ruleId: string;
  /** The canonical node that lacks the required link */
  readonly nodeId: CanonicalId;
  /** The node's kind (for filtering/reporting) */
  readonly nodeKind: CanonicalNodeKind;
  /** Human-readable diagnostic message */
  readonly message: string;
}

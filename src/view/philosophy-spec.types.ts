/**
 * Types for the Diagram Philosophy Living Specification.
 *
 * Each rule in the specification is a typed object with a unique ID,
 * a human-readable description, the enforcement mechanism, and a
 * reference to the implementing artifact. This is pure type
 * definitions — no runtime code.
 */

/** How a rule is enforced in the system. */
export type EnforcementMechanism =
  | "type-system"
  | "runtime-constraint"
  | "notation-standard"
  | "conformance-test"
  | "convention"
  | "configuration";

/** Category of philosophy rule. */
export type RuleCategory =
  | "notation"
  | "layout"
  | "readability"
  | "interaction"
  | "progressive"
  | "accessibility";

/** Implementation status of a philosophy rule. */
export type RuleStatus = "planned" | "implemented" | "verified";

/** A single rule in the diagram philosophy specification. */
export interface PhilosophyRule {
  /** Unique rule identifier, e.g., "N-01", "L-03", "R-07". */
  readonly id: string;
  /** Human-readable rule name. */
  readonly name: string;
  /** Rule category. */
  readonly category: RuleCategory;
  /** Full description of the rule. */
  readonly description: string;
  /** How this rule is enforced. */
  readonly enforcement: EnforcementMechanism;
  /** Reference to the implementing artifact (file path, type name, constraint name). */
  readonly implementedBy: string;
  /** Reference to the conformance test that verifies this rule. */
  readonly testedBy?: string;
  /** Which work item introduced this rule. */
  readonly workItem: string;
  /** Whether this rule has been implemented. */
  readonly status: RuleStatus;
}

/** Category display metadata for markdown generation. */
export interface CategoryMeta {
  readonly key: RuleCategory;
  readonly heading: string;
}

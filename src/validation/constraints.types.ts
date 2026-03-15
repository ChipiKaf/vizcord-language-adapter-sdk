import type { CanonicalId, EdgeId } from "../canonical/brand.js";
import type { CanonicalGraph } from "../canonical/index.js";

/** A named invariant that can be checked against a canonical graph. */
export interface GraphConstraint {
  readonly name: string;
  validate(graph: CanonicalGraph): readonly ConstraintViolation[];
}

/** A single violation produced when a graph constraint is not satisfied. */
export interface ConstraintViolation {
  readonly constraintName: string;
  readonly severity: "error" | "warning";
  readonly message: string;
  readonly involvedNodes?: readonly CanonicalId[];
  readonly involvedEdges?: readonly EdgeId[];
}

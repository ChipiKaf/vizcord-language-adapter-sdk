import type { CanonicalGraph } from "../canonical/index.js";
import type {
  GraphConstraint,
  ConstraintViolation,
} from "./constraints.types.js";
import {
  referentialIntegrity,
  uniqueNodeIds,
  containmentAcyclicity,
  singleContainmentParent,
} from "./constraints.js";

/**
 * Validates a canonical graph against a set of constraints.
 *
 * Ships with four built-in constraints (referential integrity,
 * unique node IDs, containment acyclicity, single containment parent).
 * Additional constraints can be registered at runtime.
 */
export class GraphValidator {
  private readonly constraints: GraphConstraint[];

  constructor() {
    this.constraints = [
      referentialIntegrity,
      uniqueNodeIds,
      containmentAcyclicity,
      singleContainmentParent,
    ];
  }

  register(constraint: GraphConstraint): void {
    this.constraints.push(constraint);
  }

  validate(graph: CanonicalGraph): readonly ConstraintViolation[] {
    return this.constraints.flatMap((c) => c.validate(graph));
  }

  /** Returns only error-severity violations. */
  errors(graph: CanonicalGraph): readonly ConstraintViolation[] {
    return this.validate(graph).filter((v) => v.severity === "error");
  }
}

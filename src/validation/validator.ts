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
  /** Built-in + user-registered graph constraints. */
  private readonly constraints: GraphConstraint[];

  /**
   * @vizcomment-overview Initialise validator with built-in constraint set
   */
  constructor() {
    /** @vizcomment-step Register built-in graph constraints */
    this.constraints = [
      referentialIntegrity,
      uniqueNodeIds,
      containmentAcyclicity,
      singleContainmentParent,
    ];
  }

  /** @vizcomment-overview Add a custom constraint to the validation pipeline */
  register(constraint: GraphConstraint): void {
    /** @vizcomment-step Append the constraint to the validation list */
    this.constraints.push(constraint);
  }

  /** @vizcomment-overview Run all constraints and collect violations */
  validate(graph: CanonicalGraph): readonly ConstraintViolation[] {
    /** @vizcomment-step Invoke each constraint against the graph */
    return this.constraints.flatMap((c) => c.validate(graph));
  }

  /** @vizcomment-overview Filter validation results to error-severity only */
  errors(graph: CanonicalGraph): readonly ConstraintViolation[] {
    /** @vizcomment-step Run validation then keep only error-level violations */
    return this.validate(graph).filter((v) => v.severity === "error");
  }
}

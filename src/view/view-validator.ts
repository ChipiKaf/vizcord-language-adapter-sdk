import type { ViewModel } from "./view-model.types.js";
import type {
  ViewConstraint,
  ViewConstraintViolation,
  LayoutResult,
} from "./view-constraints.types.js";
import {
  maxVisibleNodes,
  noNodeOverlap,
  maxEdgeCrossings,
  maxNodeDegree,
  areaCoverage,
} from "./view-constraints.js";

/** Empty layout used for pre-layout validation (constraints that only inspect the ViewModel). */
const emptyLayout: LayoutResult = {
  nodePositions: new Map(),
  edgePaths: new Map(),
  totalWidth: 0,
  totalHeight: 0,
};

/**
 * Validates a rendered view model against readability constraints.
 *
 * Ships with five built-in constraints (max visible nodes, no node
 * overlap, max edge crossings, max node degree, area coverage).
 * Additional constraints can be registered at runtime.
 */
export class ViewValidator {
  /** Built-in + user-registered view readability constraints. */
  private readonly constraints: ViewConstraint[];

  /**
   * @vizcomment-overview Initialise validator with built-in readability constraints
   */
  constructor() {
    /** @vizcomment-step Register built-in view constraints */
    this.constraints = [
      maxVisibleNodes,
      noNodeOverlap,
      maxEdgeCrossings,
      maxNodeDegree,
      areaCoverage,
    ];
  }

  /** @vizcomment-overview Add a custom view constraint */
  register(constraint: ViewConstraint): void {
    /** @vizcomment-step Append the constraint to the validation list */
    this.constraints.push(constraint);
  }

  /** @vizcomment-overview Run all view constraints against a laid-out diagram */
  validate(
    viewModel: ViewModel,
    layout: LayoutResult,
  ): readonly ViewConstraintViolation[] {
    /** @vizcomment-step Invoke each constraint with the view and layout */
    return this.constraints.flatMap((c) => c.validate(viewModel, layout));
  }

  /**
   * Run only constraints that do not require layout positions.
   * Useful for early validation before layout is computed.
   */
  /** @vizcomment-overview Validate constraints that don't need layout positions */
  validatePreLayout(viewModel: ViewModel): readonly ViewConstraintViolation[] {
    /** @vizcomment-step Run layout-agnostic constraints using an empty layout */
    return this.constraints.flatMap((c) => c.validate(viewModel, emptyLayout));
  }

  /** @vizcomment-overview Filter validation results to error-severity only */
  errors(
    viewModel: ViewModel,
    layout: LayoutResult,
  ): readonly ViewConstraintViolation[] {
    /** @vizcomment-step Validate then keep only error-level violations */
    return this.validate(viewModel, layout).filter(
      (v) => v.severity === "error",
    );
  }

  /** @vizcomment-overview Filter validation results to warning-severity only */
  warnings(
    viewModel: ViewModel,
    layout: LayoutResult,
  ): readonly ViewConstraintViolation[] {
    /** @vizcomment-step Validate then keep only warning-level violations */
    return this.validate(viewModel, layout).filter(
      (v) => v.severity === "warning",
    );
  }
}

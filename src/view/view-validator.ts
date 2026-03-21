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

  constructor() {
    this.constraints = [
      maxVisibleNodes,
      noNodeOverlap,
      maxEdgeCrossings,
      maxNodeDegree,
      areaCoverage,
    ];
  }

  register(constraint: ViewConstraint): void {
    this.constraints.push(constraint);
  }

  validate(
    viewModel: ViewModel,
    layout: LayoutResult,
  ): readonly ViewConstraintViolation[] {
    return this.constraints.flatMap((c) => c.validate(viewModel, layout));
  }

  /**
   * Run only constraints that do not require layout positions.
   * Useful for early validation before layout is computed.
   */
  validatePreLayout(viewModel: ViewModel): readonly ViewConstraintViolation[] {
    return this.constraints.flatMap((c) => c.validate(viewModel, emptyLayout));
  }

  errors(
    viewModel: ViewModel,
    layout: LayoutResult,
  ): readonly ViewConstraintViolation[] {
    return this.validate(viewModel, layout).filter(
      (v) => v.severity === "error",
    );
  }

  warnings(
    viewModel: ViewModel,
    layout: LayoutResult,
  ): readonly ViewConstraintViolation[] {
    return this.validate(viewModel, layout).filter(
      (v) => v.severity === "warning",
    );
  }
}

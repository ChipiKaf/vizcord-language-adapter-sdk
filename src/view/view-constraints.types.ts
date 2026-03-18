import type { ViewModel } from "./view-model.types.js";

/** Positioned node information after layout. */
export interface NodePosition {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Positioned edge path after layout. */
export interface EdgePath {
  readonly x: number;
  readonly y: number;
}

/** Layout output consumed by view constraints. */
export interface LayoutResult {
  readonly nodePositions: ReadonlyMap<string, NodePosition>;
  readonly edgePaths: ReadonlyMap<string, readonly EdgePath[]>;
  readonly totalWidth: number;
  readonly totalHeight: number;
}

/** Corrective action the system can take automatically. */
export type CorrectiveAction =
  | { readonly kind: "auto-collapse"; readonly threshold: number }
  | { readonly kind: "auto-decompose"; readonly maxNodes: number }
  | { readonly kind: "increase-spacing"; readonly factor: number }
  | { readonly kind: "enable-bundling"; readonly strength: number }
  | { readonly kind: "suggest-layout"; readonly layout: string }
  | { readonly kind: "none" };

/** A single violation produced when a view constraint is not satisfied. */
export interface ViewConstraintViolation {
  readonly constraintName: string;
  readonly severity: "error" | "warning" | "info";
  readonly message: string;
  readonly metric?: number;
  readonly threshold?: number;
  readonly correctiveAction: CorrectiveAction;
}

/** A named invariant checked against a rendered view model and its layout. */
export interface ViewConstraint {
  readonly name: string;
  validate(
    viewModel: ViewModel,
    layout: LayoutResult,
  ): readonly ViewConstraintViolation[];
}

/**
 * Declarative view definition schema.
 *
 * A ViewDefinition describes which canonical nodes and edges to include
 * in a view, how to filter them, how to group them, and visual hints
 * for the renderer — all as data rather than code.
 */

import type { CanonicalNodeKind, CanonicalEdgeKind } from "../canonical/index.js";

export type LayoutType =
  | "hierarchical"
  | "force-directed"
  | "layered"
  | "radial";

export interface NodeFilter {
  /** Include only nodes whose property values match */
  readonly properties?: Readonly<Record<string, unknown>>;
  /** Include only nodes whose name matches this regex pattern */
  readonly namePattern?: string;
  /** Include only nodes with this visibility */
  readonly visibility?: "public" | "protected" | "private";
}

export interface GroupBySpec {
  /** Group nodes by their containment parent of this kind */
  readonly parentKind: string;
  /** Visual treatment */
  readonly display: "cluster" | "swimlane";
}

export interface ViewStyleHints {
  readonly direction?: "TB" | "LR" | "BT" | "RL";
  readonly showEdgeLabels?: boolean;
  readonly collapsible?: boolean;
}

export interface ViewDefinition {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly layout: LayoutType;

  /** Which canonical node kinds to include */
  readonly includeNodeKinds: readonly CanonicalNodeKind[];

  /** Optional filter predicate on node properties */
  readonly nodeFilter?: NodeFilter;

  /** Which edge kinds to include */
  readonly includeEdgeKinds: readonly CanonicalEdgeKind[];

  /** Group nodes by a property or parent relationship */
  readonly groupBy?: GroupBySpec;

  /** Visual hints for the webview renderer */
  readonly style?: ViewStyleHints;
}

/**
 * Declarative view definition schema.
 *
 * A ViewDefinition describes which canonical nodes and edges to include
 * in a view, how to filter them, how to group them, and visual hints
 * for the renderer — all as data rather than code.
 */

import type {
  CanonicalNodeKind,
  CanonicalEdgeKind,
} from "../canonical/index.js";

export type LayoutType =
  | "hierarchical"
  | "force-directed"
  | "layered"
  | "radial";

/** How parent-child containment relationships are rendered. */
export type ContainmentDisplay =
  | "edges" // Separate nodes connected by containment edges (default)
  | "nested" // Children spatially nested inside parent bounding box
  | "compartments"; // UML-style: children grouped into labeled compartments

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

/** Minimal node position map produced by layout algorithms. */
export interface LayoutPositions {
  readonly nodes: Readonly<
    Record<string, { readonly x: number; readonly y: number }>
  >;
}

/** Minimal graph description passed to layout post-processors. */
export interface LayoutPostProcessorGraph {
  readonly nodes: readonly {
    readonly id: string;
    readonly kind: string;
    readonly width: number;
    readonly height: number;
    /** Optional grouping key (e.g. source module) for co-location. */
    readonly group?: string;
  }[];
  readonly edges: readonly {
    readonly id: string;
    readonly from: string;
    readonly to: string;
    readonly kind: string;
  }[];
}

/**
 * A function that refines node positions after the primary layout algorithm.
 * Receives the graph description and the current positions; returns adjusted
 * positions. Post-processors are applied in array order — each receives the
 * output of the previous one.
 */
export type LayoutPostProcessor = (
  graph: LayoutPostProcessorGraph,
  result: LayoutPositions,
) => LayoutPositions;

/** Configuration for the hub-cluster refinement post-processor. */
export interface HubClusterOptions {
  /** Minimum incoming edge count for a node to be treated as a hub centre (default 3). */
  readonly minFanIn?: number;
  /** Edge kinds to consider when counting fan-in (all kinds if omitted). */
  readonly edgeKinds?: readonly string[];
  /** Radius of the ring around the centre node (default 200). */
  readonly radius?: number;
  /** Gap between hub centre edge and neighbour edge (default 60). */
  readonly padding?: number;
  /** Placement mode: "cross" for ≤4 neighbours, "ring" for more, "auto" to decide per hub (default "auto"). */
  readonly mode?: "cross" | "ring" | "auto";
}

/** Configuration for the sibling-stacking post-processor. */
export interface SiblingStackOptions {
  /** Vertical gap between stacked nodes (default 30). */
  readonly gap?: number;
}

/** Configuration for the horizontal compaction post-processor. */
export interface CompactOptions {
  /** Maximum horizontal gap allowed between consecutive nodes (default 60). */
  readonly maxGap?: number;
}

/**
 * A named post-processor entry in the layout pipeline.
 *
 * Post-processors run in array order after the primary layout algorithm.
 * Each receives the output of the previous one.
 */
export interface PostProcessorEntry {
  /** Registered name of the post-processor (e.g. "hubCluster", "siblingStack"). */
  readonly name: string;
  /** Whether this entry is active (default true). */
  readonly enabled?: boolean;
  /** Post-processor-specific configuration. */
  readonly options?: Readonly<Record<string, unknown>>;
}

export interface ViewStyleHints {
  readonly direction?: "TB" | "LR" | "BT" | "RL";
  readonly showEdgeLabels?: boolean;
  readonly collapsible?: boolean;
  /** Node spacing (horizontal in TB/BT, vertical in LR/RL). */
  readonly nodeSep?: number;
  /** Rank spacing (vertical in TB/BT, horizontal in LR/RL). */
  readonly rankSep?: number;
  /**
   * Node kinds that should be visually co-located when they share the same
   * containment parent. Each layout algorithm interprets co-location
   * differently (dagre → vertical column, force → cluster, radial → arc).
   *
   * Omit or set to empty array to disable grouping.
   */
  readonly stackKinds?: readonly string[];
  /** Show UML-style stereotype labels (e.g. «interface») on nodes. */
  readonly showStereotypes?: boolean;
  /**
   * Ordered list of layout post-processors to run after the primary algorithm.
   * Each entry names a registered post-processor and supplies its options.
   */
  readonly postProcessors?: readonly PostProcessorEntry[];
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

  /** How parent-child containment is displayed (default: "edges") */
  readonly containmentDisplay?: ContainmentDisplay;
}

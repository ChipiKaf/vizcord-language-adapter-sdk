import type { ViewNodeId, ViewEdgeId } from "../canonical/index.js";

/**
 * A node to be added to the view.
 * Uses a provisional ID that will be replaced by a real CanonicalId
 * after backward projection and re-extraction.
 */
export interface ViewDeltaAddedNode {
  readonly provisionalId: ViewNodeId;
  readonly label: string;
  readonly kind: string;
  readonly data?: Readonly<Record<string, unknown>>;
}

/**
 * An edge to be added to the view.
 * References provisional or existing node IDs.
 */
export interface ViewDeltaAddedEdge {
  readonly provisionalId: ViewEdgeId;
  readonly sourceId: ViewNodeId;
  readonly targetId: ViewNodeId;
  readonly kind: string;
  readonly label?: string;
}

/**
 * An update to an existing or provisional node in the view.
 */
export interface ViewDeltaNodeUpdate {
  readonly id: ViewNodeId;
  readonly label?: string;
  readonly data?: Readonly<Record<string, unknown>>;
}

/**
 * Accumulated set of view-layer changes.
 *
 * Produced by DiagramDeltaCapture and consumed by backward projection
 * (task 08.2) to derive a CanonicalDelta.
 */
export interface ViewDelta {
  readonly viewType: string;
  readonly addedNodes: readonly ViewDeltaAddedNode[];
  readonly removedNodeIds: readonly ViewNodeId[];
  readonly updatedNodes: readonly ViewDeltaNodeUpdate[];
  readonly addedEdges: readonly ViewDeltaAddedEdge[];
  readonly removedEdgeIds: readonly ViewEdgeId[];
}

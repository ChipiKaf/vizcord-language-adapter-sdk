import type {
  CanonicalId,
  ViewNodeId,
  ViewEdgeId,
} from "../canonical/index.js";

/** A named section within a composite node (e.g. "Fields", "Methods"). */
export interface ViewNodeCompartment {
  readonly label: string;
  readonly entries: readonly CompartmentEntry[];
}

/** A single member entry displayed within a compartment. */
export interface CompartmentEntry {
  readonly nodeId: ViewNodeId;
  readonly canonicalId: CanonicalId;
  readonly label: string;
  /** Full unabbreviated signature shown in the tooltip (e.g. method with params). */
  readonly fullSignature?: string;
  readonly kind: string;
}

export interface ViewNode {
  readonly id: ViewNodeId;
  readonly canonicalId: CanonicalId;
  readonly label: string;
  readonly kind: string;
  readonly data?: Readonly<Record<string, unknown>>;
  /** Child node IDs rendered inside this node (spatial nesting). */
  readonly children?: readonly ViewNodeId[];
  /** Named compartments for structured sub-sections (UML-style). */
  readonly compartments?: readonly ViewNodeCompartment[];
  /** Semantic badges displayed as small overlays (e.g. "async", "private"). */
  readonly badges?: readonly string[];
}

export interface ViewEdge {
  readonly id: ViewEdgeId;
  readonly sourceId: ViewNodeId;
  readonly targetId: ViewNodeId;
  readonly kind: string;
  readonly label?: string;
}

export interface ViewModel {
  readonly viewType: string;
  readonly nodes: readonly ViewNode[];
  readonly edges: readonly ViewEdge[];
}

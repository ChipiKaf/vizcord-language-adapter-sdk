import type {
  CanonicalId,
  ViewNodeId,
  ViewEdgeId,
} from "../canonical/index.js";

export interface ViewNode {
  readonly id: ViewNodeId;
  readonly canonicalId: CanonicalId;
  readonly label: string;
  readonly kind: string;
  readonly data?: Readonly<Record<string, unknown>>;
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

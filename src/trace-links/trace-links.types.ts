import type { SourceRange } from "../canonical/structural.types.js";
import type {
  CanonicalId,
  TraceLinkId,
  ViewNodeId,
} from "../canonical/brand.js";

/** Discriminated link kinds for explicit correspondence types */
export type TraceLinkKind = "source" | "view";

/**
 * A source-layer trace link: connects a canonical node to its origin
 * in a source file (AST node, location, parser identity).
 */
export interface SourceTraceLink {
  readonly id: TraceLinkId;
  readonly canonicalId: CanonicalId;
  readonly layer: "source";
  readonly language: string;
  readonly file: string;
  readonly range: SourceRange;
  readonly astNodeKind: string;
  /** Language-native ID (e.g. TS symbol id) */
  readonly nativeId?: string;
}

/**
 * A view-layer trace link: connects a canonical node to a view element.
 */
export interface ViewTraceLink {
  readonly id: TraceLinkId;
  readonly canonicalId: CanonicalId;
  readonly layer: "view";
  readonly viewNodeId: ViewNodeId;
  /** View type (e.g. "structural", "dependency", "behavioural") */
  readonly viewType: string;
}

/** Discriminated union of all trace link types */
export type TraceLink = SourceTraceLink | ViewTraceLink;

/** Query helpers for trace link lookups */
export interface TraceLinkIndex {
  byCanonicalId(id: CanonicalId): TraceLink[];
  byFile(file: string): SourceTraceLink[];
  byViewNodeId(viewNodeId: ViewNodeId): ViewTraceLink | undefined;
  bySourceRange(file: string, line: number, column: number): SourceTraceLink[];
}

/** A mutable store of trace links */
export interface TraceLinkStore extends TraceLinkIndex {
  add(link: TraceLink): void;
  remove(id: TraceLinkId): void;
  all(): TraceLink[];
}

// ---------------------------------------------------------------------------
// Trace Links – connects AST ↔ Canonical ↔ View nodes
// ---------------------------------------------------------------------------

import type { SourceRange } from "../canonical/structural.js";

/**
 * A trace link records the provenance of a canonical node: which source
 * file, range, and AST construct it was derived from. View-layer links
 * connect canonical nodes to their visual representations.
 */
export interface TraceLink {
  id: string;

  /** The canonical node this link refers to */
  canonicalId: string;

  /** Which layer this link connects */
  layer: "source" | "view";

  /** Language identifier (e.g. "typescript", "python") */
  language?: string;

  /** Source file path */
  file?: string;

  /** Source range in the original file */
  range?: SourceRange;

  /** AST node kind from the parser (e.g. "ClassDeclaration") */
  astNodeKind?: string;

  /** Language-native ID (e.g. TS symbol id) */
  nativeId?: string;

  /** View node ID when layer === "view" */
  viewNodeId?: string;

  /** View type (e.g. "structural", "dependency", "behavioural") */
  viewType?: string;
}

/** Query helpers for trace link lookups */
export interface TraceLinkIndex {
  byCanonicalId(id: string): TraceLink[];
  byFile(file: string): TraceLink[];
  byViewNodeId(viewNodeId: string): TraceLink | undefined;
  bySourceRange(file: string, line: number, column: number): TraceLink[];
}

/** A mutable store of trace links */
export interface TraceLinkStore extends TraceLinkIndex {
  add(link: TraceLink): void;
  remove(id: string): void;
  update(id: string, patch: Partial<TraceLink>): void;
  all(): TraceLink[];
}

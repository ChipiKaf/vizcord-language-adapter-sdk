// ---------------------------------------------------------------------------
// SDK Utilities – helpers for adapter authors
// ---------------------------------------------------------------------------

import type {
  CanonicalNodeBase,
  SourceRange,
} from "../canonical/structural.js";
import type { TraceLink } from "../trace-links/index.js";

let _counter = 0;

/**
 * Generate a stable, language-agnostic canonical ID.
 * Format: `<language>:<filePath>:<qualifiedName>`
 */
export function makeCanonicalId(
  language: string,
  filePath: string,
  qualifiedName: string,
): string {
  return `${language}:${filePath}:${qualifiedName}`;
}

/** Generate a unique trace link ID */
export function makeTraceLinkId(): string {
  return `tl_${Date.now()}_${++_counter}`;
}

/** Generate a unique edge ID */
export function makeEdgeId(
  sourceId: string,
  targetId: string,
  kind: string,
): string {
  return `${kind}:${sourceId}->${targetId}`;
}

/**
 * Create a source-layer trace link from a canonical node.
 */
export function createSourceTraceLink(
  node: CanonicalNodeBase,
  astNodeKind: string,
  nativeId?: string,
): TraceLink {
  return {
    id: makeTraceLinkId(),
    canonicalId: node.id,
    layer: "source",
    language: node.language,
    file: node.sourceRange?.file,
    range: node.sourceRange,
    astNodeKind,
    nativeId,
  };
}

/**
 * Create a view-layer trace link.
 */
export function createViewTraceLink(
  canonicalId: string,
  viewNodeId: string,
  viewType: string,
): TraceLink {
  return {
    id: makeTraceLinkId(),
    canonicalId,
    layer: "view",
    viewNodeId,
    viewType,
  };
}

/**
 * Utility: check whether a source range contains a position.
 */
export function rangeContains(
  range: SourceRange,
  line: number,
  column: number,
): boolean {
  if (line < range.startLine || line > range.endLine) return false;
  if (line === range.startLine && column < range.startColumn) return false;
  if (line === range.endLine && column > range.endColumn) return false;
  return true;
}

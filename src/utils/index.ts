import type {
  CanonicalNodeBase,
  SourceRange,
  SourceOrigin,
} from "../canonical/structural.types.js";
import type {
  CanonicalId,
  EdgeId,
  TraceLinkId,
  ViewNodeId,
} from "../canonical/brand.js";
import type {
  SourceTraceLink,
  ViewTraceLink,
  TraceLink,
} from "../trace-links/index.js";
import type { ExtractionDiagnostic } from "../adapter/contract.types.js";

/**
 * Generate a stable, language-agnostic canonical ID.
 * Format: `<entityKind>:<scope>:<qualifiedName>`
 */
export function makeCanonicalId(
  entityKind: string,
  scope: string,
  qualifiedName: string,
): CanonicalId {
  return `${entityKind}:${scope}:${qualifiedName}` as CanonicalId;
}

/**
 * Generate a deterministic edge ID from its endpoints and kind.
 */
export function makeEdgeId(
  sourceId: CanonicalId,
  targetId: CanonicalId,
  kind: string,
): EdgeId {
  return `${kind}:${sourceId}->${targetId}` as EdgeId;
}

/**
 * Generate a deterministic trace link ID.
 * Derived from the canonical node and layer so the same link
 * is reproducible across re-parses.
 */
export function makeTraceLinkId(
  canonicalId: CanonicalId,
  layer: string,
  qualifier?: string,
): TraceLinkId {
  const suffix = qualifier != null ? `:${qualifier}` : "";
  return `tl:${canonicalId}:${layer}${suffix}` as TraceLinkId;
}

/**
 * Create a view node ID from its canonical counterpart and view type.
 */
export function makeViewNodeId(
  canonicalId: CanonicalId,
  viewType: string,
): ViewNodeId {
  return `${viewType}_${canonicalId}` as ViewNodeId;
}

/**
 * Create a source-layer trace link from a canonical node and its origin.
 */
export function createSourceTraceLink(
  node: CanonicalNodeBase,
  origin: SourceOrigin,
): SourceTraceLink {
  const base = {
    id: makeTraceLinkId(node.id, "source", origin.file),
    canonicalId: node.id,
    layer: "source" as const,
    language: origin.language,
    file: origin.file,
    range: origin.range,
    astNodeKind: origin.astNodeKind ?? "unknown",
  };
  return origin.nativeId != null
    ? { ...base, nativeId: origin.nativeId }
    : base;
}

/**
 * Create a view-layer trace link.
 */
export function createViewTraceLink(
  canonicalId: CanonicalId,
  viewNodeId: ViewNodeId,
  viewType: string,
): ViewTraceLink {
  return {
    id: makeTraceLinkId(canonicalId, "view", viewType),
    canonicalId,
    layer: "view",
    viewNodeId,
    viewType,
  };
}

/**
 * Check whether a source range contains a position.
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

/**
 * Validate that every canonical node has at least one source trace link.
 * Returns warning diagnostics for any unlinked nodes.
 */
export function validateTraceLinkCompleteness(
  nodes: readonly CanonicalNodeBase[],
  traceLinks: readonly TraceLink[],
): ExtractionDiagnostic[] {
  const linkedNodeIds = new Set(
    traceLinks
      .filter((tl): tl is SourceTraceLink => tl.layer === "source")
      .map((tl) => tl.canonicalId),
  );
  const diagnostics: ExtractionDiagnostic[] = [];
  for (const node of nodes) {
    if (!linkedNodeIds.has(node.id)) {
      diagnostics.push({
        severity: "warning",
        file: (node.sourceOrigins ?? [])[0]?.file ?? "unknown",
        code: "partial-extraction",
        message: `Node "${node.name}" (${node.id}) has no source trace link`,
      });
    }
  }
  return diagnostics;
}

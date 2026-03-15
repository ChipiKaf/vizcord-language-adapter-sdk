import { expect } from "vitest";
import type { CanonicalGraph } from "../canonical/index.js";
import type { SourceTraceLink, TraceLink } from "../trace-links/index.js";
import type { ExpectedGraph } from "./conformance.types.js";

/**
 * Assert that an actual CanonicalGraph matches the expected shape.
 * Ignores IDs; matches by kind+name for nodes, kind+source+target for edges.
 */
export function assertGraphShape(
  actual: CanonicalGraph,
  expected: ExpectedGraph,
): void {
  const actualNonModule = actual.nodes.filter((n) => n.kind !== "module");

  // Check expected node counts by kind+name
  const expectedCounts = new Map<string, number>();
  for (const en of expected.nodes) {
    const key = `${en.kind}:${en.name}`;
    expectedCounts.set(key, (expectedCounts.get(key) ?? 0) + 1);
  }

  const actualCounts = new Map<string, number>();
  for (const n of actualNonModule) {
    const key = `${n.kind}:${n.name}`;
    actualCounts.set(key, (actualCounts.get(key) ?? 0) + 1);
  }

  for (const [key, count] of expectedCounts) {
    expect(
      actualCounts.get(key) ?? 0,
      `Expected ${count} node(s) of ${key}, got ${actualCounts.get(key) ?? 0}`,
    ).toBe(count);
  }

  // Check visibility/completeness on uniquely-named nodes
  for (const en of expected.nodes) {
    if (en.visibility === undefined && en.completeness === undefined) continue;
    const matches = actualNonModule.filter(
      (n) => n.kind === en.kind && n.name === en.name,
    );
    if (matches.length !== 1) continue;
    const match = matches[0]!;

    if (en.visibility !== undefined && "visibility" in match) {
      expect(
        (match as { visibility?: string }).visibility,
        `Wrong visibility for ${en.kind} "${en.name}"`,
      ).toBe(en.visibility);
    }

    if (en.completeness !== undefined) {
      expect(
        match.completeness,
        `Wrong completeness for ${en.kind} "${en.name}"`,
      ).toBe(en.completeness);
    }
  }

  expect(
    actualNonModule.length,
    `Expected ${expected.nodes.length} non-module nodes, got ${actualNonModule.length}. ` +
      `Extra: [${actualNonModule
        .filter(
          (n) =>
            !expected.nodes.some(
              (en) => en.kind === n.kind && en.name === n.name,
            ),
        )
        .map((n) => `${n.kind}:${n.name}`)
        .join(", ")}]`,
  ).toBe(expected.nodes.length);

  // Check edges — only assert edges whose source and target names are unique
  for (const ee of expected.edges) {
    const sourceNodes = actual.nodes.filter((n) => n.name === ee.sourceName);
    const targetNodes = actual.nodes.filter((n) => n.name === ee.targetName);
    expect(
      sourceNodes.length,
      `Edge source not found: "${ee.sourceName}"`,
    ).toBeGreaterThan(0);
    expect(
      targetNodes.length,
      `Edge target not found: "${ee.targetName}"`,
    ).toBeGreaterThan(0);

    // Only do exact matching when both names are unique
    if (sourceNodes.length === 1 && targetNodes.length === 1) {
      const edgeMatch = actual.edges.find(
        (e) =>
          e.kind === ee.kind &&
          e.sourceId === sourceNodes[0]!.id &&
          e.targetId === targetNodes[0]!.id,
      );
      expect(
        edgeMatch,
        `Missing edge: ${ee.kind} from "${ee.sourceName}" to "${ee.targetName}"`,
      ).toBeDefined();
    } else {
      // For ambiguous names, check that at least one matching edge exists
      const edgeMatch = actual.edges.find(
        (e) =>
          e.kind === ee.kind &&
          sourceNodes.some((s) => s.id === e.sourceId) &&
          targetNodes.some((t) => t.id === e.targetId),
      );
      expect(
        edgeMatch,
        `Missing edge: ${ee.kind} from "${ee.sourceName}" to "${ee.targetName}"`,
      ).toBeDefined();
    }
  }
}

/**
 * Assert that every extracted node has at least one source trace link.
 */
export function assertTraceLinkCoverage(
  graph: CanonicalGraph,
  traceLinks: readonly TraceLink[],
): void {
  const linkedIds = new Set(
    traceLinks
      .filter((tl): tl is SourceTraceLink => tl.layer === "source")
      .map((tl) => tl.canonicalId),
  );

  for (const node of graph.nodes) {
    expect(
      linkedIds.has(node.id),
      `Node "${node.name}" (${node.kind}) has no source trace link`,
    ).toBe(true);
  }
}

/**
 * Normalize a graph to a comparable shape (sorted by kind+name, IDs stripped).
 * Used for cross-adapter equivalence comparisons.
 */
export function normalizeGraphShape(graph: CanonicalGraph) {
  const nodes = graph.nodes
    .filter((n) => n.kind !== "module")
    .map((n) => ({ kind: n.kind, name: n.name }))
    .sort(
      (a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name),
    );

  const edges = graph.edges
    .map((e) => {
      const src = graph.nodes.find((n) => n.id === e.sourceId);
      const tgt = graph.nodes.find((n) => n.id === e.targetId);
      return {
        kind: e.kind,
        sourceName: src?.name ?? "unknown",
        targetName: tgt?.name ?? "unknown",
      };
    })
    .sort(
      (a, b) =>
        a.kind.localeCompare(b.kind) ||
        a.sourceName.localeCompare(b.sourceName) ||
        a.targetName.localeCompare(b.targetName),
    );

  return { nodes, edges };
}

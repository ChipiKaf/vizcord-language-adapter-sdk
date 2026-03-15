import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import type {
  CanonicalGraph,
  CanonicalId,
  EdgeId,
  TraceLinkId,
} from "../canonical/index.js";
import type { SourceTraceLink } from "../trace-links/index.js";
import type { ExpectedGraph } from "../testing/conformance.types.js";
import {
  assertGraphShape,
  assertTraceLinkCoverage,
  normalizeGraphShape,
} from "../testing/assertions.js";
import { loadFixturesFromDir } from "../testing/loader.js";

function id(s: string): CanonicalId {
  return s as CanonicalId;
}

function eid(s: string): EdgeId {
  return s as EdgeId;
}

function tlid(s: string): TraceLinkId {
  return s as TraceLinkId;
}

const sampleGraph: CanonicalGraph = {
  nodes: [
    { kind: "module", id: id("mod"), name: "src/a.ts", language: "typescript" },
    {
      kind: "class",
      id: id("c1"),
      name: "Foo",
      language: "typescript",
    },
    {
      kind: "function",
      id: id("f1"),
      name: "bar",
      language: "typescript",
      parameters: [],
      visibility: "public",
      parentId: id("c1"),
    },
    {
      kind: "field",
      id: id("fld1"),
      name: "baz",
      language: "typescript",
      parentId: id("c1"),
      visibility: "private",
    },
  ],
  edges: [
    {
      kind: "containment",
      id: eid("e1"),
      sourceId: id("mod"),
      targetId: id("c1"),
    },
    {
      kind: "containment",
      id: eid("e2"),
      sourceId: id("c1"),
      targetId: id("f1"),
    },
    {
      kind: "containment",
      id: eid("e3"),
      sourceId: id("c1"),
      targetId: id("fld1"),
    },
  ],
};

const sampleTraceLinks: readonly SourceTraceLink[] = [
  {
    id: tlid("tl1"),
    canonicalId: id("mod"),
    layer: "source" as const,
    language: "typescript",
    file: "src/a.ts",
    range: {
      file: "src/a.ts",
      startLine: 1,
      startColumn: 0,
      endLine: 10,
      endColumn: 0,
    },
    astNodeKind: "SourceFile",
  },
  {
    id: tlid("tl2"),
    canonicalId: id("c1"),
    layer: "source" as const,
    language: "typescript",
    file: "src/a.ts",
    range: {
      file: "src/a.ts",
      startLine: 1,
      startColumn: 0,
      endLine: 5,
      endColumn: 1,
    },
    astNodeKind: "ClassDeclaration",
  },
  {
    id: tlid("tl3"),
    canonicalId: id("f1"),
    layer: "source" as const,
    language: "typescript",
    file: "src/a.ts",
    range: {
      file: "src/a.ts",
      startLine: 2,
      startColumn: 2,
      endLine: 3,
      endColumn: 3,
    },
    astNodeKind: "MethodDeclaration",
  },
  {
    id: tlid("tl4"),
    canonicalId: id("fld1"),
    layer: "source" as const,
    language: "typescript",
    file: "src/a.ts",
    range: {
      file: "src/a.ts",
      startLine: 4,
      startColumn: 2,
      endLine: 4,
      endColumn: 20,
    },
    astNodeKind: "PropertyDeclaration",
  },
];

describe("assertGraphShape", () => {
  it("passes when expected shape matches actual graph", () => {
    const expected: ExpectedGraph = {
      nodes: [
        { kind: "class", name: "Foo" },
        { kind: "function", name: "bar", visibility: "public" },
        { kind: "field", name: "baz", visibility: "private" },
      ],
      edges: [
        { kind: "containment", sourceName: "src/a.ts", targetName: "Foo" },
        { kind: "containment", sourceName: "Foo", targetName: "bar" },
        { kind: "containment", sourceName: "Foo", targetName: "baz" },
      ],
    };

    expect(() => assertGraphShape(sampleGraph, expected)).not.toThrow();
  });

  it("fails when an expected node is missing", () => {
    const expected: ExpectedGraph = {
      nodes: [
        { kind: "class", name: "Foo" },
        { kind: "function", name: "bar" },
        { kind: "field", name: "baz" },
        { kind: "class", name: "Missing" },
      ],
      edges: [],
    };

    expect(() => assertGraphShape(sampleGraph, expected)).toThrow();
  });

  it("fails when there are extra nodes not in expected", () => {
    const expected: ExpectedGraph = {
      nodes: [{ kind: "class", name: "Foo" }],
      edges: [],
    };

    expect(() => assertGraphShape(sampleGraph, expected)).toThrow();
  });

  it("fails when expected edge is missing", () => {
    const expected: ExpectedGraph = {
      nodes: [
        { kind: "class", name: "Foo" },
        { kind: "function", name: "bar" },
        { kind: "field", name: "baz" },
      ],
      edges: [{ kind: "inheritance", sourceName: "Foo", targetName: "bar" }],
    };

    expect(() => assertGraphShape(sampleGraph, expected)).toThrow();
  });

  it("checks visibility when specified", () => {
    const expected: ExpectedGraph = {
      nodes: [
        { kind: "class", name: "Foo" },
        { kind: "function", name: "bar", visibility: "private" },
        { kind: "field", name: "baz" },
      ],
      edges: [],
    };

    expect(() => assertGraphShape(sampleGraph, expected)).toThrow();
  });

  it("handles duplicate-named nodes via count matching", () => {
    const graphWithDups: CanonicalGraph = {
      nodes: [
        {
          kind: "module",
          id: id("mod"),
          name: "src/a.ts",
          language: "typescript",
        },
        {
          kind: "class",
          id: id("c1"),
          name: "Repo",
          language: "typescript",
        },
        {
          kind: "function",
          id: id("f1"),
          name: "find",
          language: "typescript",
          parameters: [],
          parentId: id("c1"),
        },
        {
          kind: "interface",
          id: id("i1"),
          name: "IRepo",
          language: "typescript",
        },
        {
          kind: "function",
          id: id("f2"),
          name: "find",
          language: "typescript",
          parameters: [],
          parentId: id("i1"),
        },
      ],
      edges: [],
    };

    const expected: ExpectedGraph = {
      nodes: [
        { kind: "class", name: "Repo" },
        { kind: "function", name: "find" },
        { kind: "interface", name: "IRepo" },
        { kind: "function", name: "find" },
      ],
      edges: [],
    };

    expect(() => assertGraphShape(graphWithDups, expected)).not.toThrow();
  });
});

describe("assertTraceLinkCoverage", () => {
  it("passes when all nodes have trace links", () => {
    expect(() =>
      assertTraceLinkCoverage(sampleGraph, sampleTraceLinks),
    ).not.toThrow();
  });

  it("fails when a node lacks a trace link", () => {
    const partial = sampleTraceLinks.slice(0, 2);
    expect(() => assertTraceLinkCoverage(sampleGraph, partial)).toThrow();
  });
});

describe("normalizeGraphShape", () => {
  it("strips IDs and sorts by kind+name", () => {
    const normalized = normalizeGraphShape(sampleGraph);

    expect(normalized.nodes).toEqual([
      { kind: "class", name: "Foo" },
      { kind: "field", name: "baz" },
      { kind: "function", name: "bar" },
    ]);
  });

  it("excludes module nodes", () => {
    const normalized = normalizeGraphShape(sampleGraph);
    const hasModule = normalized.nodes.some(
      (n) => (n.kind as string) === "module",
    );
    expect(hasModule).toBe(false);
  });

  it("normalizes edges with source/target names", () => {
    const normalized = normalizeGraphShape(sampleGraph);
    expect(normalized.edges).toEqual([
      { kind: "containment", sourceName: "Foo", targetName: "bar" },
      { kind: "containment", sourceName: "Foo", targetName: "baz" },
      { kind: "containment", sourceName: "src/a.ts", targetName: "Foo" },
    ]);
  });
});

describe("loadFixturesFromDir", () => {
  let tempDir: string;

  function setupFixtureDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), "vizcord-test-"));

    // Create a valid fixture
    const fixtureDir = join(tempDir, "my-fixture");
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(join(fixtureDir, "input.ts"), "export class Foo {}");
    writeFileSync(
      join(fixtureDir, "expected-graph.json"),
      JSON.stringify({
        nodes: [{ kind: "class", name: "Foo" }],
        edges: [],
      }),
    );

    // Create an incomplete fixture (missing expected-graph.json)
    const incompleteDir = join(tempDir, "incomplete");
    mkdirSync(incompleteDir, { recursive: true });
    writeFileSync(join(incompleteDir, "input.ts"), "export const x = 1;");

    // Create a regular file (not a directory) — should be skipped
    writeFileSync(join(tempDir, "not-a-dir.txt"), "ignore");

    return tempDir;
  }

  it("loads fixtures from valid subdirectories", () => {
    const dir = setupFixtureDir();
    const fixtures = loadFixturesFromDir(dir);

    expect(fixtures).toHaveLength(1);
    expect(fixtures[0]!.name).toBe("my-fixture");
    expect(fixtures[0]!.inputFiles.get("src/input.ts")).toBe(
      "export class Foo {}",
    );
    expect(fixtures[0]!.expectedGraph.nodes).toEqual([
      { kind: "class", name: "Foo" },
    ]);

    rmSync(dir, { recursive: true, force: true });
  });

  it("skips directories without expected-graph.json", () => {
    const dir = setupFixtureDir();
    const fixtures = loadFixturesFromDir(dir);

    const names = fixtures.map((f) => f.name);
    expect(names).not.toContain("incomplete");

    rmSync(dir, { recursive: true, force: true });
  });

  it("uses custom input file name and virtual path", () => {
    tempDir = mkdtempSync(join(tmpdir(), "vizcord-test-"));
    const fixtureDir = join(tempDir, "py-fixture");
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(join(fixtureDir, "input.py"), "class Foo: pass");
    writeFileSync(
      join(fixtureDir, "expected-graph.json"),
      JSON.stringify({ nodes: [], edges: [] }),
    );

    const fixtures = loadFixturesFromDir(tempDir, "input.py", "src/input.py");

    expect(fixtures).toHaveLength(1);
    expect(fixtures[0]!.inputFiles.get("src/input.py")).toBe("class Foo: pass");

    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns empty array for empty directory", () => {
    tempDir = mkdtempSync(join(tmpdir(), "vizcord-test-"));
    const fixtures = loadFixturesFromDir(tempDir);
    expect(fixtures).toEqual([]);
    rmSync(tempDir, { recursive: true, force: true });
  });
});

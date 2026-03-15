import { describe, it, expect } from "vitest";
import {
  makeCanonicalId,
  makeEdgeId,
  makeTraceLinkId,
  makeViewNodeId,
  createSourceTraceLink,
  createViewTraceLink,
  rangeContains,
} from "../utils/index.js";
import type {
  CanonicalId,
  ViewNodeId,
  SourceOrigin,
  CanonicalNodeBase,
} from "../index.js";

function cid(s: string): CanonicalId {
  return s as CanonicalId;
}

describe("makeCanonicalId", () => {
  it("produces <kind>:<scope>:<qualifiedName>", () => {
    expect(makeCanonicalId("class", "src/user.ts", "User")).toBe(
      "class:src/user.ts:User",
    );
  });

  it("handles empty strings", () => {
    expect(makeCanonicalId("", "", "")).toBe("::");
  });

  it("preserves special characters in segments", () => {
    expect(makeCanonicalId("module", "@scope/pkg", "index")).toBe(
      "module:@scope/pkg:index",
    );
  });
});

describe("makeEdgeId", () => {
  it("produces <kind>:<source>-><target>", () => {
    const src = cid("class:a:A");
    const tgt = cid("class:a:B");
    expect(makeEdgeId(src, tgt, "inheritance")).toBe(
      "inheritance:class:a:A->class:a:B",
    );
  });
});

describe("makeTraceLinkId", () => {
  it("produces tl:<id>:<layer> without qualifier", () => {
    expect(makeTraceLinkId(cid("class:a:A"), "source")).toBe(
      "tl:class:a:A:source",
    );
  });

  it("appends qualifier when provided", () => {
    expect(makeTraceLinkId(cid("class:a:A"), "source", "file.ts")).toBe(
      "tl:class:a:A:source:file.ts",
    );
  });

  it("does not append qualifier when undefined", () => {
    const id = makeTraceLinkId(cid("x:y:z"), "view", undefined);
    expect(id).toBe("tl:x:y:z:view");
  });
});

describe("makeViewNodeId", () => {
  it("produces <viewType>_<canonicalId>", () => {
    expect(makeViewNodeId(cid("class:a:A"), "structural")).toBe(
      "structural_class:a:A",
    );
  });
});

describe("createSourceTraceLink", () => {
  const origin: SourceOrigin = {
    language: "typescript",
    file: "src/foo.ts",
    range: {
      file: "src/foo.ts",
      startLine: 1,
      startColumn: 1,
      endLine: 5,
      endColumn: 2,
    },
    astNodeKind: "ClassDeclaration",
  };

  const node: CanonicalNodeBase = {
    id: cid("class:src/foo.ts:Foo"),
    name: "Foo",
    language: "typescript",
    sourceOrigins: [origin],
  };

  it("creates a source trace link with correct fields", () => {
    const link = createSourceTraceLink(node, origin);
    expect(link.layer).toBe("source");
    expect(link.canonicalId).toBe(node.id);
    expect(link.language).toBe("typescript");
    expect(link.file).toBe("src/foo.ts");
    expect(link.range).toEqual(origin.range);
    expect(link.astNodeKind).toBe("ClassDeclaration");
  });

  it("generates a deterministic id", () => {
    const link = createSourceTraceLink(node, origin);
    expect(link.id).toBe("tl:class:src/foo.ts:Foo:source:src/foo.ts");
  });

  it("uses 'unknown' when astNodeKind is undefined", () => {
    const { astNodeKind: _, ...rest } = origin;
    const originNoKind = rest as SourceOrigin;
    const link = createSourceTraceLink(node, originNoKind);
    expect(link.astNodeKind).toBe("unknown");
  });

  it("includes nativeId when present in origin", () => {
    const originWithNative: SourceOrigin = { ...origin, nativeId: "sym-42" };
    const link = createSourceTraceLink(node, originWithNative);
    expect(link.nativeId).toBe("sym-42");
  });

  it("omits nativeId when not present", () => {
    const link = createSourceTraceLink(node, origin);
    expect("nativeId" in link).toBe(false);
  });
});

describe("createViewTraceLink", () => {
  it("creates a view trace link with correct fields", () => {
    const link = createViewTraceLink(
      cid("class:a:A"),
      "sv_class:a:A" as ViewNodeId,
      "structural",
    );
    expect(link.layer).toBe("view");
    expect(link.canonicalId).toBe("class:a:A");
    expect(link.viewNodeId).toBe("sv_class:a:A");
    expect(link.viewType).toBe("structural");
  });

  it("generates a deterministic id", () => {
    const link = createViewTraceLink(
      cid("class:a:A"),
      "sv_class:a:A" as ViewNodeId,
      "structural",
    );
    expect(link.id).toBe("tl:class:a:A:view:structural");
  });
});

describe("rangeContains", () => {
  const range = {
    file: "f.ts",
    startLine: 5,
    startColumn: 3,
    endLine: 10,
    endColumn: 20,
  };

  it("returns true for a position inside the range", () => {
    expect(rangeContains(range, 7, 10)).toBe(true);
  });

  it("returns true for position on start boundary", () => {
    expect(rangeContains(range, 5, 3)).toBe(true);
  });

  it("returns true for position on end boundary", () => {
    expect(rangeContains(range, 10, 20)).toBe(true);
  });

  it("returns false for line before range", () => {
    expect(rangeContains(range, 4, 10)).toBe(false);
  });

  it("returns false for line after range", () => {
    expect(rangeContains(range, 11, 1)).toBe(false);
  });

  it("returns false for column before start on start line", () => {
    expect(rangeContains(range, 5, 2)).toBe(false);
  });

  it("returns false for column after end on end line", () => {
    expect(rangeContains(range, 10, 21)).toBe(false);
  });

  it("returns true for any column on a middle line", () => {
    expect(rangeContains(range, 7, 1)).toBe(true);
    expect(rangeContains(range, 7, 999)).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { validateTraceRules } from "../trace-links/rules.js";
import type { TraceRule } from "../trace-links/rules.types.js";
import type {
  ClassNode,
  FunctionNode,
  PackageNode,
} from "../canonical/index.js";
import type { CanonicalId, TraceLinkId } from "../canonical/brand.js";
import type {
  TraceLink,
  SourceTraceLink,
  ViewTraceLink,
} from "../trace-links/index.js";
import type { ViewNodeId } from "../canonical/brand.js";

function cid(s: string): CanonicalId {
  return s as CanonicalId;
}

function tlid(s: string): TraceLinkId {
  return s as TraceLinkId;
}

function fakeClassNode(id: string): ClassNode {
  return {
    kind: "class",
    id: cid(id),
    name: id.split(":").pop()!,
    language: "typescript",
  };
}

function fakeFunctionNode(id: string): FunctionNode {
  return {
    kind: "function",
    id: cid(id),
    name: id.split(":").pop()!,
    language: "typescript",
    parameters: [],
  };
}

function fakePackageNode(id: string): PackageNode {
  return {
    kind: "package",
    id: cid(id),
    name: id.split(":").pop()!,
    language: "typescript",
  };
}

function fakeSourceLink(canonicalId: string): SourceTraceLink {
  return {
    id: tlid(`tl:${canonicalId}:source`),
    canonicalId: cid(canonicalId),
    layer: "source",
    language: "typescript",
    file: "test.ts",
    range: {
      file: "test.ts",
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: 10,
    },
    astNodeKind: "ClassDeclaration",
  };
}

function fakeViewLink(canonicalId: string, viewType: string): ViewTraceLink {
  return {
    id: tlid(`tl:${canonicalId}:view:${viewType}`),
    canonicalId: cid(canonicalId),
    layer: "view",
    viewNodeId: `sv_${canonicalId}` as ViewNodeId,
    viewType,
  };
}

const classRule: TraceRule = {
  id: "source:class",
  canonicalKind: "class",
  layer: "source",
  required: true,
  description: "Every class must have a source trace link",
};

const optionalPackageRule: TraceRule = {
  id: "source:package",
  canonicalKind: "package",
  layer: "source",
  required: false,
  description: "Packages should trace to source",
};

describe("validateTraceRules", () => {
  it("returns empty array when all rules satisfied", () => {
    const nodes = [fakeClassNode("class:mod:Foo")];
    const links: TraceLink[] = [fakeSourceLink("class:mod:Foo")];

    const result = validateTraceRules([classRule], nodes, links);
    expect(result).toEqual([]);
  });

  it("returns error diagnostic for missing required link", () => {
    const nodes = [fakeClassNode("class:mod:Foo")];
    const links: TraceLink[] = [];

    const result = validateTraceRules([classRule], nodes, links);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("error");
    expect(result[0].ruleId).toBe("source:class");
    expect(result[0].nodeId).toBe("class:mod:Foo");
    expect(result[0].nodeKind).toBe("class");
    expect(result[0].message).toContain("source:class");
  });

  it("returns warning diagnostic for missing optional link", () => {
    const nodes = [fakePackageNode("package:root:pkg")];
    const links: TraceLink[] = [];

    const result = validateTraceRules([optionalPackageRule], nodes, links);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("warning");
    expect(result[0].ruleId).toBe("source:package");
  });

  it("ignores nodes whose kind does not match the rule", () => {
    const nodes = [fakeFunctionNode("function:mod:bar")];
    const links: TraceLink[] = [];

    const result = validateTraceRules([classRule], nodes, links);
    expect(result).toEqual([]);
  });

  it("validates multiple rules across multiple nodes", () => {
    const rules = [classRule, optionalPackageRule];
    const nodes = [
      fakeClassNode("class:mod:Foo"),
      fakeClassNode("class:mod:Bar"),
      fakePackageNode("package:root:pkg"),
    ];
    const links: TraceLink[] = [fakeSourceLink("class:mod:Foo")];

    const result = validateTraceRules(rules, nodes, links);
    expect(result).toHaveLength(2);
    expect(result.find((d) => d.nodeId === "class:mod:Bar")?.severity).toBe(
      "error",
    );
    expect(result.find((d) => d.nodeId === "package:root:pkg")?.severity).toBe(
      "warning",
    );
  });

  it("returns empty array when no rules provided", () => {
    const nodes = [fakeClassNode("class:mod:Foo")];
    const links: TraceLink[] = [];

    const result = validateTraceRules([], nodes, links);
    expect(result).toEqual([]);
  });

  it("returns empty array when no nodes provided", () => {
    const result = validateTraceRules([classRule], [], []);
    expect(result).toEqual([]);
  });

  it("distinguishes source and view layers", () => {
    const viewRule: TraceRule = {
      id: "view:class",
      canonicalKind: "class",
      layer: "view",
      required: true,
      description: "Every class must have a view trace link",
    };

    const nodes = [fakeClassNode("class:mod:Foo")];
    // Node has a source link but no view link
    const links: TraceLink[] = [fakeSourceLink("class:mod:Foo")];

    // Source rule should pass
    expect(validateTraceRules([classRule], nodes, links)).toEqual([]);
    // View rule should fail
    const viewResult = validateTraceRules([viewRule], nodes, links);
    expect(viewResult).toHaveLength(1);
    expect(viewResult[0].ruleId).toBe("view:class");
  });

  it("viewType-specific rule rejects link from different viewType", () => {
    const structuralRule: TraceRule = {
      id: "view:structural:class",
      canonicalKind: "class",
      layer: "view",
      viewType: "structural",
      required: true,
      description: "Class must have a structural view link",
    };

    const nodes = [fakeClassNode("class:mod:Foo")];
    // Node only has a dependency view link, not structural
    const links: TraceLink[] = [fakeViewLink("class:mod:Foo", "dependency")];

    const result = validateTraceRules([structuralRule], nodes, links);
    expect(result).toHaveLength(1);
    expect(result[0].ruleId).toBe("view:structural:class");
  });

  it("viewType-specific rule accepts matching viewType link", () => {
    const structuralRule: TraceRule = {
      id: "view:structural:class",
      canonicalKind: "class",
      layer: "view",
      viewType: "structural",
      required: true,
      description: "Class must have a structural view link",
    };

    const nodes = [fakeClassNode("class:mod:Foo")];
    const links: TraceLink[] = [fakeViewLink("class:mod:Foo", "structural")];

    const result = validateTraceRules([structuralRule], nodes, links);
    expect(result).toEqual([]);
  });

  it("includes node name in diagnostic message", () => {
    const nodes = [fakeClassNode("class:mod:MyClass")];
    const links: TraceLink[] = [];

    const result = validateTraceRules([classRule], nodes, links);
    expect(result[0].message).toContain("MyClass");
  });
});

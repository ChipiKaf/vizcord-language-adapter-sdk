import { describe, it, expect } from "vitest";
import {
  defaultNotation,
  validateNotation,
  CANONICAL_NODE_KINDS,
  CANONICAL_EDGE_KINDS,
} from "../index.js";
import type { NotationStandard, NodeNotation, EdgeNotation } from "../index.js";

describe("defaultNotation", () => {
  it("has an entry for every canonical node kind", () => {
    for (const kind of CANONICAL_NODE_KINDS) {
      expect(defaultNotation.nodes[kind]).toBeDefined();
    }
  });

  it("has an entry for every canonical edge kind", () => {
    for (const kind of CANONICAL_EDGE_KINDS) {
      expect(defaultNotation.edges[kind]).toBeDefined();
    }
  });

  it("node entries have required fields", () => {
    for (const kind of CANONICAL_NODE_KINDS) {
      const n = defaultNotation.nodes[kind];
      expect(n.shape).toEqual(expect.any(String));
      expect(n.icon).toEqual(expect.any(String));
      expect(n.colorRole).toEqual(expect.any(String));
      expect(n.defaultLabel).toMatch(/^(name|qualifiedName)$/);
    }
  });

  it("edge entries have required fields", () => {
    for (const kind of CANONICAL_EDGE_KINDS) {
      const e = defaultNotation.edges[kind];
      expect(e.lineStyle).toMatch(/^(solid|dashed|dotted)$/);
      expect(e.arrowHead).toMatch(/^(triangle|diamond|circle|none|vee)$/);
      expect(e.colorRole).toEqual(expect.any(String));
    }
  });
});

describe("validateNotation", () => {
  it("returns no errors for defaultNotation", () => {
    expect(validateNotation(defaultNotation)).toEqual([]);
  });

  it("reports missing node kinds", () => {
    const partial = {
      nodes: { ...defaultNotation.nodes } as Record<string, NodeNotation>,
      edges: defaultNotation.edges,
    };
    delete partial.nodes["class"];
    const errors = validateNotation(partial as unknown as NotationStandard);
    expect(errors).toContain('Missing node notation for kind "class"');
  });

  it("reports missing edge kinds", () => {
    const partial = {
      nodes: defaultNotation.nodes,
      edges: { ...defaultNotation.edges } as Record<string, EdgeNotation>,
    };
    delete partial.edges["inheritance"];
    const errors = validateNotation(partial as unknown as NotationStandard);
    expect(errors).toContain('Missing edge notation for kind "inheritance"');
  });

  it("reports multiple missing kinds at once", () => {
    const partial = {
      nodes: { ...defaultNotation.nodes } as Record<string, NodeNotation>,
      edges: { ...defaultNotation.edges } as Record<string, EdgeNotation>,
    };
    delete partial.nodes["function"];
    delete partial.edges["import"];
    const errors = validateNotation(partial as unknown as NotationStandard);
    expect(errors).toHaveLength(2);
    expect(errors).toContain('Missing node notation for kind "function"');
    expect(errors).toContain('Missing edge notation for kind "import"');
  });
});

describe("CANONICAL_NODE_KINDS / CANONICAL_EDGE_KINDS completeness", () => {
  it("CANONICAL_NODE_KINDS covers all defaultNotation node keys", () => {
    const notationKeys = Object.keys(defaultNotation.nodes).sort();
    const kindArray = [...CANONICAL_NODE_KINDS].sort();
    expect(kindArray).toEqual(notationKeys);
  });

  it("CANONICAL_EDGE_KINDS covers all defaultNotation edge keys", () => {
    const notationKeys = Object.keys(defaultNotation.edges).sort();
    const kindArray = [...CANONICAL_EDGE_KINDS].sort();
    expect(kindArray).toEqual(notationKeys);
  });
});

import { describe, it, expect } from "vitest";
import {
  referentialIntegrity,
  uniqueNodeIds,
  containmentAcyclicity,
  singleContainmentParent,
} from "../validation/constraints.js";
import { GraphValidator } from "../validation/validator.js";
import type { GraphConstraint } from "../validation/constraints.types.js";
import type { CanonicalGraph } from "../canonical/index.js";
import type {
  ModuleNode,
  ClassNode,
  ContainmentEdge,
  InheritanceEdge,
} from "../canonical/structural.types.js";
import type { CanonicalId, EdgeId } from "../canonical/brand.js";

function cid(s: string): CanonicalId {
  return s as CanonicalId;
}
function eid(s: string): EdgeId {
  return s as EdgeId;
}

function makeModule(id: string, name?: string): ModuleNode {
  return {
    kind: "module",
    id: cid(id),
    name: name ?? id,
    language: "typescript",
  };
}

function makeClass(id: string, name?: string): ClassNode {
  return {
    kind: "class",
    id: cid(id),
    name: name ?? id,
    language: "typescript",
  };
}

function makeContainment(
  sourceId: string,
  targetId: string,
  edgeId?: string,
): ContainmentEdge {
  return {
    id: eid(edgeId ?? `${sourceId}->${targetId}`),
    kind: "containment",
    sourceId: cid(sourceId),
    targetId: cid(targetId),
  };
}

function makeInheritance(
  sourceId: string,
  targetId: string,
  edgeId?: string,
): InheritanceEdge {
  return {
    id: eid(edgeId ?? `${sourceId}->${targetId}`),
    kind: "inheritance",
    sourceId: cid(sourceId),
    targetId: cid(targetId),
  };
}

describe("referentialIntegrity", () => {
  it("returns no violations for a valid graph", () => {
    const graph: CanonicalGraph = {
      nodes: [makeClass("A"), makeClass("B")],
      edges: [makeInheritance("A", "B")],
    };
    expect(referentialIntegrity.validate(graph)).toEqual([]);
  });

  it("detects dangling target reference", () => {
    const graph: CanonicalGraph = {
      nodes: [makeClass("A")],
      edges: [makeInheritance("A", "B")],
    };
    const violations = referentialIntegrity.validate(graph);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain("non-existent target");
    expect(violations[0].severity).toBe("error");
  });

  it("detects dangling source reference", () => {
    const graph: CanonicalGraph = {
      nodes: [makeClass("B")],
      edges: [makeInheritance("A", "B")],
    };
    const violations = referentialIntegrity.validate(graph);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain("non-existent source");
  });

  it("detects both dangling source and target", () => {
    const graph: CanonicalGraph = {
      nodes: [],
      edges: [makeInheritance("A", "B")],
    };
    const violations = referentialIntegrity.validate(graph);
    expect(violations).toHaveLength(2);
  });

  it("returns no violations for an empty graph", () => {
    const graph: CanonicalGraph = { nodes: [], edges: [] };
    expect(referentialIntegrity.validate(graph)).toEqual([]);
  });
});

describe("uniqueNodeIds", () => {
  it("returns no violations when all IDs are unique", () => {
    const graph: CanonicalGraph = {
      nodes: [makeClass("A"), makeClass("B")],
      edges: [],
    };
    expect(uniqueNodeIds.validate(graph)).toEqual([]);
  });

  it("detects duplicate node IDs", () => {
    const graph: CanonicalGraph = {
      nodes: [makeClass("A"), makeClass("A", "OtherA")],
      edges: [],
    };
    const violations = uniqueNodeIds.validate(graph);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain("Duplicate node ID");
    expect(violations[0].involvedNodes).toEqual([cid("A")]);
  });

  it("reports only one violation per duplicate ID", () => {
    const graph: CanonicalGraph = {
      nodes: [makeClass("A"), makeClass("A", "A2"), makeClass("A", "A3")],
      edges: [],
    };
    const violations = uniqueNodeIds.validate(graph);
    expect(violations).toHaveLength(1);
  });
});

describe("containmentAcyclicity", () => {
  it("accepts a valid containment tree", () => {
    const graph: CanonicalGraph = {
      nodes: [makeModule("pkg"), makeModule("mod"), makeClass("cls")],
      edges: [makeContainment("pkg", "mod"), makeContainment("mod", "cls")],
    };
    expect(containmentAcyclicity.validate(graph)).toEqual([]);
  });

  it("detects a direct cycle (A→B→A)", () => {
    const graph: CanonicalGraph = {
      nodes: [makeClass("A"), makeClass("B")],
      edges: [makeContainment("A", "B", "e1"), makeContainment("B", "A", "e2")],
    };
    const violations = containmentAcyclicity.validate(graph);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].constraintName).toBe("containment-acyclicity");
  });

  it("detects a transitive cycle (A→B→C→A)", () => {
    const graph: CanonicalGraph = {
      nodes: [makeClass("A"), makeClass("B"), makeClass("C")],
      edges: [
        makeContainment("A", "B", "e1"),
        makeContainment("B", "C", "e2"),
        makeContainment("C", "A", "e3"),
      ],
    };
    const violations = containmentAcyclicity.validate(graph);
    expect(violations.length).toBeGreaterThan(0);
  });

  it("returns no violations when there are no containment edges", () => {
    const graph: CanonicalGraph = {
      nodes: [makeClass("A"), makeClass("B")],
      edges: [makeInheritance("A", "B")],
    };
    expect(containmentAcyclicity.validate(graph)).toEqual([]);
  });

  it("detects cycle via a non-last parent when a node has multiple containment parents", () => {
    // A→C (containment), B→C (containment), C→A (containment)
    // Cycle: A→C→A exists via the first parent edge.
    // The old childToParent Map would overwrite A with B as C's parent,
    // missing the cycle entirely.
    const graph: CanonicalGraph = {
      nodes: [makeClass("A"), makeClass("B"), makeClass("C")],
      edges: [
        makeContainment("A", "C", "e1"),
        makeContainment("B", "C", "e2"),
        makeContainment("C", "A", "e3"),
      ],
    };
    const violations = containmentAcyclicity.validate(graph);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].constraintName).toBe("containment-acyclicity");
  });
});

describe("singleContainmentParent", () => {
  it("accepts a node with one parent", () => {
    const graph: CanonicalGraph = {
      nodes: [makeModule("parent"), makeClass("child")],
      edges: [makeContainment("parent", "child")],
    };
    expect(singleContainmentParent.validate(graph)).toEqual([]);
  });

  it("warns when a node has multiple containment parents", () => {
    const graph: CanonicalGraph = {
      nodes: [makeModule("parent1"), makeModule("parent2"), makeClass("child")],
      edges: [
        makeContainment("parent1", "child", "e1"),
        makeContainment("parent2", "child", "e2"),
      ],
    };
    const violations = singleContainmentParent.validate(graph);
    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe("warning");
    expect(violations[0].involvedNodes).toEqual([cid("child")]);
  });

  it("reports only one warning per multi-parent node", () => {
    const graph: CanonicalGraph = {
      nodes: [
        makeModule("p1"),
        makeModule("p2"),
        makeModule("p3"),
        makeClass("child"),
      ],
      edges: [
        makeContainment("p1", "child", "e1"),
        makeContainment("p2", "child", "e2"),
        makeContainment("p3", "child", "e3"),
      ],
    };
    const violations = singleContainmentParent.validate(graph);
    expect(violations).toHaveLength(1);
  });
});

describe("GraphValidator", () => {
  it("combines violations from all built-in constraints", () => {
    const graph: CanonicalGraph = {
      nodes: [makeClass("A"), makeClass("A", "A-dup")],
      edges: [makeInheritance("A", "nonexistent")],
    };
    const validator = new GraphValidator();
    const violations = validator.validate(graph);
    // At least: 1 duplicate + 1 dangling target
    expect(violations.length).toBeGreaterThanOrEqual(2);
  });

  it("accepts a valid acyclic graph with no violations", () => {
    const graph: CanonicalGraph = {
      nodes: [makeModule("pkg"), makeModule("mod"), makeClass("cls")],
      edges: [makeContainment("pkg", "mod"), makeContainment("mod", "cls")],
    };
    const validator = new GraphValidator();
    expect(validator.errors(graph)).toEqual([]);
  });

  it("errors() returns only error-severity violations", () => {
    const graph: CanonicalGraph = {
      nodes: [makeModule("p1"), makeModule("p2"), makeClass("child")],
      edges: [
        makeContainment("p1", "child", "e1"),
        makeContainment("p2", "child", "e2"),
      ],
    };
    const validator = new GraphValidator();
    const all = validator.validate(graph);
    const errors = validator.errors(graph);
    // singleContainmentParent produces warnings, not errors
    expect(all.some((v) => v.severity === "warning")).toBe(true);
    expect(errors.every((v) => v.severity === "error")).toBe(true);
  });

  it("allows custom constraint registration", () => {
    const noEmptyNames: GraphConstraint = {
      name: "no-empty-names",
      validate(graph) {
        return graph.nodes
          .filter((n) => !n.name)
          .map((n) => ({
            constraintName: "no-empty-names",
            severity: "warning" as const,
            message: `Node "${n.id}" has an empty name`,
            involvedNodes: [n.id],
          }));
      },
    };

    const validator = new GraphValidator();
    validator.register(noEmptyNames);

    const graph: CanonicalGraph = {
      nodes: [{ ...makeClass("A"), name: "" }],
      edges: [],
    };
    const violations = validator.validate(graph);
    expect(violations.some((v) => v.constraintName === "no-empty-names")).toBe(
      true,
    );
  });

  it("returns empty array for an empty graph", () => {
    const validator = new GraphValidator();
    expect(validator.validate({ nodes: [], edges: [] })).toEqual([]);
  });
});

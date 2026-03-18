import { describe, it, expect } from "vitest";
import {
  maxVisibleNodes,
  noNodeOverlap,
  maxEdgeCrossings,
  maxNodeDegree,
  areaCoverage,
  countEdgeCrossings,
} from "../view/view-constraints.js";
import { ViewValidator } from "../view/view-validator.js";
import type { ViewConstraint } from "../view/view-constraints.types.js";
import type {
  ViewModel,
  ViewNode,
  ViewEdge,
} from "../view/view-model.types.js";
import type { LayoutResult } from "../view/view-constraints.types.js";
import type {
  CanonicalId,
  ViewNodeId,
  ViewEdgeId,
} from "../canonical/brand.js";

function vnid(s: string): ViewNodeId {
  return s as ViewNodeId;
}
function veid(s: string): ViewEdgeId {
  return s as ViewEdgeId;
}
function cid(s: string): CanonicalId {
  return s as CanonicalId;
}

function makeNode(id: string, kind = "class"): ViewNode {
  return {
    id: vnid(id),
    canonicalId: cid(id),
    label: id,
    kind,
  };
}

function makeEdge(
  source: string,
  target: string,
  kind = "inheritance",
): ViewEdge {
  return {
    id: veid(`${source}->${target}`),
    sourceId: vnid(source),
    targetId: vnid(target),
    kind,
  };
}

function makeViewModel(nodes: ViewNode[], edges: ViewEdge[] = []): ViewModel {
  return { viewType: "structural", nodes, edges };
}

function emptyLayout(): LayoutResult {
  return {
    nodePositions: new Map(),
    edgePaths: new Map(),
    totalWidth: 0,
    totalHeight: 0,
  };
}

function layoutFromPositions(
  positions: Record<
    string,
    { x: number; y: number; width: number; height: number }
  >,
  totalWidth = 1000,
  totalHeight = 1000,
): LayoutResult {
  const nodePositions = new Map(Object.entries(positions));
  return { nodePositions, edgePaths: new Map(), totalWidth, totalHeight };
}

// ─── maxVisibleNodes ─────────────────────────────────────────────

describe("maxVisibleNodes", () => {
  it("returns no violations for small diagrams", () => {
    const vm = makeViewModel([makeNode("A"), makeNode("B")]);
    expect(maxVisibleNodes.validate(vm, emptyLayout())).toEqual([]);
  });

  it("returns no violations at exactly 50 nodes", () => {
    const nodes = Array.from({ length: 50 }, (_, i) => makeNode(`N${i}`));
    const vm = makeViewModel(nodes);
    expect(maxVisibleNodes.validate(vm, emptyLayout())).toEqual([]);
  });

  it("returns warning when node count exceeds 50", () => {
    const nodes = Array.from({ length: 51 }, (_, i) => makeNode(`N${i}`));
    const vm = makeViewModel(nodes);
    const violations = maxVisibleNodes.validate(vm, emptyLayout());
    expect(violations).toHaveLength(1);
    expect(violations[0]!.severity).toBe("warning");
    expect(violations[0]!.metric).toBe(51);
    expect(violations[0]!.threshold).toBe(50);
    expect(violations[0]!.correctiveAction.kind).toBe("auto-collapse");
  });
});

// ─── noNodeOverlap ───────────────────────────────────────────────

describe("noNodeOverlap", () => {
  it("returns no violations for non-overlapping nodes", () => {
    const vm = makeViewModel([makeNode("A"), makeNode("B")]);
    const layout = layoutFromPositions({
      A: { x: 0, y: 0, width: 100, height: 50 },
      B: { x: 200, y: 0, width: 100, height: 50 },
    });
    expect(noNodeOverlap.validate(vm, layout)).toEqual([]);
  });

  it("returns no violations for adjacent nodes (no gap but no overlap)", () => {
    const vm = makeViewModel([makeNode("A"), makeNode("B")]);
    const layout = layoutFromPositions({
      A: { x: 0, y: 0, width: 100, height: 50 },
      B: { x: 100, y: 0, width: 100, height: 50 },
    });
    expect(noNodeOverlap.validate(vm, layout)).toEqual([]);
  });

  it("detects overlapping nodes", () => {
    const vm = makeViewModel([makeNode("A"), makeNode("B")]);
    const layout = layoutFromPositions({
      A: { x: 0, y: 0, width: 100, height: 50 },
      B: { x: 50, y: 25, width: 100, height: 50 },
    });
    const violations = noNodeOverlap.validate(vm, layout);
    expect(violations).toHaveLength(1);
    expect(violations[0]!.severity).toBe("error");
    expect(violations[0]!.message).toContain("A");
    expect(violations[0]!.message).toContain("B");
    expect(violations[0]!.correctiveAction.kind).toBe("increase-spacing");
  });

  it("detects multiple overlapping pairs", () => {
    const vm = makeViewModel([makeNode("A"), makeNode("B"), makeNode("C")]);
    const layout = layoutFromPositions({
      A: { x: 0, y: 0, width: 100, height: 100 },
      B: { x: 50, y: 50, width: 100, height: 100 },
      C: { x: 80, y: 80, width: 100, height: 100 },
    });
    const violations = noNodeOverlap.validate(vm, layout);
    // A-B overlap, A-C overlap, B-C overlap
    expect(violations).toHaveLength(3);
  });

  it("returns no violations for empty layout", () => {
    const vm = makeViewModel([makeNode("A")]);
    expect(noNodeOverlap.validate(vm, emptyLayout())).toEqual([]);
  });
});

// ─── maxEdgeCrossings ────────────────────────────────────────────

describe("maxEdgeCrossings", () => {
  it("returns no violations when edge paths are empty", () => {
    const vm = makeViewModel([makeNode("A")]);
    expect(maxEdgeCrossings.validate(vm, emptyLayout())).toEqual([]);
  });

  it("returns no violations when crossings are below threshold", () => {
    const vm = makeViewModel([makeNode("A"), makeNode("B")]);
    const layout: LayoutResult = {
      nodePositions: new Map(),
      edgePaths: new Map([
        [
          "e1",
          [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
          ],
        ],
        [
          "e2",
          [
            { x: 0, y: 10 },
            { x: 100, y: 10 },
          ],
        ],
      ]),
      totalWidth: 100,
      totalHeight: 100,
    };
    expect(maxEdgeCrossings.validate(vm, layout)).toEqual([]);
  });

  it("flags when crossings exceed threshold of 20", () => {
    const vm = makeViewModel([makeNode("A")]);
    // Build > 20 crossing edges: radial star pattern where every pair crosses
    // With n edges through the same center, crossings ≈ n*(n-1)/2
    // n=7 → 21 crossings
    const paths = new Map<string, { x: number; y: number }[]>();
    for (let i = 0; i < 7; i++) {
      const angle = (i * Math.PI) / 7;
      paths.set(`e${i}`, [
        { x: 50 + 50 * Math.cos(angle), y: 50 + 50 * Math.sin(angle) },
        { x: 50 - 50 * Math.cos(angle), y: 50 - 50 * Math.sin(angle) },
      ]);
    }
    const layout: LayoutResult = {
      nodePositions: new Map(),
      edgePaths: paths,
      totalWidth: 100,
      totalHeight: 100,
    };
    const violations = maxEdgeCrossings.validate(vm, layout);
    expect(violations).toHaveLength(1);
    expect(violations[0]!.severity).toBe("warning");
    expect(violations[0]!.correctiveAction.kind).toBe("enable-bundling");
  });
});

// ─── countEdgeCrossings ──────────────────────────────────────────

describe("countEdgeCrossings", () => {
  it("returns 0 for no edge paths", () => {
    expect(countEdgeCrossings(new Map())).toBe(0);
  });

  it("returns 0 for parallel edges", () => {
    const paths = new Map([
      [
        "e1",
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      ],
      [
        "e2",
        [
          { x: 0, y: 10 },
          { x: 100, y: 10 },
        ],
      ],
    ]);
    expect(countEdgeCrossings(paths)).toBe(0);
  });

  it("detects a single crossing", () => {
    // X pattern: (0,0)→(100,100) crosses (0,100)→(100,0)
    const paths = new Map([
      [
        "e1",
        [
          { x: 0, y: 0 },
          { x: 100, y: 100 },
        ],
      ],
      [
        "e2",
        [
          { x: 0, y: 100 },
          { x: 100, y: 0 },
        ],
      ],
    ]);
    expect(countEdgeCrossings(paths)).toBe(1);
  });

  it("returns 0 for a single edge", () => {
    const paths = new Map([
      [
        "e1",
        [
          { x: 0, y: 0 },
          { x: 100, y: 100 },
        ],
      ],
    ]);
    expect(countEdgeCrossings(paths)).toBe(0);
  });

  it("counts crossings across multi-segment edges", () => {
    // Edge 1: zigzag (0,0)→(50,50)→(100,0)
    // Edge 2: straight horizontal (0,25)→(100,25)
    // This should cross edge 1 twice (once each segment)
    const paths = new Map([
      [
        "e1",
        [
          { x: 0, y: 0 },
          { x: 50, y: 50 },
          { x: 100, y: 0 },
        ],
      ],
      [
        "e2",
        [
          { x: 0, y: 25 },
          { x: 100, y: 25 },
        ],
      ],
    ]);
    expect(countEdgeCrossings(paths)).toBe(2);
  });
});

// ─── maxNodeDegree ───────────────────────────────────────────────

describe("maxNodeDegree", () => {
  it("returns no violations for low-degree nodes", () => {
    const vm = makeViewModel(
      [makeNode("A"), makeNode("B")],
      [makeEdge("A", "B")],
    );
    expect(maxNodeDegree.validate(vm, emptyLayout())).toEqual([]);
  });

  it("returns no violations at exactly 15 edges per node", () => {
    const nodes = [
      makeNode("hub"),
      ...Array.from({ length: 15 }, (_, i) => makeNode(`N${i}`)),
    ];
    const edges = Array.from({ length: 15 }, (_, i) =>
      makeEdge("hub", `N${i}`),
    );
    const vm = makeViewModel(nodes, edges);
    expect(maxNodeDegree.validate(vm, emptyLayout())).toEqual([]);
  });

  it("flags hub nodes with degree > 15", () => {
    const nodes = [
      makeNode("hub"),
      ...Array.from({ length: 16 }, (_, i) => makeNode(`N${i}`)),
    ];
    const edges = Array.from({ length: 16 }, (_, i) =>
      makeEdge("hub", `N${i}`),
    );
    const vm = makeViewModel(nodes, edges);
    const violations = maxNodeDegree.validate(vm, emptyLayout());
    expect(violations).toHaveLength(1);
    expect(violations[0]!.severity).toBe("warning");
    expect(violations[0]!.metric).toBe(16);
    expect(violations[0]!.message).toContain("hub");
  });
});

// ─── areaCoverage ────────────────────────────────────────────────

describe("areaCoverage", () => {
  it("returns no violations for zero-area layout", () => {
    expect(areaCoverage.validate(makeViewModel([]), emptyLayout())).toEqual([]);
  });

  it("returns no violations for normal coverage (50%)", () => {
    const layout = layoutFromPositions(
      { A: { x: 0, y: 0, width: 100, height: 50 } },
      100,
      100,
    );
    // 5000 / 10000 = 0.5 → normal range
    const violations = areaCoverage.validate(
      makeViewModel([makeNode("A")]),
      layout,
    );
    expect(violations).toEqual([]);
  });

  it("flags sparse diagrams (< 30% coverage)", () => {
    const layout = layoutFromPositions(
      { A: { x: 0, y: 0, width: 10, height: 10 } },
      1000,
      1000,
    );
    // 100 / 1000000 = 0.0001 → very sparse
    const violations = areaCoverage.validate(
      makeViewModel([makeNode("A")]),
      layout,
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]!.severity).toBe("info");
    expect(violations[0]!.correctiveAction.kind).toBe("increase-spacing");
  });

  it("flags dense diagrams (> 85% coverage)", () => {
    const layout = layoutFromPositions(
      {
        A: { x: 0, y: 0, width: 90, height: 100 },
        B: { x: 90, y: 0, width: 10, height: 100 },
      },
      100,
      100,
    );
    // (9000 + 1000) / 10000 = 1.0 → too dense
    const violations = areaCoverage.validate(
      makeViewModel([makeNode("A"), makeNode("B")]),
      layout,
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]!.severity).toBe("warning");
    expect(violations[0]!.threshold).toBe(0.85);
  });
});

// ─── ViewValidator ───────────────────────────────────────────────

describe("ViewValidator", () => {
  it("ships with 5 built-in constraints", () => {
    const validator = new ViewValidator();
    // Validate a trivially valid diagram — no violations
    const vm = makeViewModel([makeNode("A")]);
    expect(validator.validate(vm, emptyLayout())).toEqual([]);
  });

  it("aggregates violations from multiple constraints", () => {
    const validator = new ViewValidator();
    // 51 nodes triggers maxVisibleNodes + hub node triggers maxNodeDegree
    const nodes = [
      makeNode("hub"),
      ...Array.from({ length: 51 }, (_, i) => makeNode(`N${i}`)),
    ];
    const edges = Array.from({ length: 16 }, (_, i) =>
      makeEdge("hub", `N${i}`),
    );
    const vm = makeViewModel(nodes, edges);
    const violations = validator.validate(vm, emptyLayout());
    const names = violations.map((v) => v.constraintName);
    expect(names).toContain("max-visible-nodes");
    expect(names).toContain("max-node-degree");
  });

  it("errors() returns only error-severity violations", () => {
    const validator = new ViewValidator();
    const layout = layoutFromPositions({
      A: { x: 0, y: 0, width: 100, height: 50 },
      B: { x: 50, y: 25, width: 100, height: 50 },
    });
    const vm = makeViewModel([makeNode("A"), makeNode("B")]);
    const errors = validator.errors(vm, layout);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.every((v) => v.severity === "error")).toBe(true);
  });

  it("warnings() returns only warning-severity violations", () => {
    const validator = new ViewValidator();
    const nodes = Array.from({ length: 51 }, (_, i) => makeNode(`N${i}`));
    const vm = makeViewModel(nodes);
    const warnings = validator.warnings(vm, emptyLayout());
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.every((v) => v.severity === "warning")).toBe(true);
  });

  it("supports registering custom constraints", () => {
    const validator = new ViewValidator();
    const custom: ViewConstraint = {
      name: "no-empty-view",
      validate(viewModel, _layout) {
        if (viewModel.nodes.length === 0) {
          return [
            {
              constraintName: "no-empty-view",
              severity: "warning",
              message: "View has no nodes",
              correctiveAction: { kind: "none" },
            },
          ];
        }
        return [];
      },
    };
    validator.register(custom);
    const vm = makeViewModel([]);
    const violations = validator.validate(vm, emptyLayout());
    expect(violations.some((v) => v.constraintName === "no-empty-view")).toBe(
      true,
    );
  });

  it("validatePreLayout runs constraints without layout data", () => {
    const validator = new ViewValidator();
    const nodes = Array.from({ length: 51 }, (_, i) => makeNode(`N${i}`));
    const vm = makeViewModel(nodes);
    const violations = validator.validatePreLayout(vm);
    expect(
      violations.some((v) => v.constraintName === "max-visible-nodes"),
    ).toBe(true);
  });
});

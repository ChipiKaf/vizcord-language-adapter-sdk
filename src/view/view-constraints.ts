import type {
  ViewConstraint,
  ViewConstraintViolation,
  EdgePath,
} from "./view-constraints.types.js";

/** Diagram must not exceed a maximum visible node count. */
export const maxVisibleNodes: ViewConstraint = {
  name: "max-visible-nodes",
  validate(viewModel, _layout) {
    const count = viewModel.nodes.length;
    const threshold = 50;
    if (count > threshold) {
      return [
        {
          constraintName: "max-visible-nodes",
          severity: "warning",
          message: `Diagram has ${count} visible nodes (threshold: ${threshold}). Consider collapsing classes or narrowing scope.`,
          metric: count,
          threshold,
          correctiveAction: { kind: "auto-collapse", threshold },
        },
      ];
    }
    return [];
  },
};

/** No two nodes may visually overlap after layout. */
export const noNodeOverlap: ViewConstraint = {
  name: "no-node-overlap",
  /**
   * @vizcomment-overview Detect pairwise node overlaps in the layout
   */
  validate(_viewModel, layout) {
    const violations: ViewConstraintViolation[] = [];
    /** @vizcomment-step Compare all node position pairs for overlap */
    const entries = [...layout.nodePositions.entries()];

    for (let i = 0; i < entries.length; i++) {
      const [idA, a] = entries[i]!;
      for (let j = i + 1; j < entries.length; j++) {
        const [idB, b] = entries[j]!;
        const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
        const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;
        if (overlapX && overlapY) {
          violations.push({
            constraintName: "no-node-overlap",
            severity: "error",
            message: `Nodes "${idA}" and "${idB}" overlap after layout`,
            correctiveAction: { kind: "increase-spacing", factor: 1.5 },
          });
        }
      }
    }
    return violations;
  },
};

/** Edge crossings must not exceed a threshold. */
export const maxEdgeCrossings: ViewConstraint = {
  name: "max-edge-crossings",
  validate(_viewModel, layout) {
    const crossings = countEdgeCrossings(layout.edgePaths);
    const threshold = 20;
    if (crossings > threshold) {
      return [
        {
          constraintName: "max-edge-crossings",
          severity: "warning",
          message: `Diagram has ${crossings} edge crossings (threshold: ${threshold}). Consider edge bundling or a different layout.`,
          metric: crossings,
          threshold,
          correctiveAction: { kind: "enable-bundling", strength: 0.85 },
        },
      ];
    }
    return [];
  },
};

/** Hub nodes (high degree) should trigger a warning. */
export const maxNodeDegree: ViewConstraint = {
  name: "max-node-degree",
  validate(viewModel, _layout) {
    const degree = new Map<string, number>();
    for (const edge of viewModel.edges) {
      degree.set(edge.sourceId, (degree.get(edge.sourceId) ?? 0) + 1);
      degree.set(edge.targetId, (degree.get(edge.targetId) ?? 0) + 1);
    }
    const violations: ViewConstraintViolation[] = [];
    const threshold = 15;
    for (const [nodeId, count] of degree) {
      if (count > threshold) {
        violations.push({
          constraintName: "max-node-degree",
          severity: "warning",
          message: `Node "${nodeId}" has degree ${count} (threshold: ${threshold}). Consider edge aggregation.`,
          metric: count,
          threshold,
          correctiveAction: { kind: "none" },
        });
      }
    }
    return violations;
  },
};

/** Area coverage should be between 30–85% (not too sparse, not too dense). */
export const areaCoverage: ViewConstraint = {
  name: "area-coverage",
  /**
   * @vizcomment-overview Check that diagram density is within readable bounds
   */
  validate(_viewModel, layout) {
    /** @vizcomment-step Compute total area and node area sum */
    const totalArea = layout.totalWidth * layout.totalHeight;
    if (totalArea === 0) return [];

    let nodeArea = 0;
    for (const pos of layout.nodePositions.values()) {
      nodeArea += pos.width * pos.height;
    }
    const coverage = nodeArea / totalArea;
    const violations: ViewConstraintViolation[] = [];

    /** @vizcomment-step Report sparse or dense coverage violations */
    if (coverage < 0.3) {
      violations.push({
        constraintName: "area-coverage",
        severity: "info",
        message: `Diagram uses only ${(coverage * 100).toFixed(0)}% of available area. Nodes may be too spread out.`,
        metric: coverage,
        threshold: 0.3,
        correctiveAction: { kind: "increase-spacing", factor: 0.7 },
      });
    }
    if (coverage > 0.85) {
      violations.push({
        constraintName: "area-coverage",
        severity: "warning",
        message: `Diagram uses ${(coverage * 100).toFixed(0)}% of available area. Nodes may be too dense.`,
        metric: coverage,
        threshold: 0.85,
        correctiveAction: { kind: "increase-spacing", factor: 1.3 },
      });
    }
    return violations;
  },
};

/**
 * Determine whether two line segments (p1→p2) and (p3→p4) cross.
 * Uses standard 2D orientation-based intersection test.
 */
function segmentsCross(
  p1: EdgePath,
  p2: EdgePath,
  p3: EdgePath,
  p4: EdgePath,
): boolean {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true;
  }

  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;

  return false;
}

function direction(a: EdgePath, b: EdgePath, c: EdgePath): number {
  return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
}

function onSegment(a: EdgePath, b: EdgePath, c: EdgePath): boolean {
  return (
    Math.min(a.x, b.x) <= c.x &&
    c.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= c.y &&
    c.y <= Math.max(a.y, b.y)
  );
}

/**
 * Count segment-segment crossings across all edge paths.
 *
 * @vizcomment-overview Count visual edge crossings for readability analysis
 */
export function countEdgeCrossings(
  edgePaths: ReadonlyMap<string, readonly EdgePath[]>,
): number {
  const pathList = [...edgePaths.values()];
  let crossings = 0;

  for (let i = 0; i < pathList.length; i++) {
    const pathA = pathList[i]!;
    for (let j = i + 1; j < pathList.length; j++) {
      const pathB = pathList[j]!;
      // Check each segment pair
      for (let a = 0; a < pathA.length - 1; a++) {
        for (let b = 0; b < pathB.length - 1; b++) {
          if (
            segmentsCross(pathA[a]!, pathA[a + 1]!, pathB[b]!, pathB[b + 1]!)
          ) {
            crossings++;
          }
        }
      }
    }
  }

  return crossings;
}

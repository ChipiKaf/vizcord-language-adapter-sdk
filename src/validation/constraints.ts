import type { CanonicalId } from "../canonical/brand.js";
import type {
  GraphConstraint,
  ConstraintViolation,
} from "./constraints.types.js";

/**
 * Every edge's sourceId and targetId must reference an existing node.
 */
export const referentialIntegrity: GraphConstraint = {
  name: "referential-integrity",
  /**
   * @vizcomment-overview Verify every edge references existing nodes
   */
  validate(graph) {
    /** @vizcomment-step Index all node IDs */
    const nodeIds = new Set<CanonicalId>(graph.nodes.map((n) => n.id));
    const violations: ConstraintViolation[] = [];

    /** @vizcomment-step Check each edge's source and target exist */
    for (const edge of graph.edges) {
      if (!nodeIds.has(edge.sourceId)) {
        violations.push({
          constraintName: "referential-integrity",
          severity: "error",
          message: `Edge "${edge.id}" references non-existent source node "${edge.sourceId}"`,
          involvedEdges: [edge.id],
        });
      }
      if (!nodeIds.has(edge.targetId)) {
        violations.push({
          constraintName: "referential-integrity",
          severity: "error",
          message: `Edge "${edge.id}" references non-existent target node "${edge.targetId}"`,
          involvedEdges: [edge.id],
        });
      }
    }

    return violations;
  },
};

/**
 * No two nodes may share the same CanonicalId.
 */
export const uniqueNodeIds: GraphConstraint = {
  name: "unique-node-ids",
  validate(graph) {
    const seen = new Map<CanonicalId, number>();
    const violations: ConstraintViolation[] = [];

    for (const node of graph.nodes) {
      const count = (seen.get(node.id) ?? 0) + 1;
      seen.set(node.id, count);
      if (count === 2) {
        violations.push({
          constraintName: "unique-node-ids",
          severity: "error",
          message: `Duplicate node ID: "${node.id}"`,
          involvedNodes: [node.id],
        });
      }
    }

    return violations;
  },
};

/**
 * The containment tree must be acyclic — no node can be a transitive
 * child of itself through containment edges.
 */
export const containmentAcyclicity: GraphConstraint = {
  name: "containment-acyclicity",
  /**
   * @vizcomment-overview Detect cycles in the containment tree using DFS
   */
  validate(graph) {
    /** @vizcomment-step Filter to containment edges only */
    const containmentEdges = graph.edges.filter(
      (e) => e.kind === "containment",
    );

    /** @vizcomment-step Build child-to-parents adjacency list */
    const childToParents = new Map<CanonicalId, CanonicalId[]>();
    for (const edge of containmentEdges) {
      let parents = childToParents.get(edge.targetId);
      if (parents === undefined) {
        parents = [];
        childToParents.set(edge.targetId, parents);
      }
      parents.push(edge.sourceId);
    }

    const violations: ConstraintViolation[] = [];
    const finished = new Set<CanonicalId>();
    const reported = new Set<CanonicalId>();

    /** @vizcomment-step Run DFS from each node to detect back edges */
    function dfs(nodeId: CanonicalId, stack: Set<CanonicalId>): void {
      if (finished.has(nodeId)) return;
      if (stack.has(nodeId)) {
        if (!reported.has(nodeId)) {
          violations.push({
            constraintName: "containment-acyclicity",
            severity: "error",
            message: `Containment cycle detected involving node "${nodeId}"`,
            involvedNodes: [nodeId],
          });
          reported.add(nodeId);
        }
        return;
      }

      stack.add(nodeId);
      const parents = childToParents.get(nodeId);
      if (parents !== undefined) {
        for (const parentId of parents) {
          dfs(parentId, stack);
        }
      }
      stack.delete(nodeId);
      finished.add(nodeId);
    }

    for (const nodeId of childToParents.keys()) {
      dfs(nodeId, new Set());
    }

    return violations;
  },
};

/**
 * Every structural node should have at most one containment parent.
 */
export const singleContainmentParent: GraphConstraint = {
  name: "single-containment-parent",
  validate(graph) {
    const containmentEdges = graph.edges.filter(
      (e) => e.kind === "containment",
    );
    const parentCount = new Map<CanonicalId, number>();
    const violations: ConstraintViolation[] = [];

    for (const edge of containmentEdges) {
      const count = (parentCount.get(edge.targetId) ?? 0) + 1;
      parentCount.set(edge.targetId, count);
      if (count === 2) {
        violations.push({
          constraintName: "single-containment-parent",
          severity: "warning",
          message: `Node "${edge.targetId}" has multiple containment parents`,
          involvedNodes: [edge.targetId],
        });
      }
    }

    return violations;
  },
};

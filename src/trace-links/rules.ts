import type { CanonicalNode, CanonicalNodeKind } from "../canonical/index.js";
import type { TraceLink } from "./trace-links.types.js";
import type { TraceRule, TraceDiagnostic } from "./rules.types.js";

/**
 * Validate that every canonical node satisfies all applicable trace rules.
 *
 * For each rule, finds all nodes matching `rule.canonicalKind` and checks
 * that at least one trace link with matching `layer` (and `viewType` for
 * view-layer rules) exists for that node.
 *
 * Returns an empty array when all rules are satisfied.
 */
export function validateTraceRules(
  rules: readonly TraceRule[],
  nodes: readonly CanonicalNode[],
  links: readonly TraceLink[],
): TraceDiagnostic[] {
  // Build link index — view links get both a broad and a viewType-specific key
  const linkIndex = new Set<string>();
  for (const link of links) {
    if (link.layer === "view") {
      linkIndex.add(`${link.canonicalId}::view`);
      linkIndex.add(`${link.canonicalId}::view::${link.viewType}`);
    } else {
      linkIndex.add(`${link.canonicalId}::${link.layer}`);
    }
  }

  // Pre-group nodes by kind for O(rules × matching-nodes) instead of O(rules × all-nodes)
  const nodesByKind = new Map<CanonicalNodeKind, CanonicalNode[]>();
  for (const node of nodes) {
    let group = nodesByKind.get(node.kind);
    if (!group) {
      group = [];
      nodesByKind.set(node.kind, group);
    }
    group.push(node);
  }

  const diagnostics: TraceDiagnostic[] = [];

  for (const rule of rules) {
    const matching = nodesByKind.get(rule.canonicalKind);
    if (!matching) continue;

    for (const node of matching) {
      const key =
        rule.layer === "view" && rule.viewType !== undefined
          ? `${node.id}::view::${rule.viewType}`
          : `${node.id}::${rule.layer}`;
      if (!linkIndex.has(key)) {
        diagnostics.push({
          severity: rule.required ? "error" : "warning",
          ruleId: rule.id,
          nodeId: node.id,
          nodeKind: node.kind,
          message: `Node "${node.name}" (${node.kind}) violates trace rule "${rule.id}": ${rule.description}`,
        });
      }
    }
  }

  return diagnostics;
}

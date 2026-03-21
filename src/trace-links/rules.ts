import type { CanonicalNode, CanonicalNodeKind } from "../canonical/index.js";
import type { TraceLink } from "./trace-links.types.js";
import type { TraceRule, TraceDiagnostic } from "./rules.types.js";

/**
 * Validate that every canonical node satisfies all applicable trace rules.
 *
 * @vizcomment-overview Check that every node has required trace links per its rules
 */
export function validateTraceRules(
  rules: readonly TraceRule[],
  nodes: readonly CanonicalNode[],
  links: readonly TraceLink[],
): TraceDiagnostic[] {
  /** @vizcomment-step Build a link index keyed by canonicalId + layer */
  const linkIndex = new Set<string>();
  for (const link of links) {
    if (link.layer === "view") {
      linkIndex.add(`${link.canonicalId}::view`);
      linkIndex.add(`${link.canonicalId}::view::${link.viewType}`);
    } else {
      linkIndex.add(`${link.canonicalId}::${link.layer}`);
    }
  }

  /** @vizcomment-step Group nodes by kind for efficient rule matching */
  const nodesByKind = new Map<CanonicalNodeKind, CanonicalNode[]>();
  for (const node of nodes) {
    let group = nodesByKind.get(node.kind);
    if (!group) {
      group = [];
      nodesByKind.set(node.kind, group);
    }
    group.push(node);
  }

  /** @vizcomment-step Check each rule against matching nodes */
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

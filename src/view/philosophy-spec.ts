/**
 * Diagram Philosophy Rule Registry and Specification Generator.
 *
 * This module is the single source of truth for every rule in the
 * diagram philosophy. Each rule is a typed {@link PhilosophyRule}
 * with a unique ID, enforcement mechanism, and implementation
 * reference. The markdown spec and conformance tests derive from
 * this registry.
 */

import type {
  PhilosophyRule,
  RuleCategory,
  CategoryMeta,
} from "./philosophy-spec.types.js";

// ── Category display order for markdown generation ──────────────

/** @vizcomment-overview Ordered category metadata for spec rendering */
const CATEGORY_ORDER: readonly CategoryMeta[] = [
  { key: "notation", heading: "Notation Rules" },
  { key: "layout", heading: "Layout Rules" },
  { key: "readability", heading: "Readability Rules" },
  { key: "progressive", heading: "Progressive Disclosure Rules" },
  { key: "interaction", heading: "Interaction Rules" },
  { key: "accessibility", heading: "Accessibility Rules" },
];

// ── Rule Registry ───────────────────────────────────────────────

/**
 * Complete diagram philosophy rule registry.
 *
 * Every rendering, layout, interaction, and accessibility rule is
 * captured here with a unique prefixed ID (N=notation, L=layout,
 * R=readability, P=progressive, I=interaction, A=accessibility).
 */
export const PHILOSOPHY_RULES: readonly PhilosophyRule[] = [
  // ── Notation Rules ──────────────────────────────────────────
  {
    id: "N-01",
    name: "Class shape",
    category: "notation",
    description:
      "Classes are rendered as rectangles with UML-style compartments (name/attributes/methods).",
    enforcement: "notation-standard",
    implementedBy: "defaultNotation.nodes.class",
    testedBy: "notation-conformance.test.ts → classes use rect shape",
    workItem: "06.3",
    status: "planned",
  },
  {
    id: "N-02",
    name: "Interface stereotype",
    category: "notation",
    description:
      "Interfaces display «interface» stereotype label and use dashed inheritance arrows.",
    enforcement: "notation-standard",
    implementedBy:
      "defaultNotation.nodes.interface + defaultNotation.edges.implements",
    testedBy:
      "notation-conformance.test.ts → interfaces have «interface» stereotype",
    workItem: "06.3",
    status: "planned",
  },
  {
    id: "N-03",
    name: "Node kind icons",
    category: "notation",
    description:
      "Every node kind has a distinctive icon glyph (C, I, ƒ, ≡, etc.) rendered in the top-left corner.",
    enforcement: "notation-standard",
    implementedBy: "defaultNotation.nodes[*].icon",
    testedBy: "notation-conformance.test.ts → every node kind has icon",
    workItem: "06.7",
    status: "planned",
  },
  {
    id: "N-04",
    name: "Edge kind visual distinction",
    category: "notation",
    description:
      "Each edge kind uses a unique combination of line style (solid/dashed/dotted) and arrowhead (triangle/diamond/vee) so edges are distinguishable without labels.",
    enforcement: "notation-standard",
    implementedBy: "defaultNotation.edges[*]",
    testedBy: "notation-conformance.test.ts → edge visual distinction",
    workItem: "06.3",
    status: "planned",
  },
  {
    id: "N-05",
    name: "Containment diamond",
    category: "notation",
    description:
      "Containment edges use a filled diamond arrowhead (UML composition notation).",
    enforcement: "notation-standard",
    implementedBy: "defaultNotation.edges.containment",
    testedBy: "notation-conformance.test.ts → containment uses diamond",
    workItem: "06.3",
    status: "planned",
  },
  {
    id: "N-06",
    name: "Notation exhaustiveness",
    category: "notation",
    description:
      "The NotationStandard type uses Record<CanonicalNodeKind, NodeNotation> so adding a new kind without a visual mapping is a compile error.",
    enforcement: "type-system",
    implementedBy: "NotationStandard type definition",
    testedBy: "notation-conformance.test.ts → completeness",
    workItem: "06.3",
    status: "planned",
  },

  // ── Layout Rules ────────────────────────────────────────────
  {
    id: "L-01",
    name: "Hierarchical default",
    category: "layout",
    description:
      "The default layout for class/module diagrams is hierarchical (top-to-bottom Sugiyama) with inheritance flowing upward.",
    enforcement: "configuration",
    implementedBy: "defaultViewDef.layout === 'hierarchical'",
    workItem: "06.6",
    status: "planned",
  },
  {
    id: "L-02",
    name: "Direction passthrough",
    category: "layout",
    description:
      "ViewDefinition.style.direction is passed through to the layout engine (dagre rankdir, ELK direction).",
    enforcement: "runtime-constraint",
    implementedBy: "layout.ts → rankdir mapping",
    workItem: "06.6",
    status: "planned",
  },
  {
    id: "L-03",
    name: "Crossing minimisation",
    category: "layout",
    description:
      "The layout engine applies crossing minimisation (barycentric/median heuristic) to reduce visual clutter.",
    enforcement: "runtime-constraint",
    implementedBy: "layout algorithm configuration",
    testedBy: "view-constraints-conformance.test.ts → maxEdgeCrossings",
    workItem: "06.6",
    status: "planned",
  },
  {
    id: "L-04",
    name: "Containment as nesting",
    category: "layout",
    description:
      "Containment edges are rendered as spatial nesting (child inside parent) rather than as arrows, when display mode is 'nested' or 'compartments'.",
    enforcement: "notation-standard",
    implementedBy: "ContainmentDisplay type + scene builder",
    workItem: "06.4",
    status: "planned",
  },
  {
    id: "L-05",
    name: "Uniform spacing",
    category: "layout",
    description:
      "Node spacing and rank spacing follow Gestalt principles: uniform gaps within groups, larger gaps between groups.",
    enforcement: "runtime-constraint",
    implementedBy: "areaCoverage constraint + layout parameters",
    testedBy: "view-constraints-conformance.test.ts → areaCoverage",
    workItem: "06.1",
    status: "planned",
  },

  // ── Readability Rules ───────────────────────────────────────
  {
    id: "R-01",
    name: "Maximum visible nodes",
    category: "readability",
    description:
      "A single diagram view should not display more than 50 fully-expanded nodes. Beyond this threshold, auto-collapse or scope narrowing is suggested.",
    enforcement: "runtime-constraint",
    implementedBy: "maxVisibleNodes ViewConstraint",
    testedBy: "view-constraints-conformance.test.ts → maxVisibleNodes",
    workItem: "06.5",
    status: "planned",
  },
  {
    id: "R-02",
    name: "No node overlap",
    category: "readability",
    description:
      "After layout, no two nodes may visually overlap. The system re-layouts with increased spacing if overlap is detected.",
    enforcement: "runtime-constraint",
    implementedBy: "noNodeOverlap ViewConstraint",
    testedBy: "view-constraints-conformance.test.ts → noNodeOverlap",
    workItem: "06.5",
    status: "planned",
  },
  {
    id: "R-03",
    name: "Edge crossing threshold",
    category: "readability",
    description:
      "Diagrams with more than 20 edge crossings trigger a suggestion to enable edge bundling or switch layout algorithm.",
    enforcement: "runtime-constraint",
    implementedBy: "maxEdgeCrossings ViewConstraint",
    testedBy: "view-constraints-conformance.test.ts → maxEdgeCrossings",
    workItem: "06.5",
    status: "planned",
  },
  {
    id: "R-04",
    name: "Hub degree threshold",
    category: "readability",
    description:
      "Nodes with degree > 15 trigger a warning suggesting edge aggregation or scope narrowing.",
    enforcement: "runtime-constraint",
    implementedBy: "maxNodeDegree ViewConstraint",
    testedBy: "view-constraints-conformance.test.ts → maxNodeDegree",
    workItem: "06.5",
    status: "planned",
  },
  {
    id: "R-05",
    name: "Area coverage bounds",
    category: "readability",
    description:
      "Diagram area coverage should be between 30–85%. Too sparse wastes space; too dense is unreadable.",
    enforcement: "runtime-constraint",
    implementedBy: "areaCoverage ViewConstraint",
    testedBy: "view-constraints-conformance.test.ts → areaCoverage",
    workItem: "06.5",
    status: "planned",
  },

  // ── Progressive Disclosure Rules ────────────────────────────
  {
    id: "P-01",
    name: "Auto-collapse on oversize",
    category: "progressive",
    description:
      "When visible node count exceeds the threshold, composite nodes (classes, modules) auto-collapse to show only their header.",
    enforcement: "runtime-constraint",
    implementedBy: "maxVisibleNodes corrective action",
    workItem: "06.9",
    status: "planned",
  },
  {
    id: "P-02",
    name: "Expand on interaction",
    category: "progressive",
    description:
      "Collapsed nodes expand on double-click, revealing their members. Hover shows a brief preview.",
    enforcement: "convention",
    implementedBy: "scene event handlers",
    workItem: "06.9",
    status: "planned",
  },
  {
    id: "P-03",
    name: "Neighbourhood highlighting",
    category: "progressive",
    description:
      "Selecting a node highlights its 1-hop neighbourhood and fades non-connected nodes to 20% opacity.",
    enforcement: "convention",
    implementedBy: "scene selection handler",
    workItem: "06.9",
    status: "planned",
  },

  // ── Interaction Rules ───────────────────────────────────────
  {
    id: "I-01",
    name: "Edge type filtering",
    category: "interaction",
    description:
      "Users can toggle edge types on/off via a filter panel. Filtered edges are hidden via CSS (no re-layout).",
    enforcement: "convention",
    implementedBy: "filter panel + CSS classes",
    workItem: "06.10",
    status: "planned",
  },
  {
    id: "I-02",
    name: "Path queries",
    category: "interaction",
    description:
      "Users can select two nodes and find all paths between them (BFS/DFS), highlighted in the diagram.",
    enforcement: "convention",
    implementedBy: "path query engine",
    workItem: "06.10",
    status: "planned",
  },
  {
    id: "I-03",
    name: "Coordinated views",
    category: "interaction",
    description:
      "Multiple diagram panels share selection state via canonical IDs. Selecting a node in one panel highlights it in others.",
    enforcement: "convention",
    implementedBy: "selection broadcast via CanonicalId",
    workItem: "06.11",
    status: "planned",
  },

  // ── Accessibility Rules ─────────────────────────────────────
  {
    id: "A-01",
    name: "Color-role theming",
    category: "accessibility",
    description:
      "Colors are assigned via semantic color roles, not hardcoded values. Themes can be swapped without changing the notation standard.",
    enforcement: "notation-standard",
    implementedBy: "NodeNotation.colorRole + theme resolver",
    workItem: "06.1",
    status: "planned",
  },
  {
    id: "A-02",
    name: "Shape + color redundancy",
    category: "accessibility",
    description:
      "Node kinds are distinguishable by shape alone (not just color), supporting colour-blind users.",
    enforcement: "conformance-test",
    implementedBy: "defaultNotation shape uniqueness per kind",
    testedBy: "notation-conformance.test.ts → shape distinction",
    workItem: "06.3",
    status: "planned",
  },
];

// ── Lookup helpers ──────────────────────────────────────────────

/**
 * @vizcomment-overview Find a rule by its unique ID
 */
export function getRuleById(id: string): PhilosophyRule | undefined {
  /** @vizcomment-step Search the registry for a matching ID */
  return PHILOSOPHY_RULES.find((r) => r.id === id);
}

/**
 * @vizcomment-overview Filter rules by category
 */
export function getRulesByCategory(
  category: RuleCategory,
): readonly PhilosophyRule[] {
  /** @vizcomment-step Return all rules matching the given category */
  return PHILOSOPHY_RULES.filter((r) => r.category === category);
}

/**
 * @vizcomment-overview Filter rules by implementation status
 */
export function getRulesByStatus(
  status: PhilosophyRule["status"],
): readonly PhilosophyRule[] {
  /** @vizcomment-step Return all rules matching the given status */
  return PHILOSOPHY_RULES.filter((r) => r.status === status);
}

// ── Markdown generation ─────────────────────────────────────────

/**
 * @vizcomment-overview Build a markdown table row for a single rule
 */
function formatRuleRow(rule: PhilosophyRule): string {
  /** @vizcomment-step Compose the pipe-delimited columns */
  return `| ${rule.id} | ${rule.name} | ${rule.description} | ${rule.enforcement} | \`${rule.implementedBy}\` | ${rule.status} |`;
}

/**
 * @vizcomment-overview Render all rules within one category as a markdown section
 */
function renderCategorySection(
  meta: CategoryMeta,
  rules: readonly PhilosophyRule[],
): string {
  /** @vizcomment-step Filter rules belonging to this category */
  const matching = rules.filter((r) => r.category === meta.key);

  /** @vizcomment-collapse-start If no rules exist for this category */
  if (matching.length === 0) {
    /** @vizcomment-step Return empty string to skip the section */
    return "";
  }
  /** @vizcomment-collapse-end */

  /** @vizcomment-step Build the section header and table header */
  const header = `## ${meta.heading}`;
  const tableHeader = [
    "| ID | Rule | Description | Enforcement | Implemented By | Status |",
    "| -- | ---- | ----------- | ----------- | -------------- | ------ |",
  ].join("\n");

  /** @vizcomment-step Generate a row for each rule in the category */
  const rows = matching.map(formatRuleRow).join("\n");

  return `${header}\n\n${tableHeader}\n${rows}`;
}

/**
 * @vizcomment-overview Generate the full markdown specification from the rule registry
 *
 * Produces a human-readable specification document grouped by category,
 * with tables listing every rule's ID, name, enforcement mechanism,
 * implementing artifact, and current status.
 */
export function generateSpecMarkdown(rules: readonly PhilosophyRule[]): string {
  /** @vizcomment-step Compose the document preamble */
  const preamble = [
    "# Vizcord Diagram Philosophy — Specification",
    "",
    "> This document is the single source of truth for all diagram rendering rules.",
    "> Every rule has a unique ID, an enforcement mechanism, and a reference to",
    "> the implementing code artifact.",
    ">",
    "> **Do not edit this file manually.** It is generated from the TypeScript",
    "> rule registry in `packages/language-adapter-sdk/src/view/philosophy-spec.ts`.",
  ].join("\n");

  /** @vizcomment-step Render each category section in display order */
  const sections = CATEGORY_ORDER.map((meta) =>
    renderCategorySection(meta, rules),
  ).filter((s) => s.length > 0);

  /** @vizcomment-step Join preamble and sections with blank line separators */
  return `${preamble}\n\n${sections.join("\n\n")}\n`;
}

// ── Markdown parsing (for spec-drift detection) ─────────────────

/** Minimal parsed rule extracted from the markdown spec. */
export interface ParsedMarkdownRule {
  readonly id: string;
  readonly name: string;
  readonly status: string;
}

/**
 * @vizcomment-overview Parse rule IDs and names from a markdown specification document
 *
 * Reads the markdown line by line, identifies table rows (lines
 * starting with `|` that are not header/separator rows), and
 * extracts the ID, name, and status columns.
 */
export function parseSpecMarkdown(
  markdownContent: string,
): readonly ParsedMarkdownRule[] {
  /** @vizcomment-step Split the content into lines */
  const lines = markdownContent.split("\n");

  /** @vizcomment-step Collect parsed rules from table rows */
  const parsed: ParsedMarkdownRule[] = [];

  /** @vizcomment-collapse-start Process each line looking for table data rows */
  for (const line of lines) {
    /** @vizcomment-step Skip non-table lines and header/separator rows */
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    if (trimmed.startsWith("| --") || trimmed.startsWith("| ID")) continue;

    /** @vizcomment-step Split into columns and extract ID, name, status */
    const columns = trimmed
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    /** @vizcomment-collapse-start If we have enough columns for a valid rule row */
    const id = columns[0];
    const name = columns[1];
    const status = columns[5];
    if (id !== undefined && name !== undefined && status !== undefined) {
      /** @vizcomment-step Push the parsed rule with id, name, and status */
      parsed.push({ id, name, status });
    }
    /** @vizcomment-collapse-end */
  }
  /** @vizcomment-collapse-end */

  return parsed;
}

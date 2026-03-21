import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PHILOSOPHY_RULES,
  getRuleById,
  getRulesByCategory,
  getRulesByStatus,
  generateSpecMarkdown,
  parseSpecMarkdown,
} from "../index.js";
import type {
  PhilosophyRule,
  RuleCategory,
  EnforcementMechanism,
  RuleStatus,
} from "../index.js";

// ── Valid enum values for structural assertions ─────────────────

const VALID_CATEGORIES: readonly RuleCategory[] = [
  "notation",
  "layout",
  "readability",
  "interaction",
  "progressive",
  "accessibility",
];

const VALID_ENFORCEMENT: readonly EnforcementMechanism[] = [
  "type-system",
  "runtime-constraint",
  "notation-standard",
  "conformance-test",
  "convention",
  "configuration",
];

const VALID_STATUSES: readonly RuleStatus[] = [
  "planned",
  "implemented",
  "verified",
];

// ── Rule registry structural tests ─────────────────────────────

describe("PHILOSOPHY_RULES", () => {
  it("contains at least one rule", () => {
    expect(PHILOSOPHY_RULES.length).toBeGreaterThan(0);
  });

  it("every rule has a unique ID", () => {
    const ids = PHILOSOPHY_RULES.map((r) => r.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every rule ID uses a valid category prefix", () => {
    const prefixMap: Record<string, RuleCategory> = {
      N: "notation",
      L: "layout",
      R: "readability",
      P: "progressive",
      I: "interaction",
      A: "accessibility",
    };

    for (const rule of PHILOSOPHY_RULES) {
      const prefix = rule.id.split("-")[0];
      expect(prefixMap).toHaveProperty(prefix);
      expect(rule.category).toBe(prefixMap[prefix]);
    }
  });

  it("every rule has a valid category", () => {
    for (const rule of PHILOSOPHY_RULES) {
      expect(VALID_CATEGORIES).toContain(rule.category);
    }
  });

  it("every rule has a valid enforcement mechanism", () => {
    for (const rule of PHILOSOPHY_RULES) {
      expect(VALID_ENFORCEMENT).toContain(rule.enforcement);
    }
  });

  it("every rule has a valid status", () => {
    for (const rule of PHILOSOPHY_RULES) {
      expect(VALID_STATUSES).toContain(rule.status);
    }
  });

  it("every rule has non-empty required fields", () => {
    for (const rule of PHILOSOPHY_RULES) {
      expect(rule.id.length).toBeGreaterThan(0);
      expect(rule.name.length).toBeGreaterThan(0);
      expect(rule.description.length).toBeGreaterThan(0);
      expect(rule.implementedBy.length).toBeGreaterThan(0);
      expect(rule.workItem.length).toBeGreaterThan(0);
    }
  });

  it("every rule with testedBy has a non-empty reference", () => {
    for (const rule of PHILOSOPHY_RULES) {
      if ("testedBy" in rule && rule.testedBy !== undefined) {
        expect(rule.testedBy.length).toBeGreaterThan(0);
      }
    }
  });
});

// ── Lookup helper tests ─────────────────────────────────────────

describe("getRuleById", () => {
  it("returns the correct rule for a known ID", () => {
    const rule = getRuleById("N-01");
    expect(rule).toBeDefined();
    expect(rule!.name).toBe("Class shape");
  });

  it("returns undefined for an unknown ID", () => {
    expect(getRuleById("Z-99")).toBeUndefined();
  });
});

describe("getRulesByCategory", () => {
  it("returns only rules matching the given category", () => {
    const notation = getRulesByCategory("notation");
    expect(notation.length).toBeGreaterThan(0);
    for (const rule of notation) {
      expect(rule.category).toBe("notation");
    }
  });

  it("returns empty array for a category with no rules if none exist", () => {
    // All categories have rules in the initial registry, so verify count
    for (const cat of VALID_CATEGORIES) {
      const rules = getRulesByCategory(cat);
      expect(rules.length).toBeGreaterThan(0);
    }
  });
});

describe("getRulesByStatus", () => {
  it("returns only rules matching the given status", () => {
    const planned = getRulesByStatus("planned");
    expect(planned.length).toBeGreaterThan(0);
    for (const rule of planned) {
      expect(rule.status).toBe("planned");
    }
  });

  it("returns empty array for a status with no matching rules", () => {
    // All rules are currently "planned"
    const verified = getRulesByStatus("verified");
    expect(verified).toEqual([]);
  });
});

// ── Markdown generation tests ───────────────────────────────────

describe("generateSpecMarkdown", () => {
  it("produces a string starting with the spec title", () => {
    const md = generateSpecMarkdown(PHILOSOPHY_RULES);
    expect(md).toContain("# Vizcord Diagram Philosophy — Specification");
  });

  it("includes all category headings", () => {
    const md = generateSpecMarkdown(PHILOSOPHY_RULES);
    expect(md).toContain("## Notation Rules");
    expect(md).toContain("## Layout Rules");
    expect(md).toContain("## Readability Rules");
    expect(md).toContain("## Progressive Disclosure Rules");
    expect(md).toContain("## Interaction Rules");
    expect(md).toContain("## Accessibility Rules");
  });

  it("includes every rule ID in the output", () => {
    const md = generateSpecMarkdown(PHILOSOPHY_RULES);
    for (const rule of PHILOSOPHY_RULES) {
      expect(md).toContain(`| ${rule.id} |`);
    }
  });

  it("skips categories with no rules", () => {
    const subset: PhilosophyRule[] = [
      {
        id: "N-99",
        name: "Test rule",
        category: "notation",
        description: "A test rule.",
        enforcement: "convention",
        implementedBy: "test",
        workItem: "00.0",
        status: "planned",
      },
    ];
    const md = generateSpecMarkdown(subset);
    expect(md).toContain("## Notation Rules");
    expect(md).not.toContain("## Layout Rules");
    expect(md).not.toContain("## Readability Rules");
  });
});

// ── Markdown parsing tests ──────────────────────────────────────

describe("parseSpecMarkdown", () => {
  it("round-trips: generated markdown parses back to the same rule IDs", () => {
    const md = generateSpecMarkdown(PHILOSOPHY_RULES);
    const parsed = parseSpecMarkdown(md);

    const tsIds = PHILOSOPHY_RULES.map((r) => r.id).sort();
    const mdIds = parsed.map((r) => r.id).sort();

    expect(mdIds).toEqual(tsIds);
  });

  it("extracts rule names correctly", () => {
    const md = generateSpecMarkdown(PHILOSOPHY_RULES);
    const parsed = parseSpecMarkdown(md);

    const n01 = parsed.find((r) => r.id === "N-01");
    expect(n01).toBeDefined();
    expect(n01!.name).toBe("Class shape");
  });

  it("returns empty array for markdown with no tables", () => {
    const result = parseSpecMarkdown("# Title\n\nSome text\n");
    expect(result).toEqual([]);
  });
});

// ── Spec drift detection ────────────────────────────────────────

describe("Philosophy Spec Sync", () => {
  const specPath = resolve(
    import.meta.dirname,
    "../../../../docs/diagram-philosophy.md",
  );

  let markdownContent: string;
  try {
    markdownContent = readFileSync(specPath, "utf-8");
  } catch {
    markdownContent = "";
  }

  it("markdown spec file exists", () => {
    expect(markdownContent.length).toBeGreaterThan(0);
  });

  it("every TypeScript rule appears in the markdown spec", () => {
    if (markdownContent.length === 0) return;
    const mdRules = parseSpecMarkdown(markdownContent);
    for (const rule of PHILOSOPHY_RULES) {
      const found = mdRules.some((m) => m.id === rule.id);
      expect(
        found,
        `Rule ${rule.id} (${rule.name}) missing from markdown spec`,
      ).toBe(true);
    }
  });

  it("every markdown rule appears in the TypeScript registry", () => {
    if (markdownContent.length === 0) return;
    const mdRules = parseSpecMarkdown(markdownContent);
    for (const mdRule of mdRules) {
      const found = PHILOSOPHY_RULES.some((t) => t.id === mdRule.id);
      expect(
        found,
        `Rule ${mdRule.id} (${mdRule.name}) in markdown but not in TS registry`,
      ).toBe(true);
    }
  });
});

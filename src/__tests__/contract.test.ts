import { describe, it, expect } from "vitest";
import type {
  ExtractionDiagnostic,
  ExtractionDiagnosticCode,
  DiagnosticSeverity,
  AdapterDiagnostic,
  ParseResult,
  DiffResult,
  NodeCompleteness,
  CanonicalNodeBase,
  CanonicalId,
  SourceRange,
} from "../index.js";

function cid(s: string): CanonicalId {
  return s as CanonicalId;
}

describe("ExtractionDiagnostic", () => {
  it("accepts all valid diagnostic codes", () => {
    const codes: ExtractionDiagnosticCode[] = [
      "parse-error",
      "unresolved-type",
      "unresolved-symbol",
      "missing-dependency",
      "partial-extraction",
      "circular-dependency",
      "unsupported-syntax",
    ];
    expect(codes).toHaveLength(7);
  });

  it("accepts all severity levels", () => {
    const severities: DiagnosticSeverity[] = ["error", "warning", "info"];
    expect(severities).toHaveLength(3);
  });

  it("can be constructed with required fields", () => {
    const diag: ExtractionDiagnostic = {
      severity: "error",
      file: "src/bad.ts",
      code: "parse-error",
      message: "Unexpected token",
    };
    expect(diag.severity).toBe("error");
    expect(diag.file).toBe("src/bad.ts");
    expect(diag.code).toBe("parse-error");
    expect(diag.message).toBe("Unexpected token");
    expect(diag.range).toBeUndefined();
  });

  it("can include an optional SourceRange", () => {
    const range: SourceRange = {
      file: "src/bad.ts",
      startLine: 5,
      startColumn: 10,
      endLine: 5,
      endColumn: 15,
    };
    const diag: ExtractionDiagnostic = {
      severity: "warning",
      file: "src/bad.ts",
      range,
      code: "unresolved-type",
      message: "Cannot resolve type 'Foo'",
    };
    expect(diag.range).toEqual(range);
  });

  it("AdapterDiagnostic is an alias for ExtractionDiagnostic", () => {
    const diag: AdapterDiagnostic = {
      severity: "info",
      file: "src/a.ts",
      code: "unsupported-syntax",
      message: "Decorators not yet supported",
    };
    // AdapterDiagnostic should satisfy ExtractionDiagnostic
    const extraction: ExtractionDiagnostic = diag;
    expect(extraction.code).toBe("unsupported-syntax");
  });
});

describe("NodeCompleteness", () => {
  it("accepts all valid completeness values", () => {
    const values: NodeCompleteness[] = ["complete", "partial", "stub"];
    expect(values).toHaveLength(3);
  });

  it("is optional on CanonicalNodeBase", () => {
    const node: CanonicalNodeBase = {
      id: cid("class:a:A"),
      name: "A",
      language: "typescript",
    };
    // completeness is optional and defaults to undefined
    expect(node.completeness).toBeUndefined();
  });

  it("can be set on CanonicalNodeBase", () => {
    const node: CanonicalNodeBase = {
      id: cid("class:a:A"),
      name: "A",
      language: "typescript",
      completeness: "partial",
    };
    expect(node.completeness).toBe("partial");
  });
});

describe("ParseResult diagnostics field", () => {
  it("accepts ExtractionDiagnostic array", () => {
    const result: ParseResult = {
      graph: { nodes: [], edges: [] },
      traceLinks: [],
      diagnostics: [
        {
          severity: "error",
          file: "src/bad.ts",
          code: "parse-error",
          message: "Syntax error",
        },
      ],
    };
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]!.code).toBe("parse-error");
  });
});

describe("DiffResult diagnostics field", () => {
  it("accepts ExtractionDiagnostic array", () => {
    const result: DiffResult = {
      delta: {
        addedNodes: [],
        removedNodeIds: [],
        updatedNodes: [],
        addedEdges: [],
        removedEdgeIds: [],
      },
      traceLinks: [],
      diagnostics: [
        {
          severity: "warning",
          file: "src/changed.ts",
          code: "partial-extraction",
          message: "Some constructs could not be extracted",
        },
      ],
    };
    expect(result.diagnostics).toHaveLength(1);
  });
});

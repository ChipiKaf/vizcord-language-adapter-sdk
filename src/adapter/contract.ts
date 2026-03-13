// ---------------------------------------------------------------------------
// Adapter Contract – the interface every language adapter must implement
// ---------------------------------------------------------------------------

import type { CanonicalGraph, CanonicalDelta } from "../canonical/index.js";
import type { TraceLink } from "../trace-links/index.js";
import type { AdapterInfo } from "./capability.js";

/** A text edit to apply to a source file */
export interface SourceEdit {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  newText: string;
}

/** A canonical-level edit operation (e.g. rename, add parameter) */
export interface CanonicalEdit {
  type:
    | "rename"
    | "addParameter"
    | "removeParameter"
    | "addMethod"
    | "removeMethod"
    | "addField"
    | "removeField"
    | "addClass"
    | "addImport"
    | "changeType"
    | "moveNode";
  targetId: string;
  payload: Record<string, unknown>;
}

/**
 * The contract every language adapter must implement.
 *
 * Adapters bridge a specific programming language into the canonical hub.
 * They parse code, extract canonical entities, produce trace links,
 * detect changes, and optionally apply reverse edits.
 */
export interface LanguageAdapter {
  /** Static information about the adapter */
  readonly info: AdapterInfo;

  /**
   * Parse source files and extract the full canonical graph.
   * @param files Map of file paths to their contents
   */
  parse(files: ReadonlyMap<string, string>): Promise<ParseResult>;

  /**
   * Extract a canonical graph from already-parsed state.
   * Useful when the adapter caches parse results internally.
   */
  extract(): Promise<ParseResult>;

  /**
   * Compute a delta given changed files (incremental update).
   * Only available if the adapter declares `Incremental` capability.
   * @param changedFiles Map of changed file paths to new contents
   */
  diff(changedFiles: ReadonlyMap<string, string>): Promise<DiffResult>;

  /**
   * Return all trace links produced during the last parse/extract.
   */
  trace(): TraceLink[];

  /**
   * Apply a canonical edit back to the source code.
   * Only available if the adapter declares `ReverseEditing` capability.
   * @returns Source edits to apply, or an error description
   */
  applyEdit(edit: CanonicalEdit): Promise<ApplyEditResult>;
}

export interface ParseResult {
  graph: CanonicalGraph;
  traceLinks: TraceLink[];
  diagnostics: AdapterDiagnostic[];
}

export interface DiffResult {
  delta: CanonicalDelta;
  traceLinks: TraceLink[];
  diagnostics: AdapterDiagnostic[];
}

export interface ApplyEditResult {
  success: boolean;
  edits: SourceEdit[];
  diagnostics: AdapterDiagnostic[];
}

export interface AdapterDiagnostic {
  severity: "error" | "warning" | "info";
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

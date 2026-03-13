// ---------------------------------------------------------------------------
// Adapter Contract – the interface every language adapter must implement
// ---------------------------------------------------------------------------

import type {
  CanonicalGraph,
  CanonicalDelta,
  CanonicalId,
} from "../canonical/index.js";
import type { TraceLink } from "../trace-links/index.js";
import type { AdapterInfo } from "./capability.js";
import type { Visibility } from "../canonical/structural.js";

/** A text edit to apply to a source file */
export interface SourceEdit {
  readonly file: string;
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
  readonly newText: string;
}

// ---- Discriminated canonical edit operations ------------------------------

export interface RenameEdit {
  readonly type: "rename";
  readonly targetId: CanonicalId;
  readonly newName: string;
}

export interface AddParameterEdit {
  readonly type: "addParameter";
  readonly targetId: CanonicalId;
  readonly parameterName: string;
  readonly parameterType?: string;
  readonly position?: number;
}

export interface RemoveParameterEdit {
  readonly type: "removeParameter";
  readonly targetId: CanonicalId;
  readonly parameterName: string;
}

export interface AddMethodEdit {
  readonly type: "addMethod";
  readonly targetId: CanonicalId;
  readonly methodName: string;
  readonly returnType?: string;
  readonly visibility?: Visibility;
}

export interface RemoveMethodEdit {
  readonly type: "removeMethod";
  readonly targetId: CanonicalId;
}

export interface AddFieldEdit {
  readonly type: "addField";
  readonly targetId: CanonicalId;
  readonly fieldName: string;
  readonly fieldType?: string;
  readonly visibility?: Visibility;
}

export interface RemoveFieldEdit {
  readonly type: "removeField";
  readonly targetId: CanonicalId;
}

export interface AddClassEdit {
  readonly type: "addClass";
  readonly targetId: CanonicalId;
  readonly className: string;
  readonly parentModuleId?: CanonicalId;
}

export interface AddImportEdit {
  readonly type: "addImport";
  readonly targetId: CanonicalId;
  readonly importPath: string;
  readonly importName: string;
}

export interface ChangeTypeEdit {
  readonly type: "changeType";
  readonly targetId: CanonicalId;
  readonly newType: string;
}

export interface MoveNodeEdit {
  readonly type: "moveNode";
  readonly targetId: CanonicalId;
  readonly newParentId: CanonicalId;
}

/** Discriminated union of all edit operations */
export type CanonicalEdit =
  | RenameEdit
  | AddParameterEdit
  | RemoveParameterEdit
  | AddMethodEdit
  | RemoveMethodEdit
  | AddFieldEdit
  | RemoveFieldEdit
  | AddClassEdit
  | AddImportEdit
  | ChangeTypeEdit
  | MoveNodeEdit;

export type CanonicalEditType = CanonicalEdit["type"];

// ---- Adapter diagnostic ---------------------------------------------------

export interface AdapterDiagnostic {
  readonly severity: "error" | "warning" | "info";
  readonly message: string;
  readonly file?: string;
  readonly line?: number;
  readonly column?: number;
}

// ---- Result types (discriminated, not boolean flags) ----------------------

export interface ParseResult {
  readonly graph: CanonicalGraph;
  readonly traceLinks: readonly TraceLink[];
  readonly diagnostics: readonly AdapterDiagnostic[];
}

export interface DiffResult {
  readonly delta: CanonicalDelta;
  readonly traceLinks: readonly TraceLink[];
  readonly diagnostics: readonly AdapterDiagnostic[];
}

/** Structured error for failed edit operations */
export type EditFailureReason =
  | { readonly kind: "unsupportedCapability"; readonly capability: string }
  | { readonly kind: "staleMapping"; readonly targetId: CanonicalId }
  | {
      readonly kind: "ambiguousTarget";
      readonly targetId: CanonicalId;
      readonly candidates: readonly CanonicalId[];
    }
  | { readonly kind: "invalidSemanticState"; readonly detail: string }
  | { readonly kind: "patchConflict"; readonly detail: string };

export type ApplyEditResult =
  | {
      readonly kind: "success";
      readonly edits: readonly SourceEdit[];
      readonly diagnostics: readonly AdapterDiagnostic[];
    }
  | {
      readonly kind: "failure";
      readonly reason: EditFailureReason;
      readonly diagnostics: readonly AdapterDiagnostic[];
    };

// ---- Adapter contract -----------------------------------------------------

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
  trace(): readonly TraceLink[];

  /**
   * Apply a canonical edit back to the source code.
   * Only available if the adapter declares `ReverseEditing` capability.
   */
  applyEdit(edit: CanonicalEdit): Promise<ApplyEditResult>;
}

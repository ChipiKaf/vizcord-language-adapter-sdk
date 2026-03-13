// ---------------------------------------------------------------------------
// Adapter Capability Model
// ---------------------------------------------------------------------------

/** Features a language adapter can declare support for. */
export enum AdapterCapability {
  /** Can extract structural entities (classes, functions, etc.) */
  Structure = "structure",
  /** Can resolve type information */
  Types = "types",
  /** Can resolve cross-file references */
  References = "references",
  /** Supports incremental parsing / updates */
  Incremental = "incremental",
  /** Can apply reverse edits (diagram → code) */
  ReverseEditing = "reverseEditing",
  /** Can extract behavioural (CFG / data-flow) information */
  Behavioural = "behavioural",
}

/** Metadata about a registered adapter */
export interface AdapterInfo {
  /** Unique adapter identifier (e.g. "typescript", "python") */
  readonly id: string;
  /** Human-readable name */
  readonly displayName: string;
  /** Supported file extensions (e.g. [".ts", ".tsx"]) */
  readonly fileExtensions: readonly string[];
  /** Language identifiers (e.g. ["typescript", "typescriptreact"]) */
  readonly languageIds: readonly string[];
  /** Declared capabilities */
  readonly capabilities: readonly AdapterCapability[];
  /** Adapter SDK version this was built against */
  readonly sdkVersion: string;
}

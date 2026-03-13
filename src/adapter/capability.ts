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
  id: string;
  /** Human-readable name */
  displayName: string;
  /** Supported file extensions (e.g. [".ts", ".tsx"]) */
  fileExtensions: string[];
  /** Language identifiers (e.g. ["typescript", "typescriptreact"]) */
  languageIds: string[];
  /** Declared capabilities */
  capabilities: AdapterCapability[];
  /** Adapter SDK version this was built against */
  sdkVersion: string;
}

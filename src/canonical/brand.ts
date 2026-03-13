// ---------------------------------------------------------------------------
// Branded ID types and schema version
// ---------------------------------------------------------------------------

declare const __brand: unique symbol;

/** Construct a branded type: a string that cannot be confused with other IDs */
type Brand<T, B extends string> = T & { readonly [__brand]: B };

// ---- Branded ID types -----------------------------------------------------

/** Stable identifier for a canonical node */
export type CanonicalId = Brand<string, "CanonicalId">;

/** Stable identifier for a canonical edge */
export type EdgeId = Brand<string, "EdgeId">;

/** Identifier for a trace link record */
export type TraceLinkId = Brand<string, "TraceLinkId">;

/** Identifier for a view node */
export type ViewNodeId = Brand<string, "ViewNodeId">;

/** Identifier for a view edge */
export type ViewEdgeId = Brand<string, "ViewEdgeId">;

// ---- Schema versioning ----------------------------------------------------

/**
 * Current version of the canonical IR schema.
 * Increment on breaking changes; prefer additive evolution.
 */
export const CANONICAL_SCHEMA_VERSION = "0.1.0" as const;

export type CanonicalSchemaVersion = typeof CANONICAL_SCHEMA_VERSION;

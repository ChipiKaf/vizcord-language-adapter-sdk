import { describe, it, expect } from "vitest";

/**
 * Import through the top-level barrel to exercise all re-export chains.
 * This ensures barrel index files and runtime values
 * (AdapterCapability enum, CANONICAL_SCHEMA_VERSION const) are covered.
 */
import {
  // Runtime values
  AdapterCapability,
  CANONICAL_SCHEMA_VERSION,
  // Utility functions (already covered, but importing validates barrel)
  makeCanonicalId,
  makeEdgeId,
  makeTraceLinkId,
  makeViewNodeId,
  createSourceTraceLink,
  createViewTraceLink,
  rangeContains,
} from "../index.js";

describe("barrel re-exports", () => {
  it("exports AdapterCapability enum with expected members", () => {
    expect(AdapterCapability.Structure).toBe("structure");
    expect(AdapterCapability.Types).toBe("types");
    expect(AdapterCapability.References).toBe("references");
    expect(AdapterCapability.Incremental).toBe("incremental");
    expect(AdapterCapability.ReverseEditing).toBe("reverseEditing");
    expect(AdapterCapability.Behavioural).toBe("behavioural");
  });

  it("exports CANONICAL_SCHEMA_VERSION", () => {
    expect(CANONICAL_SCHEMA_VERSION).toBe("0.1.0");
  });

  it("exports utility functions", () => {
    expect(typeof makeCanonicalId).toBe("function");
    expect(typeof makeEdgeId).toBe("function");
    expect(typeof makeTraceLinkId).toBe("function");
    expect(typeof makeViewNodeId).toBe("function");
    expect(typeof createSourceTraceLink).toBe("function");
    expect(typeof createViewTraceLink).toBe("function");
    expect(typeof rangeContains).toBe("function");
  });
});

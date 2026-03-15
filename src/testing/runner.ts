import { describe, it, expect } from "vitest";
import type { LanguageAdapter } from "../adapter/contract.types.js";
import type { CanonicalId } from "../canonical/index.js";
import type { SourceTraceLink } from "../trace-links/index.js";
import { AdapterCapability } from "../adapter/capability.js";
import type { ExpectedGraph } from "./conformance.types.js";
import { assertGraphShape, assertTraceLinkCoverage } from "./assertions.js";

/** A loaded conformance fixture ready for testing. */
export interface LoadedFixture {
  readonly name: string;
  readonly inputFiles: ReadonlyMap<string, string>;
  readonly expectedGraph: ExpectedGraph;
}

/** Options for the conformance suite runner. */
export interface ConformanceSuiteOptions {
  /**
   * Capabilities the adapter is expected to declare.
   * A simple test case with `export class Foo {}` is used to probe each.
   */
  readonly expectedCapabilities?: readonly AdapterCapability[];

  /**
   * Capabilities the adapter is expected NOT to declare.
   * `applyEdit` is tested against the first one found to verify clean failure.
   */
  readonly unexpectedCapabilities?: readonly AdapterCapability[];

  /**
   * A simple source snippet used for capability probing.
   * Defaults to `"export class Foo { bar(): void {} }"`.
   */
  readonly probeSource?: string;

  /**
   * File path used for the probe source.
   * Defaults to `"src/probe.ts"`.
   */
  readonly probeFile?: string;
}

/**
 * Run the full conformance test suite for a language adapter.
 *
 * Generates one `describe` block per fixture, plus a capability-validation
 * block. Adapter authors only need to call this with their adapter instance
 * and an array of loaded fixtures.
 *
 * @example
 * ```ts
 * import { runConformanceSuite, loadFixturesFromDir } from "@vizcord/language-adapter-sdk/testing";
 * import { MyAdapter } from "../adapter.js";
 *
 * runConformanceSuite(new MyAdapter(), loadFixturesFromDir(resolve(__dirname, "fixtures/conformance")), {
 *   expectedCapabilities: [AdapterCapability.Structure, AdapterCapability.References],
 *   unexpectedCapabilities: [AdapterCapability.Incremental],
 * });
 * ```
 */
export function runConformanceSuite(
  adapter: LanguageAdapter,
  fixtures: readonly LoadedFixture[],
  options: ConformanceSuiteOptions = {},
): void {
  const probeFile = options.probeFile ?? "src/probe.ts";
  const probeSource =
    options.probeSource ?? "export class Foo { bar(): void {} }";

  describe("Adapter conformance", () => {
    for (const fixture of fixtures) {
      describe(`Fixture: ${fixture.name}`, () => {
        it("parses without error diagnostics", async () => {
          const result = await adapter.parse(fixture.inputFiles);
          const errors = result.diagnostics.filter(
            (d) => d.severity === "error",
          );
          expect(errors).toHaveLength(0);
        });

        it("produces the expected graph shape", async () => {
          const result = await adapter.parse(fixture.inputFiles);
          assertGraphShape(result.graph, fixture.expectedGraph);
        });

        it("has complete trace link coverage", async () => {
          const result = await adapter.parse(fixture.inputFiles);
          assertTraceLinkCoverage(result.graph, result.traceLinks);
        });

        it("assigns unique IDs to all nodes", async () => {
          const result = await adapter.parse(fixture.inputFiles);
          const ids = result.graph.nodes.map((n) => n.id);
          if (ids.length === 0) return;
          expect(new Set(ids).size).toBe(ids.length);
        });

        it("assigns unique IDs to all edges", async () => {
          const result = await adapter.parse(fixture.inputFiles);
          if (result.graph.edges.length === 0) return;
          const ids = result.graph.edges.map((e) => e.id);
          expect(new Set(ids).size).toBe(ids.length);
        });

        it("trace links reference valid canonical IDs", async () => {
          const result = await adapter.parse(fixture.inputFiles);
          const nodeIds = new Set(result.graph.nodes.map((n) => n.id));
          for (const tl of result.traceLinks) {
            const stl = tl as SourceTraceLink;
            expect(
              nodeIds.has(stl.canonicalId),
              `Trace link references unknown node: ${stl.canonicalId}`,
            ).toBe(true);
          }
        });
      });
    }
  });

  if (
    options.expectedCapabilities?.length ||
    options.unexpectedCapabilities?.length
  ) {
    describe("Capability validation", () => {
      const expected = options.expectedCapabilities ?? [];
      const unexpected = options.unexpectedCapabilities ?? [];

      for (const cap of expected) {
        it(`declares ${cap} capability`, () => {
          expect(adapter.info.capabilities).toContain(cap);
        });
      }

      if (expected.some((c) => c === AdapterCapability.Structure)) {
        it("extracts nodes for Structure capability", async () => {
          const result = await adapter.parse(
            new Map([[probeFile, probeSource]]),
          );
          expect(result.graph.nodes.length).toBeGreaterThan(0);
        });
      }

      if (expected.some((c) => c === AdapterCapability.References)) {
        it("extracts edges for References capability", async () => {
          const result = await adapter.parse(
            new Map([[probeFile, probeSource]]),
          );
          expect(result.graph.edges.length).toBeGreaterThan(0);
        });
      }

      for (const cap of unexpected) {
        it(`does not declare unsupported ${cap} capability`, () => {
          expect(adapter.info.capabilities).not.toContain(cap);
        });
      }

      if (unexpected.length > 0) {
        it("applyEdit returns unsupported for undeclared capability", async () => {
          const result = await adapter.applyEdit({
            type: "rename",
            targetId: "test" as CanonicalId,
            newName: "Renamed",
          });
          expect(result.kind).toBe("failure");
          if (result.kind === "failure") {
            expect(result.reason.kind).toBe("unsupportedCapability");
          }
        });
      }
    });
  }
}

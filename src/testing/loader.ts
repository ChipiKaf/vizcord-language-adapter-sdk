import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve } from "path";
import type { ExpectedGraph } from "./conformance.types.js";
import type { LoadedFixture } from "./runner.js";

/**
 * Load conformance fixtures from a directory.
 *
 * @vizcomment-overview Load test fixture files from a directory structure
 *
 * Expects a layout like:
 * ```
 * fixturesDir/
 *   single-class/
 *     input.ts          (or input.py, etc.)
 *     expected-graph.json
 *   inheritance/
 *     input.ts
 *     expected-graph.json
 * ```
 *
 * Each subdirectory becomes one fixture. The input file name determines the
 * virtual file path (e.g. `input.ts` → `src/input.ts`).
 *
 * @param fixturesDir Absolute path to the directory containing fixture folders.
 * @param inputFileName Name of the input file in each fixture folder (default: `"input.ts"`).
 * @param virtualPath Virtual file path for the adapter (default: `"src/input.ts"`).
 */
export function loadFixturesFromDir(
  fixturesDir: string,
  inputFileName = "input.ts",
  virtualPath = "src/input.ts",
): LoadedFixture[] {
  /** @vizcomment-step Enumerate fixture subdirectories */
  const entries = readdirSync(fixturesDir, { withFileTypes: true });
  const fixtures: LoadedFixture[] = [];

  /** @vizcomment-step Read input and expected-graph files for each fixture */
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const inputPath = resolve(fixturesDir, entry.name, inputFileName);
    const expectedPath = resolve(
      fixturesDir,
      entry.name,
      "expected-graph.json",
    );

    if (!existsSync(inputPath) || !existsSync(expectedPath)) continue;

    fixtures.push({
      name: entry.name,
      inputFiles: new Map([[virtualPath, readFileSync(inputPath, "utf-8")]]),
      expectedGraph: JSON.parse(
        readFileSync(expectedPath, "utf-8"),
      ) as ExpectedGraph,
    });
  }

  return fixtures;
}

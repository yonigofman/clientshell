import type { Plugin } from "rollup";
import type { SchemaShape, ManifestOptions } from "@clientshell/core";
import { createManifest } from "@clientshell/core";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface ClientshellRollupOptions extends ManifestOptions {
  /** The schema shape to derive the manifest from. Mutually exclusive with `manifestPath`. */
  schema?: SchemaShape;
  /** Path to a pre-generated clientshell.manifest.json. Mutually exclusive with `schema`. */
  manifestPath?: string;
}

/**
 * Rollup plugin for clientshell.
 *
 * Writes `clientshell.manifest.json` into the build output directory
 * after the bundle is written.
 *
 * Accepts either a `schema` object or a `manifestPath` to a pre-generated manifest.
 */
export function clientshellPlugin(options: ClientshellRollupOptions): Plugin {
  let manifestPromise: Promise<object>;

  if (options.manifestPath) {
    manifestPromise = readFile(resolve(options.manifestPath), "utf-8").then(JSON.parse);
  } else if (options.schema) {
    const { schema, prefix = "", windowObject = "__CLIENT_CONFIG__" } = options;
    manifestPromise = Promise.resolve(createManifest(schema, { prefix, windowObject }));
  } else {
    throw new Error("clientshellPlugin: provide either `schema` or `manifestPath`");
  }

  return {
    name: "clientshell",

    async writeBundle(outputOptions) {
      const manifest = await manifestPromise;
      const outDir = outputOptions.dir ?? "dist";
      await mkdir(outDir, { recursive: true });
      await writeFile(
        join(outDir, "clientshell.manifest.json"),
        JSON.stringify(manifest, null, 2),
        "utf-8",
      );
    },
  };
}

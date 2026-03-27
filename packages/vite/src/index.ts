import type { Plugin } from "vite";
import type { SchemaShape, ManifestOptions } from "@clientshell/core";
import { createManifest } from "@clientshell/core";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export interface ClientshellPluginOptions extends ManifestOptions {
  /** The schema shape to derive the manifest from. */
  schema: SchemaShape;
  /** Dev-mode stub values for local development. */
  devValues?: Record<string, unknown>;
}

/**
 * Vite plugin for clientshell.
 *
 * - **Build**: Writes `clientshell.manifest.json` into the build output.
 * - **Dev**: Serves a stub `env-config.js` from memory so local dev uses
 *   the same `window.__CLIENT_CONFIG__` contract.
 */
export function clientshellPlugin(options: ClientshellPluginOptions): Plugin {
  const {
    schema,
    prefix = "",
    windowObject = "__CLIENT_CONFIG__",
    devValues = {},
  } = options;

  const manifest = createManifest(schema, { prefix, windowObject });

  // Build the dev stub content
  const stubContent = buildStubContent(schema, windowObject, devValues);

  return {
    name: "clientshell",

    // Serve dev stub
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/env-config.js") {
          res.setHeader("Content-Type", "application/javascript");
          res.setHeader("Cache-Control", "no-store");
          res.end(stubContent);
          return;
        }
        next();
      });
    },

    // Write manifest into build output
    async writeBundle(outputOptions) {
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

/**
 * Builds a `window.__CLIENT_CONFIG__` stub JS string for dev mode.
 */
function buildStubContent(
  schema: SchemaShape,
  windowObject: string,
  devValues: Record<string, unknown>,
): string {
  const values: Record<string, unknown> = {};

  for (const [name, descriptor] of Object.entries(schema)) {
    if (name in devValues) {
      values[name] = devValues[name];
    } else if (descriptor.defaultValue !== undefined) {
      values[name] = descriptor.defaultValue;
    }
  }

  return `window.${windowObject} = ${JSON.stringify(values, null, 2)};\n`;
}

import type { Compiler } from "webpack";
import type { SchemaShape, ManifestOptions } from "@clientshell/core";
import { createManifest, buildStubContent } from "@clientshell/core";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface ClientshellWebpackOptions extends ManifestOptions {
  /** The schema shape to derive the manifest from. Mutually exclusive with `manifestPath`. */
  schema?: SchemaShape;
  /** Path to a pre-generated clientshell.manifest.json. Mutually exclusive with `schema`. */
  manifestPath?: string;
  /** Dev-mode stub values for local development. Works with both `schema` and `manifestPath`. */
  devValues?: Record<string, unknown>;
}

interface ManifestJson {
  windowObject?: string;
  fields: Record<string, { kind: string; defaultValue?: unknown }>;
}

/**
 * Build stub content from a manifest JSON + devValues.
 */
function buildStubFromManifest(
  manifest: ManifestJson,
  devValues: Record<string, unknown>,
): string {
  const windowObject = manifest.windowObject ?? "__CLIENT_CONFIG__";
  const values: Record<string, unknown> = {};

  for (const [name, field] of Object.entries(manifest.fields)) {
    if (name in devValues) {
      values[name] = devValues[name];
    } else if (field.defaultValue !== undefined) {
      values[name] = field.defaultValue;
    }
  }

  return `window.${windowObject} = ${JSON.stringify(values, null, 2)};\n`;
}

/**
 * Webpack plugin for clientshell.
 *
 * - **Build**: Writes `clientshell.manifest.json` into the output directory.
 * - **Dev**: Writes a stub `env-config.js` alongside the manifest for development.
 *
 * Accepts either a `schema` object or a `manifestPath` to a pre-generated manifest.
 */
export class ClientshellWebpackPlugin {
  private manifestPromise: Promise<ManifestJson>;
  private devValues: Record<string, unknown>;
  private schemaStubContent: string | null;

  constructor(options: ClientshellWebpackOptions) {
    this.devValues = options.devValues ?? {};

    if (options.manifestPath) {
      this.manifestPromise = readFile(resolve(options.manifestPath), "utf-8").then(JSON.parse);
      this.schemaStubContent = null;
    } else if (options.schema) {
      const {
        schema,
        prefix = "",
        windowObject = "__CLIENT_CONFIG__",
      } = options;
      const manifest = createManifest(schema, { prefix, windowObject });
      this.manifestPromise = Promise.resolve(manifest);
      this.schemaStubContent = buildStubContent(schema, windowObject, this.devValues);
    } else {
      throw new Error("ClientshellWebpackPlugin: provide either `schema` or `manifestPath`");
    }
  }

  apply(compiler: Compiler): void {
    const pluginName = "ClientshellWebpackPlugin";
    const manifestPromise = this.manifestPromise;
    const devValues = this.devValues;
    const schemaStubContent = this.schemaStubContent;
    const isDev = compiler.options.mode === "development";

    compiler.hooks.afterEmit.tapAsync(pluginName, async (_compilation, callback) => {
      try {
        const manifest = await manifestPromise;
        const outputPath = compiler.outputPath ?? "dist";
        await mkdir(outputPath, { recursive: true });

        await writeFile(
          join(outputPath, "clientshell.manifest.json"),
          JSON.stringify(manifest, null, 2),
          "utf-8",
        );

        if (isDev) {
          const stub = schemaStubContent ?? buildStubFromManifest(manifest, devValues);
          await writeFile(
            join(outputPath, "env-config.js"),
            stub,
            "utf-8",
          );
        }

        callback();
      } catch (err) {
        callback(err as Error);
      }
    });
  }
}

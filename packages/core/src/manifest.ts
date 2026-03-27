import type { Manifest, ManifestField, ManifestOptions, SchemaShape } from "./types.js";

/**
 * Generates a JSON manifest from a schema shape.
 *
 * The manifest is the stable contract between the TypeScript schema
 * definition and the Go runtime injector.
 */
export function createManifest(
  schema: SchemaShape,
  options: ManifestOptions = {},
): Manifest {
  const { prefix = "", windowObject = "__CLIENT_CONFIG__" } = options;

  const fields: Record<string, ManifestField> = {};

  for (const [name, descriptor] of Object.entries(schema)) {
    const field: ManifestField = {
      kind: descriptor.kind,
      required: descriptor.required ?? false,
    };

    if (descriptor.defaultValue !== undefined) {
      field.defaultValue = descriptor.defaultValue;
    }

    if (descriptor.description !== undefined) {
      field.description = descriptor.description;
    }

    fields[name] = field;
  }

  return {
    version: 1,
    prefix,
    windowObject,
    fields,
  };
}

/**
 * Builds a `window.__CLIENT_CONFIG__` stub JS string.
 *
 * Used by bundler plugins (Vite, Rollup, Webpack) to serve
 * a dev-mode env-config.js with default/dev values.
 */
export function buildStubContent(
  schema: SchemaShape,
  windowObject: string,
  devValues: Record<string, unknown> = {},
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

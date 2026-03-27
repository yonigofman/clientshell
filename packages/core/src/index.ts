// Types
export type {
  FieldKind,
  FieldDescriptor,
  SchemaShape,
  ManifestField,
  Manifest,
  ManifestOptions,
  InferConfig,
} from "./types.js";

// Schema DSL
export { defineSchema, string, boolean, number, json } from "./schema.js";

// Manifest generation
export { createManifest } from "./manifest.js";

// Runtime reader
export { readEnvFromShape } from "./runtime.js";

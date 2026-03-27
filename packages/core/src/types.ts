// ── Field kinds ──────────────────────────────────────────

/** Supported runtime config value types. */
export type FieldKind = "string" | "boolean" | "number" | "json";

// ── Field descriptor ─────────────────────────────────────

/** Describes a single field in the runtime config schema. */
export interface FieldDescriptor<K extends FieldKind = FieldKind, T = unknown> {
  kind: K;
  required?: boolean;
  defaultValue?: T;
  description?: string;
}

// ── Schema shape ─────────────────────────────────────────

/** A record of named field descriptors that defines the schema. */
export type SchemaShape = Record<string, FieldDescriptor>;

// ── Manifest types ───────────────────────────────────────

export interface ManifestField {
  kind: FieldKind;
  required: boolean;
  defaultValue?: unknown;
  description?: string;
}

export interface Manifest {
  version: 1;
  prefix: string;
  windowObject: string;
  fields: Record<string, ManifestField>;
}

export interface ManifestOptions {
  /** Environment variable prefix, e.g. `"CLIENT_"`. */
  prefix?: string;
  /** Global window key, defaults to `"__CLIENT_CONFIG__"`. */
  windowObject?: string;
}

// ── Inferred config type ─────────────────────────────────

/** Maps a FieldKind to its TypeScript type. */
type KindToType<K extends FieldKind> = K extends "string"
  ? string
  : K extends "boolean"
    ? boolean
    : K extends "number"
      ? number
      : unknown; // json

/** Infers the resolved config type from a schema shape. */
export type InferConfig<S extends SchemaShape> = {
  [K in keyof S]: S[K] extends FieldDescriptor<infer Kind, infer T>
    ? Kind extends "json"
      ? T
      : KindToType<Kind>
    : never;
};

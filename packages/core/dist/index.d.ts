/** Supported runtime config value types. */
type FieldKind = "string" | "boolean" | "number" | "json";
/** Describes a single field in the runtime config schema. */
interface FieldDescriptor<K extends FieldKind = FieldKind, T = unknown> {
    kind: K;
    required?: boolean;
    defaultValue?: T;
    description?: string;
}
/** A record of named field descriptors that defines the schema. */
type SchemaShape = Record<string, FieldDescriptor>;
interface ManifestField {
    kind: FieldKind;
    required: boolean;
    defaultValue?: unknown;
    description?: string;
}
interface Manifest {
    version: 1;
    prefix: string;
    windowObject: string;
    fields: Record<string, ManifestField>;
}
interface ManifestOptions {
    /** Environment variable prefix, e.g. `"CLIENT_"`. */
    prefix?: string;
    /** Global window key, defaults to `"__CLIENT_CONFIG__"`. */
    windowObject?: string;
}
/** Maps a FieldKind to its TypeScript type. */
type KindToType<K extends FieldKind> = K extends "string" ? string : K extends "boolean" ? boolean : K extends "number" ? number : unknown;
/** Infers the resolved config type from a schema shape. */
type InferConfig<S extends SchemaShape> = {
    [K in keyof S]: S[K] extends FieldDescriptor<infer Kind, infer T> ? Kind extends "json" ? T : KindToType<Kind> : never;
};

interface StringFieldOptions {
    required?: boolean;
    defaultValue?: string;
    description?: string;
}
interface BooleanFieldOptions {
    required?: boolean;
    defaultValue?: boolean;
    description?: string;
}
interface NumberFieldOptions {
    required?: boolean;
    defaultValue?: number;
    description?: string;
}
interface JsonFieldOptions<T = unknown> {
    required?: boolean;
    defaultValue?: T;
    description?: string;
}
/** Declare a `string` field. */
declare function string(opts?: StringFieldOptions): FieldDescriptor<"string", string>;
/** Declare a `boolean` field. */
declare function boolean(opts?: BooleanFieldOptions): FieldDescriptor<"boolean", boolean>;
/** Declare a `number` field. */
declare function number(opts?: NumberFieldOptions): FieldDescriptor<"number", number>;
/** Declare a `json` field with an explicit generic type. */
declare function json<T = unknown>(opts?: JsonFieldOptions<T>): FieldDescriptor<"json", T>;
/**
 * Identity wrapper that defines a typed schema shape.
 * Preserves full type information for downstream inference.
 */
declare function defineSchema<S extends SchemaShape>(shape: S): S;

/**
 * Generates a JSON manifest from a schema shape.
 *
 * The manifest is the stable contract between the TypeScript schema
 * definition and the Go runtime injector.
 */
declare function createManifest(schema: SchemaShape, options?: ManifestOptions): Manifest;

/**
 * Reads runtime config from `window.__CLIENT_CONFIG__` and coerces
 * each value according to the field's declared kind.
 *
 * This is the browser-side entry point — the same contract is used in
 * both dev (static stub) and prod (injector-generated) modes.
 */
declare function readEnvFromShape<S extends SchemaShape>(schema: S): InferConfig<S>;

export { type FieldDescriptor, type FieldKind, type InferConfig, type Manifest, type ManifestField, type ManifestOptions, type SchemaShape, boolean, createManifest, defineSchema, json, number, readEnvFromShape, string };

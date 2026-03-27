import type { FieldDescriptor, SchemaShape } from "./types.js";

// ── DSL builder functions ────────────────────────────────

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
export function string(opts: StringFieldOptions = {}): FieldDescriptor<"string", string> {
  return { kind: "string", ...opts };
}

/** Declare a `boolean` field. */
export function boolean(opts: BooleanFieldOptions = {}): FieldDescriptor<"boolean", boolean> {
  return { kind: "boolean", ...opts };
}

/** Declare a `number` field. */
export function number(opts: NumberFieldOptions = {}): FieldDescriptor<"number", number> {
  return { kind: "number", ...opts };
}

/** Declare a `json` field with an explicit generic type. */
export function json<T = unknown>(opts: JsonFieldOptions<T> = {}): FieldDescriptor<"json", T> {
  return { kind: "json", ...opts };
}

// ── Schema factory ───────────────────────────────────────

/**
 * Identity wrapper that defines a typed schema shape.
 * Preserves full type information for downstream inference.
 */
export function defineSchema<S extends SchemaShape>(shape: S): S {
  return shape;
}

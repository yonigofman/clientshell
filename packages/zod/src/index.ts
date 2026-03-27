import type { z } from "zod";
import type { FieldKind, Manifest, ManifestField, ManifestOptions } from "@clientshell/core";

// ── Types ────────────────────────────────────────────────

/** A Zod-based schema shape: record of Zod types. */
export type ZodSchemaShape = Record<string, z.ZodTypeAny>;

// ── defineZodSchema ──────────────────────────────────────

/**
 * Identity wrapper that defines a Zod-based schema shape.
 * Provides type-safe access to the Zod schemas by key.
 */
export function defineZodSchema<S extends ZodSchemaShape>(shape: S): S {
  return shape;
}

// ── Manifest from Zod ────────────────────────────────────

/**
 * Introspects Zod types to produce a clientshell manifest.
 *
 * Supports: ZodString, ZodNumber, ZodBoolean, ZodRecord, ZodObject,
 * ZodEnum, ZodDefault, ZodOptional.
 */
export function createManifestFromZod(
  schema: ZodSchemaShape,
  options: ManifestOptions = {},
): Manifest {
  const { prefix = "", windowObject = "__CLIENT_CONFIG__" } = options;
  const fields: Record<string, ManifestField> = {};

  for (const [name, zodType] of Object.entries(schema)) {
    fields[name] = zodToManifestField(zodType);
  }

  return { version: 1, prefix, windowObject, fields };
}

// ── Runtime reader ───────────────────────────────────────

/**
 * Reads `window.__CLIENT_CONFIG__` and validates each value through
 * its Zod schema. Provides full Zod validation at runtime.
 */
export function readEnvWithZod<S extends ZodSchemaShape>(
  schema: S,
): { [K in keyof S]: z.infer<S[K]> } {
  const raw = getWindowConfig();
  const result: Record<string, unknown> = {};

  for (const [name, zodType] of Object.entries(schema)) {
    let rawValue = raw[name];

    // Pre-coerce string values for non-string types
    if (typeof rawValue === "string") {
      rawValue = preCoerce(rawValue, zodType);
    }

    const parsed = zodType.safeParse(rawValue ?? undefined);
    if (!parsed.success) {
      throw new Error(
        `[clientshell] Validation failed for "${name}": ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      );
    }
    result[name] = parsed.data;
  }

  return result as { [K in keyof S]: z.infer<S[K]> };
}

// ── Helpers ──────────────────────────────────────────────

function getWindowConfig(): Record<string, unknown> {
  if (typeof globalThis !== "undefined" && "__CLIENT_CONFIG__" in globalThis) {
    return (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ as Record<string, unknown>;
  }
  if (typeof window !== "undefined" && "__CLIENT_CONFIG__" in window) {
    return (window as Record<string, unknown>).__CLIENT_CONFIG__ as Record<string, unknown>;
  }
  return {};
}

/**
 * Pre-coerces raw string values before Zod parsing so that
 * env-config.js string representations work correctly with Zod types.
 */
function preCoerce(value: string, zodType: z.ZodTypeAny): unknown {
  const innerType = unwrapZodType(zodType);
  const typeName = innerType._def?.typeName as string | undefined;

  if (typeName === "ZodBoolean") {
    const lower = value.toLowerCase();
    if (lower === "true" || lower === "1") return true;
    if (lower === "false" || lower === "0") return false;
    return value;
  }

  if (typeName === "ZodNumber") {
    const num = Number(value);
    return Number.isNaN(num) ? value : num;
  }

  if (typeName === "ZodRecord" || typeName === "ZodObject" || typeName === "ZodArray") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

/** Unwraps ZodDefault, ZodOptional, ZodNullable to get the inner type. */
function unwrapZodType(zodType: z.ZodTypeAny): z.ZodTypeAny {
  const typeName = zodType._def?.typeName as string | undefined;
  if (typeName === "ZodDefault" || typeName === "ZodOptional" || typeName === "ZodNullable") {
    return unwrapZodType(zodType._def.innerType);
  }
  return zodType;
}

/** Converts a Zod type to a manifest field descriptor. */
function zodToManifestField(zodType: z.ZodTypeAny): ManifestField {
  let hasDefault = false;
  let defaultValue: unknown;
  let isOptional = false;
  let inner = zodType;

  // Peel off wrappers
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const typeName = inner._def?.typeName as string | undefined;
    if (typeName === "ZodDefault") {
      hasDefault = true;
      defaultValue = inner._def.defaultValue();
      inner = inner._def.innerType;
    } else if (typeName === "ZodOptional" || typeName === "ZodNullable") {
      isOptional = true;
      inner = inner._def.innerType;
    } else {
      break;
    }
  }

  const kind = zodTypeToKind(inner);
  const required = !isOptional && !hasDefault;

  const field: ManifestField = { kind, required };
  if (hasDefault) {
    field.defaultValue = defaultValue;
  }
  return field;
}

function zodTypeToKind(zodType: z.ZodTypeAny): FieldKind {
  const typeName = zodType._def?.typeName as string | undefined;
  switch (typeName) {
    case "ZodString":
    case "ZodEnum":
      return "string";
    case "ZodBoolean":
      return "boolean";
    case "ZodNumber":
      return "number";
    default:
      return "json";
  }
}

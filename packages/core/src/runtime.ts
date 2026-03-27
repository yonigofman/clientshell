import type { InferConfig, SchemaShape } from "./types.js";

/**
 * Reads runtime config from `window.__CLIENT_CONFIG__` and coerces
 * each value according to the field's declared kind.
 *
 * This is the browser-side entry point — the same contract is used in
 * both dev (static stub) and prod (injector-generated) modes.
 */
export function readEnvFromShape<S extends SchemaShape>(schema: S): InferConfig<S> {
  const raw = getWindowConfig();
  const result: Record<string, unknown> = {};

  for (const [name, descriptor] of Object.entries(schema)) {
    const rawValue = raw[name];

    if (rawValue === undefined || rawValue === null) {
      if (descriptor.required && descriptor.defaultValue === undefined) {
        throw new Error(`[clientshell] Missing required config field: ${name}`);
      }
      result[name] = descriptor.defaultValue ?? getKindDefault(descriptor.kind);
      continue;
    }

    result[name] = coerce(name, rawValue, descriptor.kind);
  }

  return result as InferConfig<S>;
}

// ── Internal helpers ─────────────────────────────────────

function getWindowConfig(): Record<string, unknown> {
  if (typeof globalThis !== "undefined" && "__CLIENT_CONFIG__" in globalThis) {
    return (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ as Record<string, unknown>;
  }

  if (typeof window !== "undefined" && "__CLIENT_CONFIG__" in window) {
    return (window as Record<string, unknown>).__CLIENT_CONFIG__ as Record<string, unknown>;
  }

  return {};
}

function coerce(name: string, value: unknown, kind: string): unknown {
  if (kind === "string") {
    return String(value);
  }

  if (kind === "boolean") {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower === "true" || lower === "1") return true;
      if (lower === "false" || lower === "0") return false;
    }
    throw new Error(`[clientshell] Cannot coerce "${name}" to boolean: ${String(value)}`);
  }

  if (kind === "number") {
    if (typeof value === "number") return value;
    const num = Number(value);
    if (Number.isNaN(num)) {
      throw new Error(`[clientshell] Cannot coerce "${name}" to number: ${String(value)}`);
    }
    return num;
  }

  if (kind === "json") {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        throw new Error(`[clientshell] Cannot parse "${name}" as JSON: ${value}`);
      }
    }
    // Already parsed (e.g. injector wrote a real object)
    return value;
  }

  return value;
}

function getKindDefault(kind: string): unknown {
  switch (kind) {
    case "string":
      return "";
    case "boolean":
      return false;
    case "number":
      return 0;
    case "json":
      return undefined;
    default:
      return undefined;
  }
}

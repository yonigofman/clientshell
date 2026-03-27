import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { defineSchema, string, boolean, number, json } from "../src/schema.js";
import { createManifest } from "../src/manifest.js";
import { readEnvFromShape } from "../src/runtime.js";

// ─── Schema DSL ──────────────────────────────────────────

describe("schema DSL", () => {
  it("string() creates a string field descriptor", () => {
    const field = string({ required: true, description: "API URL" });
    expect(field).toEqual({
      kind: "string",
      required: true,
      description: "API URL",
    });
  });

  it("boolean() creates a boolean field descriptor with default", () => {
    const field = boolean({ defaultValue: false });
    expect(field).toEqual({ kind: "boolean", defaultValue: false });
  });

  it("number() creates a number field descriptor", () => {
    const field = number({ defaultValue: 5000 });
    expect(field).toEqual({ kind: "number", defaultValue: 5000 });
  });

  it("json() creates a json field descriptor", () => {
    const field = json<Record<string, boolean>>({ defaultValue: {} });
    expect(field).toEqual({ kind: "json", defaultValue: {} });
  });

  it("defineSchema() preserves the shape", () => {
    const schema = defineSchema({
      API_URL: string({ required: true }),
    });
    expect(schema.API_URL.kind).toBe("string");
    expect(schema.API_URL.required).toBe(true);
  });
});

// ─── Manifest generation ─────────────────────────────────

describe("createManifest", () => {
  it("generates a v1 manifest from a schema", () => {
    const schema = defineSchema({
      API_URL: string({ required: true }),
      ENABLE_NEW_UI: boolean({ defaultValue: false }),
    });

    const manifest = createManifest(schema, {
      prefix: "CLIENT_",
      windowObject: "__CLIENT_CONFIG__",
    });

    expect(manifest).toEqual({
      version: 1,
      prefix: "CLIENT_",
      windowObject: "__CLIENT_CONFIG__",
      fields: {
        API_URL: { kind: "string", required: true },
        ENABLE_NEW_UI: {
          kind: "boolean",
          required: false,
          defaultValue: false,
        },
      },
    });
  });

  it("uses sensible defaults for options", () => {
    const manifest = createManifest(defineSchema({}));
    expect(manifest.prefix).toBe("");
    expect(manifest.windowObject).toBe("__CLIENT_CONFIG__");
  });

  it("includes description when provided", () => {
    const schema = defineSchema({
      API_URL: string({ required: true, description: "Public API base URL" }),
    });
    const manifest = createManifest(schema);
    expect(manifest.fields.API_URL.description).toBe("Public API base URL");
  });
});

// ─── Runtime reader ──────────────────────────────────────

describe("readEnvFromShape", () => {
  beforeEach(() => {
    // Reset the window config before each test
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {};
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).__CLIENT_CONFIG__;
  });

  it("reads string values", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {
      API_URL: "https://api.example.com",
    };

    const schema = defineSchema({ API_URL: string({ required: true }) });
    const config = readEnvFromShape(schema);

    expect(config.API_URL).toBe("https://api.example.com");
  });

  it("coerces boolean strings", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {
      ENABLED: "true",
    };

    const schema = defineSchema({ ENABLED: boolean() });
    const config = readEnvFromShape(schema);

    expect(config.ENABLED).toBe(true);
  });

  it("coerces number strings", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {
      INTERVAL: "5000",
    };

    const schema = defineSchema({ INTERVAL: number() });
    const config = readEnvFromShape(schema);

    expect(config.INTERVAL).toBe(5000);
  });

  it("parses JSON strings", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {
      FLAGS: '{"beta":true}',
    };

    const schema = defineSchema({
      FLAGS: json<Record<string, boolean>>(),
    });
    const config = readEnvFromShape(schema);

    expect(config.FLAGS).toEqual({ beta: true });
  });

  it("applies default values when field is missing", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {};

    const schema = defineSchema({
      APP_ENV: string({ defaultValue: "development" }),
    });
    const config = readEnvFromShape(schema);

    expect(config.APP_ENV).toBe("development");
  });

  it("throws on missing required field without default", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {};

    const schema = defineSchema({ API_URL: string({ required: true }) });

    expect(() => readEnvFromShape(schema)).toThrow(
      "[clientshell] Missing required config field: API_URL",
    );
  });

  it("handles already-parsed boolean values", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {
      ENABLED: true,
    };

    const schema = defineSchema({ ENABLED: boolean() });
    const config = readEnvFromShape(schema);

    expect(config.ENABLED).toBe(true);
  });

  it("handles already-parsed number values", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {
      INTERVAL: 3000,
    };

    const schema = defineSchema({ INTERVAL: number() });
    const config = readEnvFromShape(schema);

    expect(config.INTERVAL).toBe(3000);
  });

  it("handles already-parsed JSON objects", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {
      FLAGS: { beta: true },
    };

    const schema = defineSchema({
      FLAGS: json<Record<string, boolean>>(),
    });
    const config = readEnvFromShape(schema);

    expect(config.FLAGS).toEqual({ beta: true });
  });

  it("returns empty defaults when no config exists", () => {
    delete (globalThis as Record<string, unknown>).__CLIENT_CONFIG__;

    const schema = defineSchema({
      APP_ENV: string(),
    });
    const config = readEnvFromShape(schema);

    expect(config.APP_ENV).toBe("");
  });
});

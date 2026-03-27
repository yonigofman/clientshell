import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { defineZodSchema, createManifestFromZod, readEnvWithZod } from "../src/index.js";

describe("defineZodSchema", () => {
  it("preserves the shape", () => {
    const schema = defineZodSchema({
      API_URL: z.string().url(),
    });
    expect(schema.API_URL).toBeDefined();
  });
});

describe("createManifestFromZod", () => {
  it("generates manifest from Zod schema", () => {
    const schema = defineZodSchema({
      API_URL: z.string().url(),
      ENABLE_NEW_UI: z.boolean().default(false),
      POLL_INTERVAL_MS: z.number().default(5000),
    });

    const manifest = createManifestFromZod(schema, {
      prefix: "CLIENT_",
      windowObject: "__CLIENT_CONFIG__",
    });

    expect(manifest.version).toBe(1);
    expect(manifest.prefix).toBe("CLIENT_");
    expect(manifest.fields.API_URL).toEqual({ kind: "string", required: true });
    expect(manifest.fields.ENABLE_NEW_UI).toEqual({
      kind: "boolean",
      required: false,
      defaultValue: false,
    });
    expect(manifest.fields.POLL_INTERVAL_MS).toEqual({
      kind: "number",
      required: false,
      defaultValue: 5000,
    });
  });

  it("handles ZodEnum as string kind", () => {
    const schema = defineZodSchema({
      APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
    });
    const manifest = createManifestFromZod(schema);
    expect(manifest.fields.APP_ENV.kind).toBe("string");
    expect(manifest.fields.APP_ENV.defaultValue).toBe("development");
  });

  it("handles ZodRecord as json kind", () => {
    const schema = defineZodSchema({
      FLAGS: z.record(z.boolean()).default({}),
    });
    const manifest = createManifestFromZod(schema);
    expect(manifest.fields.FLAGS.kind).toBe("json");
  });

  it("marks optional fields as not required", () => {
    const schema = defineZodSchema({
      OPTIONAL: z.string().optional(),
    });
    const manifest = createManifestFromZod(schema);
    expect(manifest.fields.OPTIONAL.required).toBe(false);
  });
});

describe("readEnvWithZod", () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {};
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).__CLIENT_CONFIG__;
  });

  it("reads and validates string values", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {
      API_URL: "https://api.example.com",
    };

    const schema = defineZodSchema({ API_URL: z.string().url() });
    const config = readEnvWithZod(schema);
    expect(config.API_URL).toBe("https://api.example.com");
  });

  it("coerces boolean strings before Zod parse", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {
      ENABLED: "true",
    };

    const schema = defineZodSchema({ ENABLED: z.boolean().default(false) });
    const config = readEnvWithZod(schema);
    expect(config.ENABLED).toBe(true);
  });

  it("coerces number strings before Zod parse", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {
      INTERVAL: "5000",
    };

    const schema = defineZodSchema({ INTERVAL: z.number().default(3000) });
    const config = readEnvWithZod(schema);
    expect(config.INTERVAL).toBe(5000);
  });

  it("parses JSON strings for record types", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {
      FLAGS: '{"beta":true}',
    };

    const schema = defineZodSchema({ FLAGS: z.record(z.boolean()).default({}) });
    const config = readEnvWithZod(schema);
    expect(config.FLAGS).toEqual({ beta: true });
  });

  it("applies Zod defaults for missing values", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {};

    const schema = defineZodSchema({
      APP_ENV: z.string().default("development"),
    });
    const config = readEnvWithZod(schema);
    expect(config.APP_ENV).toBe("development");
  });

  it("throws on invalid values", () => {
    (globalThis as Record<string, unknown>).__CLIENT_CONFIG__ = {
      API_URL: "not-a-url",
    };

    const schema = defineZodSchema({ API_URL: z.string().url() });
    expect(() => readEnvWithZod(schema)).toThrow("[clientshell] Validation failed");
  });
});

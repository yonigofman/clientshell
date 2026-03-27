import { z } from 'zod';
import { ManifestOptions, Manifest } from '@clientshell/core';

/** A Zod-based schema shape: record of Zod types. */
type ZodSchemaShape = Record<string, z.ZodTypeAny>;
/**
 * Identity wrapper that defines a Zod-based schema shape.
 * Provides type-safe access to the Zod schemas by key.
 */
declare function defineZodSchema<S extends ZodSchemaShape>(shape: S): S;
/**
 * Introspects Zod types to produce a clientshell manifest.
 *
 * Supports: ZodString, ZodNumber, ZodBoolean, ZodRecord, ZodObject,
 * ZodEnum, ZodDefault, ZodOptional.
 */
declare function createManifestFromZod(schema: ZodSchemaShape, options?: ManifestOptions): Manifest;
/**
 * Reads `window.__CLIENT_CONFIG__` and validates each value through
 * its Zod schema. Provides full Zod validation at runtime.
 */
declare function readEnvWithZod<S extends ZodSchemaShape>(schema: S): {
    [K in keyof S]: z.infer<S[K]>;
};

export { type ZodSchemaShape, createManifestFromZod, defineZodSchema, readEnvWithZod };

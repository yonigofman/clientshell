import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import * as p from "@clack/prompts";
import color from "picocolors";

export async function run(args: string[]): Promise<void> {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case "manifest":
      await runManifest(args.slice(1));
      break;
    case "validate":
      await runValidate(args.slice(1));
      break;
    case "stub":
      await runStub(args.slice(1));
      break;
    default:
      p.intro(color.bgRed(color.white(" clientshell ")));
      p.log.error(`Unknown command: ${color.bold(command)}`);
      showHelp();
      process.exit(1);
  }
}

function showHelp(): void {
  p.intro(color.bgCyan(color.black(" clientshell ")));

  p.log.info(`${color.bold("Usage:")} clientshell <command> [options]`);

  p.log.message(
    [
      `${color.bold("Commands:")}`,
      `  ${color.cyan("manifest")}   Generate manifest JSON from a schema module`,
      `  ${color.cyan("validate")}   Validate env vars against a manifest`,
      `  ${color.cyan("stub")}       Generate a dev env-config.js stub`,
    ].join("\n"),
  );

  p.log.message(
    [
      `${color.bold("Options:")}`,
      `  ${color.dim("--schema <path>")}      Path to the schema module (.ts or .js)`,
      `  ${color.dim("--manifest <path>")}    Path to clientshell.manifest.json`,
      `  ${color.dim("--output <path>")}      Output file path`,
      `  ${color.dim("--prefix <string>")}    Env var prefix override`,
    ].join("\n"),
  );

  p.outro(color.dim("https://github.com/clientshell"));
}

// ─── manifest command ────────────────────────────────────

async function runManifest(args: string[]): Promise<void> {
  p.intro(color.bgCyan(color.black(" clientshell manifest ")));

  const schemaPath = getFlag(args, "--schema");
  if (!schemaPath) {
    p.log.error("Missing required flag: --schema <path>");
    p.outro(color.red("Aborted"));
    process.exit(1);
  }

  const output = getFlag(args, "--output");

  const s = p.spinner();
  s.start("Loading schema module");

  // Dynamically import the schema module
  // When loading .ts files, the caller should use: node --import tsx
  const absPath = resolve(process.cwd(), schemaPath);
  let mod: Record<string, unknown>;
  try {
    mod = await import(pathToFileURL(absPath).href);
  } catch (err) {
    s.stop("Failed to load schema");
    p.log.error(`Could not import ${color.bold(schemaPath)}: ${err}`);
    p.outro(color.red("Aborted"));
    process.exit(1);
  }

  // Find the schema export (try common names)
  const schema = mod.clientEnvSchema ?? mod.schema ?? mod.default;
  if (!schema) {
    s.stop("No schema found");
    p.log.error(
      `Schema module must export ${color.cyan("clientEnvSchema")}, ${color.cyan("schema")}, or ${color.cyan("default")}`,
    );
    p.outro(color.red("Aborted"));
    process.exit(1);
  }

  s.stop("Schema loaded");

  const { createManifest } = await import("@clientshell/core");
  const prefix = getFlag(args, "--prefix") ?? "";
  const manifest = createManifest(schema as Parameters<typeof createManifest>[0], { prefix });
  const json = JSON.stringify(manifest, null, 2);

  const fieldCount = Object.keys(manifest.fields).length;

  if (output) {
    await writeFile(resolve(process.cwd(), output), json, "utf-8");
    p.log.success(`Manifest written to ${color.bold(output)}`);
    p.log.info(`${color.dim(`${fieldCount} field(s), prefix: "${prefix || "(none)"}"`)}`);
  } else {
    console.log(json);
  }

  p.outro(color.green("Done"));
}

// ─── validate command ────────────────────────────────────

async function runValidate(args: string[]): Promise<void> {
  p.intro(color.bgCyan(color.black(" clientshell validate ")));

  const manifestPath = getFlag(args, "--manifest");
  if (!manifestPath) {
    p.log.error("Missing required flag: --manifest <path>");
    p.outro(color.red("Aborted"));
    process.exit(1);
  }

  const s = p.spinner();
  s.start("Reading manifest");

  const absPath = resolve(process.cwd(), manifestPath);
  let manifest: {
    prefix: string;
    fields: Record<string, { kind: string; required: boolean; defaultValue?: unknown }>;
  };

  try {
    const raw = await readFile(absPath, "utf-8");
    manifest = JSON.parse(raw);
  } catch (err) {
    s.stop("Failed to read manifest");
    p.log.error(`Could not read ${color.bold(manifestPath)}: ${err}`);
    p.outro(color.red("Aborted"));
    process.exit(1);
  }

  s.stop("Manifest loaded");

  const prefix = manifest.prefix ?? "";
  const errors: string[] = [];
  const valid: string[] = [];

  for (const [name, field] of Object.entries(manifest.fields)) {
    const envKey = `${prefix}${name}`;
    const value = process.env[envKey];

    if (value === undefined && field.required && field.defaultValue === undefined) {
      errors.push(`${color.red("✗")} ${color.bold(envKey)} — required but not set`);
      continue;
    }

    if (value !== undefined) {
      const validationError = validateValue(envKey, value, field.kind);
      if (validationError) {
        errors.push(`${color.red("✗")} ${validationError}`);
      } else {
        valid.push(`${color.green("✓")} ${color.bold(envKey)} = ${color.dim(value)}`);
      }
    } else {
      valid.push(
        `${color.green("✓")} ${color.bold(envKey)} — ${color.dim(`default: ${JSON.stringify(field.defaultValue)}`)}`,
      );
    }
  }

  if (valid.length > 0) {
    p.log.success(valid.join("\n"));
  }

  if (errors.length > 0) {
    p.log.error(errors.join("\n"));
    p.outro(color.red(`Validation failed (${errors.length} error${errors.length > 1 ? "s" : ""})`));
    process.exit(1);
  }

  p.outro(color.green(`All ${valid.length} variable(s) valid ✓`));
}

function validateValue(key: string, value: string, kind: string): string | null {
  if (kind === "boolean") {
    const lower = value.toLowerCase();
    if (!["true", "false", "1", "0"].includes(lower)) {
      return `${color.bold(key)}: expected boolean, got "${value}"`;
    }
  }

  if (kind === "number") {
    if (Number.isNaN(Number(value))) {
      return `${color.bold(key)}: expected number, got "${value}"`;
    }
  }

  if (kind === "json") {
    try {
      JSON.parse(value);
    } catch {
      return `${color.bold(key)}: expected valid JSON, got "${value}"`;
    }
  }

  return null;
}

// ─── stub command ────────────────────────────────────────

async function runStub(args: string[]): Promise<void> {
  p.intro(color.bgCyan(color.black(" clientshell stub ")));

  const manifestPath = getFlag(args, "--manifest");
  if (!manifestPath) {
    p.log.error("Missing required flag: --manifest <path>");
    p.outro(color.red("Aborted"));
    process.exit(1);
  }

  const output = getFlag(args, "--output") ?? "public/env-config.js";

  const s = p.spinner();
  s.start("Generating dev stub");

  const absPath = resolve(process.cwd(), manifestPath);
  let manifest: {
    windowObject: string;
    fields: Record<string, { kind: string; defaultValue?: unknown }>;
  };

  try {
    const raw = await readFile(absPath, "utf-8");
    manifest = JSON.parse(raw);
  } catch (err) {
    s.stop("Failed to read manifest");
    p.log.error(`Could not read ${color.bold(manifestPath)}: ${err}`);
    p.outro(color.red("Aborted"));
    process.exit(1);
  }

  const windowObject = manifest.windowObject ?? "__CLIENT_CONFIG__";
  const values: Record<string, unknown> = {};

  for (const [name, field] of Object.entries(manifest.fields)) {
    if (field.defaultValue !== undefined) {
      values[name] = field.defaultValue;
    } else {
      values[name] = getPlaceholder(field.kind, name);
    }
  }

  const content = `window.${windowObject} = ${JSON.stringify(values, null, 2)};\n`;

  const outPath = resolve(process.cwd(), output);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, content, "utf-8");

  s.stop("Stub generated");

  p.log.success(`Written to ${color.bold(output)}`);
  p.log.info(color.dim(`${Object.keys(values).length} field(s), window.${windowObject}`));

  p.outro(color.green("Done"));
}

function getPlaceholder(kind: string, name: string): unknown {
  switch (kind) {
    case "string":
      return `REPLACE_${name}`;
    case "boolean":
      return false;
    case "number":
      return 0;
    case "json":
      return {};
    default:
      return "";
  }
}

// ─── Utilities ───────────────────────────────────────────

function getFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}


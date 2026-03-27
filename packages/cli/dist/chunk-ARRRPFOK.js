// src/cli.ts
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { pathToFileURL } from "url";
var HELP = `
clientshell \u2014 CLI for managing runtime config manifests

Usage:
  clientshell manifest --schema <path>   Generate manifest JSON from a schema module
  clientshell validate --manifest <path>  Validate env vars against a manifest
  clientshell stub --manifest <path>      Generate a dev env-config.js stub
  clientshell --help                      Show this help

Options:
  --schema <path>      Path to the schema module (.ts or .js)
  --manifest <path>    Path to clientshell.manifest.json
  --output <path>      Output file path (default: stdout for manifest, public/env-config.js for stub)
  --prefix <string>    Env var prefix override
`.trim();
async function run(args) {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
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
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}
async function runManifest(args) {
  const schemaPath = getFlag(args, "--schema");
  if (!schemaPath) {
    console.error("Error: --schema is required");
    process.exit(1);
  }
  const output = getFlag(args, "--output");
  const absPath = resolve(process.cwd(), schemaPath);
  const mod = await import(pathToFileURL(absPath).href);
  const schema = mod.clientEnvSchema ?? mod.schema ?? mod.default;
  if (!schema) {
    console.error("Error: Schema module must export `clientEnvSchema`, `schema`, or `default`");
    process.exit(1);
  }
  const { createManifest } = await import("@clientshell/core");
  const prefix = getFlag(args, "--prefix") ?? "";
  const manifest = createManifest(schema, { prefix });
  const json = JSON.stringify(manifest, null, 2);
  if (output) {
    await writeFile(resolve(process.cwd(), output), json, "utf-8");
    console.log(`Manifest written to ${output}`);
  } else {
    console.log(json);
  }
}
async function runValidate(args) {
  const manifestPath = getFlag(args, "--manifest");
  if (!manifestPath) {
    console.error("Error: --manifest is required");
    process.exit(1);
  }
  const absPath = resolve(process.cwd(), manifestPath);
  const raw = await readFile(absPath, "utf-8");
  const manifest = JSON.parse(raw);
  const prefix = manifest.prefix ?? "";
  const errors = [];
  for (const [name, field] of Object.entries(manifest.fields)) {
    const envKey = `${prefix}${name}`;
    const value = process.env[envKey];
    if (value === void 0 && field.required && field.defaultValue === void 0) {
      errors.push(`Missing required env var: ${envKey}`);
      continue;
    }
    if (value !== void 0) {
      const validationError = validateValue(envKey, value, field.kind);
      if (validationError) {
        errors.push(validationError);
      }
    }
  }
  if (errors.length > 0) {
    console.error("Validation errors:");
    for (const err of errors) {
      console.error(`  \u2717 ${err}`);
    }
    process.exit(1);
  }
  console.log("\u2713 All env vars are valid");
}
function validateValue(key, value, kind) {
  if (kind === "boolean") {
    const lower = value.toLowerCase();
    if (!["true", "false", "1", "0"].includes(lower)) {
      return `${key}: expected boolean, got "${value}"`;
    }
  }
  if (kind === "number") {
    if (Number.isNaN(Number(value))) {
      return `${key}: expected number, got "${value}"`;
    }
  }
  if (kind === "json") {
    try {
      JSON.parse(value);
    } catch {
      return `${key}: expected valid JSON, got "${value}"`;
    }
  }
  return null;
}
async function runStub(args) {
  const manifestPath = getFlag(args, "--manifest");
  if (!manifestPath) {
    console.error("Error: --manifest is required");
    process.exit(1);
  }
  const output = getFlag(args, "--output") ?? "public/env-config.js";
  const absPath = resolve(process.cwd(), manifestPath);
  const raw = await readFile(absPath, "utf-8");
  const manifest = JSON.parse(raw);
  const windowObject = manifest.windowObject ?? "__CLIENT_CONFIG__";
  const values = {};
  for (const [name, field] of Object.entries(manifest.fields)) {
    if (field.defaultValue !== void 0) {
      values[name] = field.defaultValue;
    } else {
      values[name] = getPlaceholder(field.kind, name);
    }
  }
  const content = `window.${windowObject} = ${JSON.stringify(values, null, 2)};
`;
  const outPath = resolve(process.cwd(), output);
  const dir = dirname(outPath);
  const { mkdir } = await import("fs/promises");
  await mkdir(dir, { recursive: true });
  await writeFile(outPath, content, "utf-8");
  console.log(`Stub written to ${output}`);
}
function getPlaceholder(kind, name) {
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
function getFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return void 0;
  return args[idx + 1];
}

export {
  run
};
//# sourceMappingURL=chunk-ARRRPFOK.js.map
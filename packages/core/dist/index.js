// src/schema.ts
function string(opts = {}) {
  return { kind: "string", ...opts };
}
function boolean(opts = {}) {
  return { kind: "boolean", ...opts };
}
function number(opts = {}) {
  return { kind: "number", ...opts };
}
function json(opts = {}) {
  return { kind: "json", ...opts };
}
function defineSchema(shape) {
  return shape;
}

// src/manifest.ts
function createManifest(schema, options = {}) {
  const { prefix = "", windowObject = "__CLIENT_CONFIG__" } = options;
  const fields = {};
  for (const [name, descriptor] of Object.entries(schema)) {
    const field = {
      kind: descriptor.kind,
      required: descriptor.required ?? false
    };
    if (descriptor.defaultValue !== void 0) {
      field.defaultValue = descriptor.defaultValue;
    }
    if (descriptor.description !== void 0) {
      field.description = descriptor.description;
    }
    fields[name] = field;
  }
  return {
    version: 1,
    prefix,
    windowObject,
    fields
  };
}
function buildStubContent(schema, windowObject, devValues = {}) {
  const values = {};
  for (const [name, descriptor] of Object.entries(schema)) {
    if (name in devValues) {
      values[name] = devValues[name];
    } else if (descriptor.defaultValue !== void 0) {
      values[name] = descriptor.defaultValue;
    }
  }
  return `window.${windowObject} = ${JSON.stringify(values, null, 2)};
`;
}

// src/runtime.ts
function readEnvFromShape(schema) {
  const raw = getWindowConfig();
  const result = {};
  for (const [name, descriptor] of Object.entries(schema)) {
    const rawValue = raw[name];
    if (rawValue === void 0 || rawValue === null) {
      if (descriptor.required && descriptor.defaultValue === void 0) {
        throw new Error(`[clientshell] Missing required config field: ${name}`);
      }
      result[name] = descriptor.defaultValue ?? getKindDefault(descriptor.kind);
      continue;
    }
    result[name] = coerce(name, rawValue, descriptor.kind);
  }
  return result;
}
function getWindowConfig() {
  if (typeof globalThis !== "undefined" && "__CLIENT_CONFIG__" in globalThis) {
    return globalThis.__CLIENT_CONFIG__;
  }
  if (typeof window !== "undefined" && "__CLIENT_CONFIG__" in window) {
    return window.__CLIENT_CONFIG__;
  }
  return {};
}
function coerce(name, value, kind) {
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
    return value;
  }
  return value;
}
function getKindDefault(kind) {
  switch (kind) {
    case "string":
      return "";
    case "boolean":
      return false;
    case "number":
      return 0;
    case "json":
      return void 0;
    default:
      return void 0;
  }
}
export {
  boolean,
  buildStubContent,
  createManifest,
  defineSchema,
  json,
  number,
  readEnvFromShape,
  string
};
//# sourceMappingURL=index.js.map
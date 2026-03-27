// src/index.ts
function defineZodSchema(shape) {
  return shape;
}
function createManifestFromZod(schema, options = {}) {
  const { prefix = "", windowObject = "__CLIENT_CONFIG__" } = options;
  const fields = {};
  for (const [name, zodType] of Object.entries(schema)) {
    fields[name] = zodToManifestField(zodType);
  }
  return { version: 1, prefix, windowObject, fields };
}
function readEnvWithZod(schema) {
  const raw = getWindowConfig();
  const result = {};
  for (const [name, zodType] of Object.entries(schema)) {
    let rawValue = raw[name];
    if (typeof rawValue === "string") {
      rawValue = preCoerce(rawValue, zodType);
    }
    const parsed = zodType.safeParse(rawValue ?? void 0);
    if (!parsed.success) {
      throw new Error(
        `[clientshell] Validation failed for "${name}": ${parsed.error.issues.map((i) => i.message).join(", ")}`
      );
    }
    result[name] = parsed.data;
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
function preCoerce(value, zodType) {
  const innerType = unwrapZodType(zodType);
  const typeName = innerType._def?.typeName;
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
function unwrapZodType(zodType) {
  const typeName = zodType._def?.typeName;
  if (typeName === "ZodDefault" || typeName === "ZodOptional" || typeName === "ZodNullable") {
    return unwrapZodType(zodType._def.innerType);
  }
  return zodType;
}
function zodToManifestField(zodType) {
  let hasDefault = false;
  let defaultValue;
  let isOptional = false;
  let inner = zodType;
  while (true) {
    const typeName = inner._def?.typeName;
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
  const field = { kind, required };
  if (hasDefault) {
    field.defaultValue = defaultValue;
  }
  return field;
}
function zodTypeToKind(zodType) {
  const typeName = zodType._def?.typeName;
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
export {
  createManifestFromZod,
  defineZodSchema,
  readEnvWithZod
};
//# sourceMappingURL=index.js.map
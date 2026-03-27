// src/index.ts
import { createManifest } from "@clientshell/core";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
function clientshellPlugin(options) {
  const {
    schema,
    prefix = "",
    windowObject = "__CLIENT_CONFIG__",
    devValues = {}
  } = options;
  const manifest = createManifest(schema, { prefix, windowObject });
  const stubContent = buildStubContent(schema, windowObject, devValues);
  return {
    name: "clientshell",
    // Serve dev stub
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/env-config.js") {
          res.setHeader("Content-Type", "application/javascript");
          res.setHeader("Cache-Control", "no-store");
          res.end(stubContent);
          return;
        }
        next();
      });
    },
    // Write manifest into build output
    async writeBundle(outputOptions) {
      const outDir = outputOptions.dir ?? "dist";
      await mkdir(outDir, { recursive: true });
      await writeFile(
        join(outDir, "clientshell.manifest.json"),
        JSON.stringify(manifest, null, 2),
        "utf-8"
      );
    }
  };
}
function buildStubContent(schema, windowObject, devValues) {
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
export {
  clientshellPlugin
};
//# sourceMappingURL=index.js.map
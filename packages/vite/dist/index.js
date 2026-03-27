// src/index.ts
import { createManifest, buildStubContent } from "@clientshell/core";
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
export {
  clientshellPlugin
};
//# sourceMappingURL=index.js.map
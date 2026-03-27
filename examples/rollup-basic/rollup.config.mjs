import { clientshellPlugin } from "@clientshell/rollup";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/main.ts",
  output: {
    dir: "dist",
    format: "es",
  },
  plugins: [
    resolve(),
    typescript(),
    clientshellPlugin({
      manifestPath: "./clientshell.manifest.json",
    }),
  ],
};

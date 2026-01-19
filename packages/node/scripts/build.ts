import { $ } from "bun";
import pkg from "../package.json";

const external = Object.keys(pkg.dependencies ?? {});

// Clean dist folder
await $`rm -rf dist`;

// Build with Bun
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  format: "esm",
  target: "node",
  sourcemap: "external",
  minify: false,
  external,
});

// Generate declaration files with tsc (override noEmit)
await $`tsc --emitDeclarationOnly --declaration --declarationMap --outDir dist --noEmit false`;

console.log("✅ Build complete!");

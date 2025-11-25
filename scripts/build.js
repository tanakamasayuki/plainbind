const { build } = require("esbuild");
const path = require("path");
const fs = require("fs");

const outdir = path.resolve(__dirname, "..", "dist");
if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

const banner = `/*! PlainBind.js v0.1.0 | MIT License */`;

async function run() {
  const common = {
    entryPoints: [path.resolve(__dirname, "..", "plainbind.js")],
    bundle: true,
    format: "iife",
    globalName: "PlainBind",
    target: ["es2017"],
    platform: "browser",
    banner: { js: banner },
  };

  await build({
    ...common,
    outfile: path.join(outdir, "plainbind.js"),
    minify: false,
    sourcemap: true,
  });

  await build({
    ...common,
    outfile: path.join(outdir, "plainbind.min.js"),
    minify: true,
    sourcemap: false,
  });

  console.log("Built dist/plainbind.js and dist/plainbind.min.js");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

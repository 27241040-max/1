import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const servePackagePath = require.resolve("serve/package.json");
const servePackage = require(servePackagePath);
const serveEntrypoint = join(dirname(servePackagePath), servePackage.bin.serve);
const distDir = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = process.env.PORT || "3000";

const child = spawn(process.execPath, [serveEntrypoint, "--single", "--listen", port, distDir], {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

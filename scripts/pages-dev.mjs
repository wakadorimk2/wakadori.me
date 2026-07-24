import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const distDirectory = join(projectRoot, "dist");
const functionsDirectory = join(projectRoot, "functions");
const wranglerBin = join(projectRoot, "node_modules", "wrangler", "bin", "wrangler.js");

for (const requiredPath of [distDirectory, functionsDirectory, wranglerBin]) {
  if (!existsSync(requiredPath)) {
    throw new Error(`Required path does not exist: ${requiredPath}`);
  }
}

// Wrangler auto-loads .env from its cwd. Stage only public output and Functions so
// local preview cannot inspect the repository's secret files.
const stageDirectory = mkdtempSync(join(tmpdir(), "wakadori-pages-preview-"));
cpSync(distDirectory, join(stageDirectory, "dist"), { recursive: true });
cpSync(functionsDirectory, join(stageDirectory, "functions"), { recursive: true });

const child = spawn(
  process.execPath,
  [
    wranglerBin,
    "pages",
    "dev",
    "dist",
    "--compatibility-date=2026-05-01",
    "--kv=WK_CACHE",
    "--port=8788",
    `--persist-to=${join(stageDirectory, ".wrangler-state")}`,
  ],
  {
    cwd: stageDirectory,
    stdio: "inherit",
  },
);

const forwardSignal = (signal) => {
  if (!child.killed) child.kill(signal);
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

child.on("exit", (code, signal) => {
  rmSync(stageDirectory, { recursive: true, force: true });
  if (signal) {
    process.exitCode = signal === "SIGINT" ? 130 : 143;
    return;
  }
  process.exitCode = code ?? 1;
});

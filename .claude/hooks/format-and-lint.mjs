// PostToolUse hook: formatea con Prettier y corrige con ESLint los archivos que Claude crea o edita.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const PRETTIER_EXT = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".md", ".mdx", ".css", ".json"]);
const ESLINT_EXT = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const IGNORED_DIRS = ["node_modules", ".next", ".git"];

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const filePath = input.tool_input?.file_path;
const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();

if (!filePath || !existsSync(filePath)) process.exit(0);

const relative = path.relative(projectDir, path.resolve(filePath));
const outsideProject = relative.startsWith("..") || path.isAbsolute(relative);
if (outsideProject || relative.split(path.sep).some((part) => IGNORED_DIRS.includes(part))) process.exit(0);

const ext = path.extname(filePath).toLowerCase();
const run = (script, args) =>
  spawnSync(process.execPath, [path.join(projectDir, script), ...args], { cwd: projectDir, encoding: "utf8" });

if (PRETTIER_EXT.has(ext)) {
  const result = run("node_modules/prettier/bin/prettier.cjs", ["--write", "--log-level", "warn", filePath]);
  if (result.status !== 0) {
    process.stderr.write(`Prettier falló en ${relative}:\n${result.stderr || result.stdout}`);
    process.exit(2);
  }
}

if (ESLINT_EXT.has(ext)) {
  const result = run("node_modules/eslint/bin/eslint.js", ["--fix", filePath]);
  if (result.status !== 0) {
    // exit 2 devuelve los errores a Claude para que los corrija
    process.stderr.write(`ESLint encontró problemas en ${relative}:\n${result.stdout}${result.stderr}`);
    process.exit(2);
  }
}

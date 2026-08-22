/**
 * Load protocol and reference markdown snippets for step prompts.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

export function readRepoFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing protocol file: ${relPath}`);
  }
  return fs.readFileSync(full, "utf8");
}

export function loadProtocolSnippets(relPaths) {
  return relPaths.map((p) => ({
    path: p,
    content: readRepoFile(p)
  }));
}

export function formatSnippetsForPrompt(snippets, maxChars = 6000) {
  let out = "";
  for (const { path: p, content } of snippets) {
    const chunk = `### Source: ${p}\n\n${content}\n\n`;
    if (out.length + chunk.length > maxChars) {
      out += `### Source: ${p}\n\n${content.slice(0, maxChars - out.length - 50)}…\n\n`;
      break;
    }
    out += chunk;
  }
  return out;
}

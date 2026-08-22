/**
 * Load KERNEL / GRILL / IFALSIFY / OUTPUT_FORMAT from ui/js/prompts.js without duplicating text.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_PATH = path.resolve(__dirname, "../../ui/js/prompts.js");

function extractConst(source, name) {
  const marker = `const ${name} = \``;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Could not extract ${name} from ${PROMPTS_PATH}`);
  }
  const contentStart = start + marker.length;
  const end = source.indexOf("`;", contentStart);
  if (end === -1) {
    throw new Error(`Unterminated template for ${name} in ${PROMPTS_PATH}`);
  }
  return source.slice(contentStart, end).trim();
}

let cache = null;

export function loadKernelBundle() {
  if (cache) return cache;
  const source = fs.readFileSync(PROMPTS_PATH, "utf8");
  cache = {
    kernel: extractConst(source, "KERNEL"),
    grill: extractConst(source, "GRILL_PROTOCOL"),
    ifalsify: extractConst(source, "IFALSIFY_PROTOCOL"),
    outputFormat: extractConst(source, "OUTPUT_FORMAT")
  };
  return cache;
}

export function buildSystemPrompt() {
  const b = loadKernelBundle();
  return [b.kernel, b.grill, b.ifalsify, b.outputFormat].join("\n");
}

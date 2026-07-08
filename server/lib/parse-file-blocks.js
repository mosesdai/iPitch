/**
 * Parse ===FILE: name=== … ===END=== blocks from LLM output.
 * Ported from ui/js/prompts.js (shared contract with browser UI).
 */

export function parseFileBlocks(text) {
  const files = [];
  const re = /===FILE:\s*(.+?)===\s*\n([\s\S]*?)===END===/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    files.push({ name: m[1].trim(), content: m[2].trim() });
  }
  if (files.length === 0 && text && text.trim()) {
    files.push({ name: "output.md", content: text.trim() });
  }
  return files;
}

export function formatFileBlock(name, content) {
  return `===FILE: ${name}===\n${content}\n===END===`;
}

export function mergeFiles(existing, incoming) {
  const map = new Map(existing.map((f) => [f.name, f]));
  for (const f of incoming) {
    map.set(f.name, f);
  }
  return [...map.values()];
}

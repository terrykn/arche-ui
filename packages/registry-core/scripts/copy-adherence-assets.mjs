/* Copies runtime JSON assets (keyword table + exemplar corpus) into dist. */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(root, "dist"), { recursive: true });
mkdirSync(join(root, "dist", "generation"), { recursive: true });
copyFileSync(join(root, "src", "prompt-keywords.json"), join(root, "dist", "prompt-keywords.json"));
copyFileSync(join(root, "src", "generation", "corpus.json"), join(root, "dist", "generation", "corpus.json"));
console.log("adherence assets copied");

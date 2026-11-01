/**
 * Copies non-TS assets (the token contract JSON) next to their compiled
 * counterparts in dist/, so runtime reads find them.
 */
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist/contract", { recursive: true });
copyFileSync("src/contract/token-contract.json", "dist/contract/token-contract.json");
mkdirSync("dist/fonts", { recursive: true });
copyFileSync("src/fonts/font-registry.json", "dist/fonts/font-registry.json");
mkdirSync("dist/icons", { recursive: true });
copyFileSync("src/icons/icon-registry.json", "dist/icons/icon-registry.json");
console.log("copied dist/contract/token-contract.json");
console.log("copied dist/fonts/font-registry.json");
console.log("copied dist/icons/icon-registry.json");

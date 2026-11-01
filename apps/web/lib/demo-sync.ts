"use client";

/** Cross-page demo index: the hero readout mirrors the Examples rotation. */
const KEY = "arche-demo-index";

export function readDemoIndex(): number {
  try {
    const raw = localStorage.getItem(KEY);
    const n = raw === null ? 0 : Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function writeDemoIndex(index: number) {
  try {
    localStorage.setItem(KEY, String(index));
  } catch {
    // ignore
  }
}

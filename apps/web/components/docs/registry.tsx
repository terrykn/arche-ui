import { Steps, Step, Code, Cards, Callout } from "@/components/docs/blocks";
import { PackageManagerInstall } from "@/components/docs/parts/package-manager-install";
import {
  BlocksIndex,
  ComponentsIndex,
  McpToolList,
  TokenContractTables,
} from "@/components/docs/parts";

/**
 * THE docs component registry.
 *
 * Docs pages are data files (see content/docs/*.ts). When a section needs a
 * layout markdown can't express, the data file names a component from this
 * map. Adding a new section type means: implement it, then add one line here.
 */
export const DOCS_BLOCKS = {
  // Content primitives used straight from data files.
  Steps,
  Step,
  Code,
  Cards,
  Callout,
  // Interactive sections.
  PackageManagerInstall,
  // Manifest- and contract-driven indexes.
  ComponentsIndex,
  BlocksIndex,
  McpToolList,
  TokenContractTables,
};

export type DocsBlockName = keyof typeof DOCS_BLOCKS;

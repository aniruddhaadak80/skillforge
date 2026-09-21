import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next.bak/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Harvester workspace: scratch checks, logs, and interim dumps stay local-only.
    "scripts/test-*.cjs",
    "scripts/check-*.cjs",
    "scripts/harvest.*.json",
    "scripts/harvest.*.log",
    "src/lib/harvested.partial.json",
  ]),
]);

export default eslintConfig;

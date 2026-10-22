import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CAP_EXACT,
  CAP_GITHUB,
  CAP_NPM,
  CAP_TOTAL,
  exactCeiling,
  npmAllowance,
  npmCeiling,
} from "./budget.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const harvestSource = readFileSync(path.join(root, "scripts", "harvest.mjs"), "utf8");

describe("harvest budgets", () => {
  it("bounds the npm phase by its own record count", () => {
    expect(npmAllowance(0)).toBe(CAP_NPM);
    expect(npmAllowance(CAP_NPM - 1)).toBe(1);
    expect(npmAllowance(CAP_NPM)).toBe(0);
    expect(npmAllowance(CAP_NPM + 100)).toBe(0);
  });

  it("reserves the exact-body budget from the phases that run before it", () => {
    expect(npmCeiling()).toBe(CAP_TOTAL - CAP_EXACT);
    expect(exactCeiling()).toBe(CAP_TOTAL);
    expect(npmCeiling()).toBeLessThan(CAP_TOTAL);
  });

  it("leaves the exact-body phase its slots even when GitHub undershoots", () => {
    // The bug this guards against: the npm phase used to be bounded by the
    // *total* length, so an undershooting GitHub phase let npm eat the exact
    // phase's reserved slots. With 2,809 GitHub records, npm may add at most
    // its own budget of 3,200 and must still leave CAP_EXACT free.
    const github = 2809;
    const npmTaken = Math.min(npmAllowance(0), npmCeiling() - github);
    expect(npmTaken).toBe(CAP_NPM);
    expect(github + npmTaken).toBeLessThanOrEqual(npmCeiling());
  });

  it("keeps the declared budgets consistent", () => {
    expect(CAP_GITHUB + CAP_NPM + CAP_EXACT).toBeLessThanOrEqual(CAP_TOTAL);
  });

  it("does not bound the npm phase by the total length any more", () => {
    expect(harvestSource).not.toMatch(/out\.length >= CAP_GITHUB \+ CAP_NPM/);
    expect(harvestSource).toMatch(/npmAllowance\(taken\) === 0/);
  });
});

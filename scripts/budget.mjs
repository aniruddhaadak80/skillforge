/**
 * Harvest budgets.
 *
 * Each phase of scripts/harvest.mjs is bounded by its own budget. The
 * previous version compared the *total* array length against the sum of the
 * GitHub and npm budgets, so the npm phase only respected `CAP_NPM` when the
 * GitHub phase had filled its budget exactly - and it ate the slots that had
 * been left for the exact-body phase, which runs last.
 *
 * Kept in its own module so the arithmetic can be unit tested without
 * running a harvest.
 */

export const CAP_TOTAL = 10000;
export const CAP_GITHUB = 6500;
export const CAP_NPM = 3200;
/**
 * Reserved for the verified exact SKILL.md / MCP bodies. That phase runs last,
 * so its share has to be held back from the phases before it.
 */
export const CAP_EXACT = 300;

/**
 * How many more npm records may be collected.
 *
 * `taken` is npm's own record count, so the npm budget is honoured no matter
 * how many GitHub records the first phase managed to find.
 */
export function npmAllowance(taken) {
  return Math.max(0, CAP_NPM - taken);
}

/**
 * The total array length the npm phase may not push past: the total cap minus
 * the budget reserved for the exact-body phase.
 */
export function npmCeiling() {
  return Math.max(0, CAP_TOTAL - CAP_EXACT);
}

/**
 * The total array length the exact-body phase may not push past.
 */
export function exactCeiling() {
  return CAP_TOTAL;
}

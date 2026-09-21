import type { SealRecord } from "./types";

/**
 * Hash-chained audit seals: seal(n) = SHA-384(prevSeal || canonicalJson(payload)).
 * Uses Web Crypto so the SAME code runs on the server, the edge, and in the
 * browser console — verifiable by replay anywhere.
 */

export const GENESIS = "GENESIS::skillforge::v1";

/** Deterministic JSON: sorted keys, recursive, no whitespace. */
export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha384Hex(input: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-384",
    new TextEncoder().encode(input),
  );
  return toHex(digest);
}

export async function sealFor(prev: string, payload: unknown): Promise<string> {
  return sha384Hex(`${prev}||${canonicalize(payload)}`);
}

export async function sealRecord(
  id: string,
  prev: string,
  payload: unknown,
): Promise<SealRecord> {
  const hash = await sealFor(prev, payload);
  return {
    id,
    prev: prev.slice(0, 24),
    hash,
    algo: "SHA-384",
    at: new Date().toISOString(),
    payload: canonicalize(payload),
  };
}

/** Replays the whole chain; returns per-record verdicts + overall status. */
export async function verifyChain(
  records: { id: string; prevFull: string; payload: unknown; hash: string }[],
): Promise<{ ok: boolean; checked: number; failures: string[] }> {
  const failures: string[] = [];
  for (const r of records) {
    const recomputed = await sealFor(r.prevFull, r.payload);
    if (recomputed !== r.hash) failures.push(r.id);
  }
  return { ok: failures.length === 0, checked: records.length, failures };
}

/** O(1) re-verification of one stored record: recompute from its stored prev. */
export async function verifyStored(
  prevFull: string,
  payload: unknown,
  expectedHash: string,
): Promise<boolean> {
  return (await sealFor(prevFull, payload)) === expectedHash;
}
export async function sealCatalog<T extends { id: string }>(
  items: T[],
  toPayload: (item: T) => unknown,
): Promise<{ seals: Record<string, string>; records: SealRecord[]; head: string }> {
  const seals: Record<string, string> = {};
  const records: SealRecord[] = [];
  let prev = GENESIS;
  for (const item of items) {
    const payload = toPayload(item);
    const hash = await sealFor(prev, payload);
    seals[item.id] = hash;
    records.push({
      id: item.id,
      prev: prev.slice(0, 24),
      hash,
      algo: "SHA-384",
      at: new Date().toISOString(),
      payload: canonicalize(payload),
    });
    prev = hash;
  }
  return { seals, records, head: prev };
}

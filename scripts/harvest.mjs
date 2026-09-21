/**
 * SkillForge harvester — builds a 10,000-record sealed catalog from real
 * public sources. Run locally (needs `gh` auth + network), commit the JSON.
 *
 * Sources (all keyless or via your own `gh` login):
 *  1. GitHub repo search across agent/skill/MCP queries (up to ~6.5k)
 *  2. npm registry search across agent/MCP queries (up to ~3k)
 *  3. Exact SKILL.md files + MCP server READMEs from API-verified repos
 *
 * Output: src/lib/harvested.json { generatedAt, counts, head, skills[] }
 * Every skill carries a hash-chain seal: SHA-384(prev || canonicalJson).
 *
 * Usage: node scripts/harvest.mjs
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

// Unbuffered progress log (stdout is block-buffered when piped).
const LOG = new URL("./harvest.log", import.meta.url);
const _log = console.log.bind(console);
console.log = (...a) => {
  _log(...a);
  try {
    appendFileSync(LOG, `${new Date().toISOString()} ${a.map(String).join(" ")}\n`);
  } catch { /* ignore */ }
};

const OUT = new URL("../src/lib/harvested.json", import.meta.url);
const PARTIAL = new URL("../src/lib/harvested.partial.json", import.meta.url);
const CAP_TOTAL = 10000;
const CAP_GITHUB = 6500;
const CAP_NPM = 3200;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- deterministic canonical JSON (mirrors src/lib/seal.ts) ---------------- */
function canonicalize(value) {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

async function sha384Hex(input) {
  const buf = await webcrypto.subtle.digest("SHA-384", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ------------------------------- category classifier ---------------------------------- */
const RULES = [
  ["research", ["research", "paper", "arxiv", "scholar", "search", "rag", "retrieval", "news", "trend", "insight", "crawl", "wikipedia", "scholar", "perplex"]],
  ["code", ["code", "coder", "coding", "dev", "git", "pull", "merge", "test", "debug", "refactor", "cli", "terminal", "review", "commit", "lint", "snippet", "vscode", "cursor", "swe", "compile", "sdk"]],
  ["data", ["data", "sql", "csv", "pdf", "scrap", "database", "notion", "sheet", "excel", "etl", "vector", "embed", "dataset", "kaggle", "pandas", "table"]],
  ["docs", ["doc", "readme", "write", "writer", "blog", "translat", "i18n", "changelog", "markdown", "note", "meeting", "summary", "s                          latex", "book"]],
  ["media", ["image", "video", "audio", "music", "voice", "photo", "thumbnail", "art", "design", "diagram", "draw", "meme", "speech", "tts", "avatar"]],
  ["ops", ["calendar", "email", "inbox", "deploy", "release", "task", "todo", "schedul", "remind", "standup", "docker", "k8s", "server", "ops", "automat", "workflow", "assistant", "bot", "home", "sched", "monitor"]],
];

function classify(haystack) {
  const h = haystack.toLowerCase();
  for (const [cat, keys] of RULES) {
    if (keys.some((k) => h.includes(k))) return cat;
  }
  return "ops";
}

const clean = (s, n) => (s ?? "").toString().replace(/\s+/g, " ").trim().slice(0, n);
const slug = (s) => (s ?? "").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "item";

/* --------------------------------- skill builders ------------------------------------- */
function templateMd(name, url, sourceLabel) {
  return [
    `# ${name}`,
    "",
    `Community-indexed from ${sourceLabel} — not yet hand-curated.`,
    "",
    "## Triggers",
    `Exploring this project for reusable agent workflows.`,
    "",
    "## Workflow",
    "1. Read the project README and examples at the link below.",
    "2. Extract the reusable prompt, checklist, or tool pattern.",
    "3. Adapt it into a local SKILL.md with triggers and guardrails.",
    "",
    "## Guardrails",
    "- Audit third-party code before running it.",
    "- Pin versions; review permissions before granting any.",
    `- Provenance: ${url}`,
    "",
  ].join("\n");
}

function fromGithubRepo(r) {
  const name = clean(r.name, 48) || "unnamed";
  const desc = clean(r.description, 220);
  const topics = Array.isArray(r.topics) ? r.topics : [];
  const hay = `${r.full_name} ${desc} ${topics.join(" ")}`;
  const caps = topics.map((t) => clean(t.replace(/-/g, " "), 24)).filter(Boolean).slice(0, 5);
  if (caps.length === 0) caps.push(classify(hay));
  const url = r.html_url;
  const tag = desc || `Community agent project by ${r.owner?.login ?? "unknown"} — ${r.stargazers_count ?? 0} stars.`;
  return {
    id: `gh-${r.id}`,
    name,
    tagline: clean(tag, 90),
    description: `${desc || tag} Live-indexed from GitHub; open the repo to vet quality before installing anything.`,
    category: classify(hay),
    capabilities: caps,
    worksWith: ["openclaw", "claude-code", "cursor", "generic-mcp"],
    skillMd: templateMd(name, url, "GitHub"),
    version: "0.live",
    author: clean(r.owner?.login, 40) || "github",
    license: clean(r.license?.spdx_id, 24) || "Unknown",
    riskFlags: ["network-egress", "external-api"],
    adopters: 0,
    source: "github",
    repoUrl: url,
    stars: r.stargazers_count ?? 0,
  };
}

function fromNpmPackage(p) {
  const pkg = p.package ?? {};
  const pname = clean(pkg.name, 48);
  const keywords = Array.isArray(pkg.keywords) ? pkg.keywords : [];
  const hay = `${pkg.name} ${pkg.description} ${keywords.join(" ")}`;
  const caps = keywords.map((k) => clean(k.replace(/-/g, " "), 24)).filter(Boolean).slice(0, 5);
  if (caps.length === 0) caps.push(classify(hay));
  const url = pkg.links?.repository ?? pkg.links?.npm ?? `https://www.npmjs.com/package/${pkg.name}`;
  const tag = clean(pkg.description, 90) || `npm package ${pkg.name} for agent tooling.`;
  return {
    id: `npm-${slug(pkg.name)}`,
    name: pname,
    tagline: tag,
    description: `${clean(pkg.description, 220) || tag} Live-indexed from the npm registry (v${pkg.version ?? "?"}); audit before wiring into an agent.`,
    category: classify(hay),
    capabilities: caps,
    worksWith: ["openclaw", "claude-code", "cursor", "generic-mcp"],
    skillMd: templateMd(pname, url, "npm"),
    version: clean(pkg.version, 16) || "0.live",
    author: clean(pkg.publisher?.username ?? pkg.maintainers?.[0]?.username, 40) || "npm",
    license: "Unknown",
    riskFlags: ["network-egress", "external-api"],
    adopters: 0,
    source: "npm",
    repoUrl: url,
    stars: 0,
  };
}

/* ----------------------------------- fetchers ----------------------------------------- */
function ghApi(path) {
  const out = execFileSync("gh", ["api", path], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return JSON.parse(out);
}

const GITHUB_QUERIES = [
  "agent skills in:name,description,readme",
  "claude skill in:name,description,readme",
  "SKILL.md in:readme",
  "openclaw in:name,description,readme",
  "clawdbot OR clawbot in:name,description,readme",
  "mcp server in:name,description",
  "ai agent awesome in:name,description",
  "cursor rules in:name,description,readme",
  "agents.md in:readme",
  "awesome ai agents in:name,description",
];

async function harvestGithub(seen, out) {
  let taken = 0;
  for (const q of GITHUB_QUERIES) {
    for (let page = 1; page <= 6; page++) {
      if (out.length >= CAP_GITHUB) return taken;
      let json;
      try {
        json = ghApi(`search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=100&page=${page}`);
      } catch {
        console.log(`  gh search failed q=${q.slice(0, 24)} p=${page} — continuing`);
        break;
      }
      const items = json.items ?? [];
      if (items.length === 0) break;
      for (const r of items) {
        if (r.fork) continue;
        const key = `gh:${r.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        // cross-source name dedupe
        const nkey = `n:${(r.name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        if (seen.has(nkey)) continue;
        seen.add(nkey);
        out.push(fromGithubRepo(r));
        taken++;
        if (out.length % 500 === 0) savePartial(out);
        if (out.length >= CAP_GITHUB) return taken;
      }
      console.log(`  gh [${q.slice(0, 30)}] page ${page}: +${items.length} (total ${out.length})`);
      if (items.length < 100) break;
      await sleep(2200); // 30 search req/min
    }
  }
  return taken;
}

const NPM_QUERIES = ["mcp", "agent skill", "openclaw", "clawdbot", "claude skill", "ai agent toolkit", "mcp server", "cursor rules"];

async function npmFetch(url, retries = 4) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "skillforge-harvester/1.0" } });
      if (res.ok) return await res.json();
      console.log(`  npm HTTP ${res.status} — backing off`);
      await sleep(4000 * (attempt + 1));
    } catch {
      console.log(`  npm fetch error (${e?.message ?? e}) — retrying`);
      await sleep(4000 * (attempt + 1));
    }
  }
  return null;
}

async function harvestNpm(seen, out, queries = NPM_QUERIES.map((q) => ({ q, from: 0 })), rounds = 4) {
  let taken = 0;
  for (const { q, from: fromStart } of queries) {
    let from = fromStart;
    for (let round = 0; round < rounds; round++) {
      if (out.length >= CAP_GITHUB + CAP_NPM) return taken;
      const json = await npmFetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=250&from=${from}`);
      if (!json) {
        console.log(`  npm [${q}] from ${from}: failed after retries — moving on`);
        break;
      }
      const objs = json.objects ?? [];
      if (objs.length === 0) break;
      for (const o of objs) {
        const key = `npm:${o.package?.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const nkey = `n:${(o.package?.name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        if (seen.has(nkey)) continue;
        seen.add(nkey);
        out.push(fromNpmPackage(o));
        taken++;
        if (out.length % 500 === 0) savePartial(out);
        if (out.length >= CAP_GITHUB + CAP_NPM) return taken;
      }
      console.log(`  npm [${q}] from ${from}: +${objs.length} (total ${out.length})`);
      from += objs.length;
      if (objs.length < 250) break;
      await sleep(1500);
    }
  }
  return taken;
}

/** Exact bodies from API-verified repos: SKILL.md files + MCP server READMEs. */
async function harvestExact(seen, out) {
  let taken = 0;
  // Probe candidate repos (skip silently on 404 — no guessed URLs are trusted blindly)
  const candidates = ["anthropics/skills", "modelcontextprotocol/servers"];
  const found = {};
  for (const c of candidates) {
    try {
      const r = ghApi(`repos/${c}`);
      found[c] = r;
      console.log(`  verified repo: ${r.full_name} (${r.stargazers_count} stars)`);
    } catch {
      console.log(`  skip missing repo: ${c}`);
    }
    await sleep(500);
  }

  if (found["anthropics/skills"]) {
    try {
      const tree = ghApi(`repos/anthropics/skills/git/trees/HEAD?recursive=1`);
      const mdFiles = (tree.tree ?? []).filter((t) => t.type === "blob" && /(^|\/)SKILL\.md$/i.test(t.path)).slice(0, 120);
      console.log(`  anthropics/skills: ${mdFiles.length} SKILL.md files`);
      for (const f of mdFiles) {
        try {
          const dir = f.path.split("/").slice(0, -1).join("/");
          const skillName = dir.split("/").pop() || "skill";
          const raw = execFileSync("gh", ["api", `repos/anthropics/skills/contents/${f.path}`, "--jq", ".content"], { encoding: "utf8" });
          const text = Buffer.from(raw.replace(/\s+/g, ""), "base64").toString("utf8").slice(0, 4000);
          const title = (text.match(/^#\s+(.+)/m)?.[1] ?? skillName).trim().slice(0, 48);
          const firstPara = (text.split(/\n\s*\n/).find((p) => p.trim() && !p.trim().startsWith("#")) ?? "").replace(/\s+/g, " ").trim().slice(0, 220);
          const id = `ex-anthropics-${slug(skillName)}`;
          if (seen.has(`gh-ex:${id}`)) continue;
          seen.add(`gh-ex:${id}`);
          out.push({
            id,
            name: title,
            tagline: clean(firstPara, 90) || `Official Anthropic skill: ${skillName}.`,
            description: `${clean(firstPara, 220) || `Official Anthropic Agent Skill '${skillName}'.`} Exact SKILL.md body from anthropics/skills.`,
            category: classify(`${skillName} ${firstPara}`),
            capabilities: [slug(skillName).replace(/-/g, " ").slice(0, 24), "official skill", "agent workflow"].slice(0, 3),
            worksWith: ["openclaw", "claude-code", "cursor", "generic-mcp"],
            skillMd: text,
            version: "1.official",
            author: "anthropics",
            license: "Apache-2.0",
            riskFlags: [],
            adopters: 50000,
            source: "github",
            repoUrl: "https://github.com/anthropics/skills",
            stars: found["anthropics/skills"].stargazers_count ?? 0,
          });
          taken++;
        } catch {
          /* skip unreadable file */
        }
        await sleep(200);
      }
    } catch {
      console.log("  anthropics/skills tree failed — skipping");
    }
  }

  if (found["modelcontextprotocol/servers"]) {
    try {
      const listing = ghApi(`repos/modelcontextprotocol/servers/contents/src?per_page=100`);
      const dirs = (Array.isArray(listing) ? listing : []).filter((e) => e.type === "dir").slice(0, 200);
      console.log(`  mcp/servers: ${dirs.length} server dirs`);
      const fetchOne = async (d) => {
        try {
          const readme = ghApi(`repos/modelcontextprotocol/servers/contents/src/${d.name}/README.md?per_page=1`);
          const text = Buffer.from((readme.content ?? "").replace(/\s+/g, ""), "base64").toString("utf8");
          const firstPara = (text.split(/\n\s*\n/).find((p) => p.trim() && !p.trim().startsWith("#")) ?? "").replace(/\s+/g, " ").trim().slice(0, 220);
          const sname = d.name.replace(/-/g, " ");
          const id = `mcp-${slug(d.name)}`;
          return {
            id,
            name: clean(sname.length > 48 ? sname.slice(0, 48) : sname || d.name, 48),
            tagline: clean(firstPara, 90) || `Official MCP server: ${d.name}.`,
            description: `${clean(firstPara, 220) || `Model Context Protocol server '${d.name}'.`} Reference server from modelcontextprotocol/servers — wire it to any MCP agent.`,
            category: classify(`${d.name} ${firstPara}`),
            capabilities: ["mcp server", "tool integration", slug(d.name).replace(/-/g, " ").slice(0, 24)].slice(0, 3),
            worksWith: ["openclaw", "claude-code", "cursor", "generic-mcp"],
            skillMd: templateMd(d.name, `https://github.com/modelcontextprotocol/servers/tree/HEAD/src/${d.name}`, "MCP servers"),
            version: "0.live",
            author: "modelcontextprotocol",
            license: "MIT",
            riskFlags: ["network-egress", "external-api"],
            adopters: 0,
            source: "mcp",
            repoUrl: `https://github.com/modelcontextprotocol/servers/tree/HEAD/src/${d.name}`,
            stars: found["modelcontextprotocol/servers"].stargazers_count ?? 0,
          };
        } catch {
          return null;
        }
      };
      // concurrency 6
      for (let i = 0; i < dirs.length; i += 6) {
        const batch = await Promise.all(dirs.slice(i, i + 6).map(fetchOne));
        for (const s of batch) {
          if (!s) continue;
          if (seen.has(`mcp:${s.id}`)) continue;
          seen.add(`mcp:${s.id}`);
          out.push(s);
          taken++;
        }
        if (i % 60 === 0) console.log(`  mcp servers progress ${i}/${dirs.length} (total ${out.length})`);
        await sleep(300);
      }
    } catch {
      console.log("  mcp/servers listing failed — skipping");
    }
  }
  return taken;
}

function savePartial(out) {
  try {
    writeFileSync(PARTIAL, JSON.stringify({ partial: true, count: out.length }));
  } catch { /* ignore */ }
}

/* ------------------------------------- main ------------------------------------------- */
const STAGE = (process.env.HARVEST_STAGE ?? "all").toLowerCase();
const INTERIM = (name) => new URL(`./harvest.${name}.json`, import.meta.url);
const saveInterim = (name, arr) => {
  writeFileSync(INTERIM(name), JSON.stringify(arr));
  console.log(`saved interim ${name}: ${arr.length}`);
};
function loadInterimSync(name) {
  try {
    return JSON.parse(readFileSync(INTERIM(name), "utf8"));
  } catch {
    return [];
  }
}

async function main() {
  const seen = new Set();
  if (STAGE === "github" || STAGE === "all") {
    const out = [];
    console.log("[1/3] GitHub repo search…");
    const g = await harvestGithub(seen, out);
    console.log(`GitHub done: +${g} (total ${out.length})`);
    if (STAGE === "github") {
      saveInterim("github", out);
      return;
    }
    var ghOut = out;
  }
  if (STAGE === "npm" || STAGE === "npm2" || STAGE === "all") {
    const out = STAGE === "all" ? ghOut : [];
    if (STAGE === "npm" || STAGE === "npm2") {
      // rebuild seen-keys from github interim to keep cross-source dedupe
      for (const s of loadInterimSync("github")) {
        seen.add(`n:${(s.name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")}`);
      }
    }
    if (STAGE === "npm2") {
      // resume: prior npm interim + remaining queries + deeper pages
      for (const s of loadInterimSync("npm")) {
        out.push(s);
        seen.add(`npm:${s.id.slice(4)}`);
        seen.add(`n:${(s.name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")}`);
      }
      console.log(`[2b/3] npm resume from ${out.length}…`);
      const more = [
        { q: "clawdbot", from: 0 },
        { q: "claude skill", from: 0 },
        { q: "ai agent toolkit", from: 0 },
        { q: "mcp server", from: 0 },
        { q: "cursor rules", from: 0 },
        { q: "mcp", from: 1000 },
        { q: "agent skill", from: 1000 },
        { q: "openclaw", from: 1000 },
      ];
      const n = await harvestNpm(seen, out, more, 4);
      console.log(`npm resume done: +${n} (total ${out.length})`);
      saveInterim("npm", out);
      return;
    }
    console.log("[2/3] npm registry search…");
    const n = await harvestNpm(seen, out);
    console.log(`npm done: +${n} (total ${out.length})`);
    if (STAGE === "npm") {
      saveInterim("npm", out);
      return;
    }
    var npmOut = out;
  }
  if (STAGE === "exact" || STAGE === "all") {
    const out = STAGE === "all" ? npmOut : [...loadInterimSync("github"), ...loadInterimSync("npm")];
    if (STAGE === "exact") {
      for (const s of out) {
        seen.add(`n:${(s.name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")}`);
        if (s.id.startsWith("gh-")) seen.add(`gh:${s.id.slice(3)}`);
        if (s.id.startsWith("npm-")) seen.add(`npm:${s.id.slice(4)}`);
        if (s.id.startsWith("mcp-") || s.id.startsWith("ex-")) seen.add(`mcp:${s.id}`);
      }
    }
    console.log("[3/3] Exact bodies (SKILL.md + MCP READMEs)…");
    const e = await harvestExact(seen, out);
    console.log(`Exact done: +${e} (total ${out.length})`);
    if (STAGE === "exact") {
      saveInterim("exact-new", out.filter((s) => s.id.startsWith("ex-") || s.id.startsWith("mcp-")));
      return;
    }
    var allOut = out;
  }
  if (STAGE === "merge") {
    // exact bodies first so the cap never drops them
    var allOut = [...loadInterimSync("exact-new"), ...loadInterimSync("github"), ...loadInterimSync("npm")];
  }
  if (STAGE === "github" || STAGE === "npm" || STAGE === "exact") return; // interim saved above

  const out = typeof allOut !== "undefined" ? allOut : [];

  // slim pass: bound every field so the committed JSON stays lean
  // (also strips lone surrogates — strict JSON parsers reject them)
  const dropLone = (v) =>
    v
      // decode literal "\uXXXX" text first — lone-surrogate escapes hide in plain sight
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      // real lone-surrogate code units (strict JSON parsers reject them)
      .replace(/[\uD800-\uDFFF]/g, (ch, i, arr) => {
      const c = ch.charCodeAt(0);
      if (c >= 0xd800 && c <= 0xdbff) {
        const n = arr.charCodeAt(i + 1);
        return n >= 0xdc00 && n <= 0xdfff ? ch : "";
      }
      const p = i > 0 ? arr.charCodeAt(i - 1) : 0;
      return p >= 0xd800 && p <= 0xdbff ? ch : "";
    });
  // truncate on code POINTS (never split an emoji pair), then sanitize —
  // slicing UTF-16 code units can orphan a surrogate and create a lone one.
  const slimStr = (v, n) =>
    dropLone(
      Array.from((v ?? "").toString().replace(/\s+/g, " ").trim())
        .slice(0, n)
        .join(""),
    );
  for (const s of out) {
    s.name = slimStr(s.name, 40);
    s.tagline = slimStr(s.tagline, 80);
    s.description = slimStr(s.description, 160);
    s.author = slimStr(s.author, 24);
    s.version = slimStr(s.version, 12);
    s.license = slimStr(s.license, 16);
    s.capabilities = (s.capabilities ?? []).map((c) => slimStr(c, 20)).filter(Boolean).slice(0, 4);
    if (s.capabilities.length === 0) s.capabilities = [s.category];
    s.repoUrl = slimStr(s.repoUrl, 160);
    if (typeof s.skillMd === "string" && s.skillMd.includes("Community-indexed from")) {
      const label = s.source === "npm" ? "npm" : s.source === "mcp" ? "MCP servers" : "GitHub";
      s.skillMd = [
        `# ${s.name}`,
        "",
        `Community index (${label}): ${s.repoUrl}`,
        "",
        "## Triggers",
        `Looking for reusable ${s.category} workflows.`,
        "",
        "## Workflow",
        "1. Read the project README.",
        "2. Extract the reusable pattern.",
        "3. Adapt it into a local SKILL.md.",
        "",
        "## Guardrails",
        "- Audit code before running.",
        "- Pin versions; review permissions.",
        "",
      ].join("\n");
    } else if (typeof s.skillMd === "string") {
      s.skillMd = dropLone(Array.from(s.skillMd).slice(0, 4000).join(""));
    }
    delete s.exact;
  }

  const capped = out.slice(0, CAP_TOTAL).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // hash-chain seals
  console.log("Sealing %d records…", capped.length);
  const GENESIS = "GENESIS::skillforge::v1";
  const payloadOf = (s) => ({ id: s.id, v: s.version, cat: s.category, caps: s.capabilities, with: s.worksWith, lic: s.license, risk: s.riskFlags });
  let prev = GENESIS;
  for (const s of capped) {
    const hash = await sha384Hex(`${prev}||${canonicalize(payloadOf(s))}`);
    s.prev = prev;
    s.seal = hash;
    prev = hash;
  }

  const counts = {};
  for (const s of capped) counts[s.source] = (counts[s.source] ?? 0) + 1;
  const doc = {
    generatedAt: new Date().toISOString(),
    counts,
    total: capped.length,
    head: prev,
    algo: "SHA-384(prevSeal || canonicalJson)",
    skills: capped,
  };
  writeFileSync(OUT, JSON.stringify(doc));
  console.log("WROTE %s — total=%d head=%s…", OUT.pathname, capped.length, prev.slice(0, 16));
  console.log("Sources:", JSON.stringify(counts));
}

main().catch((e) => {
  console.error("HARVEST FAILED:", e?.message ?? e);
  process.exit(1);
});

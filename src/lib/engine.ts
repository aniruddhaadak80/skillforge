import type {
  BundleResult,
  ScoreFactor,
  SearchFilters,
  Skill,
} from "./types";

/**
 * SkillForge deterministic engine — keyless, explainable, dependency-free.
 * The SAME functions serve the UI, the REST API, and the MCP tools.
 */

const RISK_WEIGHT: Record<string, number> = {
  "exec-code": 22,
  "writes-files": 10,
  "network-egress": 8,
  "external-api": 6,
  "reads-secrets": 16,
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function hasSection(md: string, token: string): boolean {
  return md.toLowerCase().includes(token);
}

export interface SkillScore {
  score: number;
  safety: number;
  grade: "S" | "A" | "B" | "C";
  factors: ScoreFactor[];
}

export function scoreSkill(skill: Skill): SkillScore {
  const factors: ScoreFactor[] = [];

  // 1. Documentation completeness (0–20)
  const md = skill.skillMd;
  const sections = ["## triggers", "## workflow", "## guardrails"].filter((s) =>
    hasSection(md, s),
  ).length;
  const lengthPts = clamp(Math.round((md.length / 900) * 8), 0, 8);
  const docsPts = sections * 4 + lengthPts;
  factors.push({
    name: "Documentation",
    points: Math.min(20, docsPts),
    max: 20,
    detail: `${sections}/3 required SKILL.md sections, ${md.length} chars`,
  });

  // 2. Capability breadth (0–15)
  const capPts = clamp(skill.capabilities.length * 4, 0, 15);
  factors.push({
    name: "Capability breadth",
    points: capPts,
    max: 15,
    detail: `${skill.capabilities.length} declared capabilities`,
  });

  // 3. Multi-agent compatibility (0–15)
  const compatPts = clamp(skill.worksWith.length * 4 - 1, 0, 15);
  factors.push({
    name: "Agent compatibility",
    points: compatPts,
    max: 15,
    detail: `Works with ${skill.worksWith.join(", ")}`,
  });

  // 4. License openness (0–10)
  const openLic = /mit|apache|bsd|isc|cc0|unlicense/i.test(skill.license);
  factors.push({
    name: "License openness",
    points: openLic ? 10 : 4,
    max: 10,
    detail: openLic ? `${skill.license} — reuse freely` : `${skill.license} — check terms`,
  });

  // 5. Community signal (0–20)
  const signal = skill.stars ?? skill.adopters;
  const signalPts = clamp(Math.round(Math.log10(signal + 1) * 8), 0, 20);
  factors.push({
    name: "Community signal",
    points: signalPts,
    max: 20,
    detail:
      skill.stars !== undefined
        ? `${skill.stars} GitHub stars`
        : `${skill.adopters} registry installs`,
  });

  // 6. Safety posture (0–20) — inverse of risk surface
  const risk = skill.riskFlags.reduce((sum, f) => sum + (RISK_WEIGHT[f] ?? 5), 0);
  const safetyPts = clamp(20 - Math.round(risk / 2), 0, 20);
  factors.push({
    name: "Safety posture",
    points: safetyPts,
    max: 20,
    detail:
      skill.riskFlags.length === 0
        ? "No risky capabilities declared"
        : `Risk surface: ${skill.riskFlags.join(", ")}`,
  });

  const score = factors.reduce((s, f) => s + f.points, 0);
  const safety = clamp(
    100 - skill.riskFlags.reduce((s, f) => s + (RISK_WEIGHT[f] ?? 5), 0) * 2,
    5,
    100,
  );
  const grade: SkillScore["grade"] =
    score >= 85 ? "S" : score >= 70 ? "A" : score >= 50 ? "B" : "C";
  return { score, safety, grade, factors };
}

/** Tokenized relevance: name ×5, tagline ×3, description ×2, caps/category ×4. */
export function relevanceOf(skill: Skill, tokens: string[]): number {
  if (tokens.length === 0) return 1;
  const name = skill.name.toLowerCase();
  const tag = skill.tagline.toLowerCase();
  const desc = skill.description.toLowerCase();
  const caps = skill.capabilities.join(" ").toLowerCase();
  let rel = 0;
  for (const t of tokens) {
    if (name.includes(t)) rel += 5;
    if (tag.includes(t)) rel += 3;
    if (desc.includes(t)) rel += 2;
    if (caps.includes(t)) rel += 4;
    if (skill.category.includes(t)) rel += 4;
  }
  return rel;
}

export function searchSkills(skills: Skill[], filters: SearchFilters): Skill[] {
  const tokens = filters.query
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((t) => t.length > 1);
  const scored = skills
    .map((s) => ({ skill: s, rel: relevanceOf(s, tokens), ...scoreSkill(s) }))
    .filter(({ rel }) => rel > 0)
    .filter(({ skill }) =>
      filters.category === "all" ? true : skill.category === filters.category,
    )
    .filter(({ skill }) =>
      filters.platform === "all" ? true : skill.worksWith.includes(filters.platform),
    )
    .filter(({ safety }) => safety >= filters.minSafety);

  const by = {
    score: (a: { score: number }, b: { score: number }) => b.score - a.score,
    safety: (a: { safety: number }, b: { safety: number }) => b.safety - a.safety,
    adopters: (
      a: { skill: Skill },
      b: { skill: Skill },
    ) => (b.skill.stars ?? b.skill.adopters) - (a.skill.stars ?? a.skill.adopters),
    name: (a: { skill: Skill }, b: { skill: Skill }) =>
      a.skill.name.localeCompare(b.skill.name),
  }[filters.sort];

  return scored
    .sort((a, b) => {
      if (tokens.length > 0 && b.rel !== a.rel) return b.rel - a.rel;
      return by(a, b);
    })
    .map((r) => r.skill);
}

const CATEGORY_CONFLICT = "overlap";

export function composeBundle(skills: Skill[], ids: string[]): BundleResult {
  const picked = ids
    .map((id) => skills.find((s) => s.id === id))
    .filter((s): s is Skill => Boolean(s));
  const capabilities = [...new Set(picked.flatMap((s) => s.capabilities))];

  // Conflict heuristic: two skills in the same category sharing a capability stem
  const conflicts: string[] = [];
  for (let i = 0; i < picked.length; i++) {
    for (let j = i + 1; j < picked.length; j++) {
      const a = picked[i];
      const b = picked[j];
      if (a.category !== b.category) continue;
      const shared = a.capabilities.filter((c) =>
        b.capabilities.some(
          (d) => c.split(" ")[0] === d.split(" ")[0] || c === d,
        ),
      );
      if (shared.length > 0) {
        conflicts.push(
          `${CATEGORY_CONFLICT}: ${a.id} + ${b.id} both cover ${shared[0]} — keep the higher-scored one`,
        );
      }
    }
  }

  const scores = picked.map((s) => scoreSkill(s));
  const mean =
    picked.length === 0
      ? 0
      : Math.round(scores.reduce((s, x) => s + x.score, 0) / picked.length);
  const diversity = new Set(picked.map((s) => s.category)).size;
  const combinedScore = clamp(mean + diversity * 2 - conflicts.length * 4, 0, 100);
  const combinedSafety =
    picked.length === 0
      ? 100
      : Math.round(scores.reduce((s, x) => s + x.safety, 0) / picked.length);

  const installScript = [
    "# SkillForge bundle — paste into any shell, zero dependencies",
    "# Installs every skill as SKILL.md under ./skills/<id>/",
    `mkdir -p ${picked.map((s) => `skills/${s.id}`).join(" ") || "skills"}`,
    ...picked.map(
      (s) =>
        `# ${s.name} (${s.version}) — ${s.tagline}\n` +
        `curl -fsSL "https://skillforge.vercel.app/api/skills/${s.id}/skill.md" -o skills/${s.id}/SKILL.md`,
    ),
  ].join("\n");

  return {
    ids: picked.map((s) => s.id),
    capabilities,
    conflicts,
    combinedScore,
    combinedSafety,
    installScript,
    mcpBundle: {
      bundle: "skillforge-bundle/1",
      skills: picked.map((s) => ({
        id: s.id,
        version: s.version,
        capabilities: s.capabilities,
        worksWith: s.worksWith,
      })),
    },
    seal: "",
  };
}

export function installCommand(skill: Skill): string {
  return `curl -fsSL "https://skillforge.vercel.app/api/skills/${skill.id}/skill.md" -o skills/${skill.id}/SKILL.md`;
}

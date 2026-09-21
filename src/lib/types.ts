/** Shared domain types for SkillForge. No runtime imports — safe anywhere. */

export type AgentPlatform = "openclaw" | "claude-code" | "cursor" | "generic-mcp";

export type SkillCategory =
  | "research"
  | "code"
  | "data"
  | "docs"
  | "media"
  | "ops";

export type SkillSource = "curated" | "github" | "hn";

export interface Skill {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: SkillCategory;
  capabilities: string[];
  worksWith: AgentPlatform[];
  /** SKILL.md-compatible body shown in preview + installable file */
  skillMd: string;
  version: string;
  author: string;
  license: string;
  /** Machine-readable risk surface, drives the safety score */
  riskFlags: string[];
  adopters: number;
  source: SkillSource;
  repoUrl?: string;
  stars?: number;
}

export interface ScoreFactor {
  name: string;
  points: number;
  max: number;
  detail: string;
}

export interface ScoredSkill extends Skill {
  score: number;
  safety: number;
  grade: "S" | "A" | "B" | "C";
  factors: ScoreFactor[];
  seal: string;
  sealedAt: string;
}

export interface SealRecord {
  id: string;
  prev: string;
  hash: string;
  algo: "SHA-384";
  at: string;
  payload: string;
}

export interface BundleResult {
  ids: string[];
  capabilities: string[];
  conflicts: string[];
  combinedScore: number;
  combinedSafety: number;
  installScript: string;
  mcpBundle: Record<string, unknown>;
  seal: string;
}

export interface SearchFilters {
  query: string;
  category: SkillCategory | "all";
  platform: AgentPlatform | "all";
  minSafety: number;
  sort: "score" | "safety" | "adopters" | "name";
}

export const CATEGORIES: { id: SkillCategory; label: string; color: string }[] = [
  { id: "research", label: "Research", color: "#22d3ee" },
  { id: "code", label: "Code", color: "#a78bfa" },
  { id: "data", label: "Data", color: "#34d399" },
  { id: "docs", label: "Docs", color: "#fbbf24" },
  { id: "media", label: "Media", color: "#fb7185" },
  { id: "ops", label: "Ops", color: "#94a3b8" },
];

export const PLATFORMS: { id: AgentPlatform; label: string }[] = [
  { id: "openclaw", label: "OpenClaw" },
  { id: "claude-code", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "generic-mcp", label: "Any MCP agent" },
];

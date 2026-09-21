<div align="center">

# ⚒️ SkillForge

**The free open registry for reusable AI agent skills — search, safety-score, compose, install.**

[![Live Demo](https://img.shields.io/badge/demo-live-34d399?style=for-the-badge&logo=vercel)](https://skillforge-aniruddha-adaks-projects.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-22d3ee?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![MCP Ready](https://img.shields.io/badge/MCP-tools%2Flist-34d399?style=for-the-badge)](https://skillforge-aniruddha-adaks-projects.vercel.app/api/mcp)
[![Feeds](https://img.shields.io/badge/feeds-github%20%2B%20HN-fbbf24?style=for-the-badge)](https://skillforge-aniruddha-adaks-projects.vercel.app/api/skills)

[Live App](https://skillforge-aniruddha-adaks-projects.vercel.app) · [API](https://skillforge-aniruddha-adaks-projects.vercel.app/api/skills) · [MCP](https://skillforge-aniruddha-adaks-projects.vercel.app/api/mcp) · [Issues](https://github.com/aniruddhaadak80/skillforge/issues)

</div>

> **The pick:** reusable agent skills are where agentic AI is bottlenecking — every OpenClaw / Claude Code / Cursor user rewrites the same prompts, while MCP made agents tool-hungry and SKILL.md made knowledge portable. SkillForge is the free, keyless, offline-first registry that scores, seals, and serves skills to humans *and* agents. The 10-second wow: type `pdf`, watch a safety-scored skill card appear with its seal, copy one curl line — or let your agent do it over MCP.

---

## ✨ Features

- 🔍 **Advanced search** — full-text relevance + category, platform, safety-floor, and ranking filters
- 🧮 **SkillScore engine** — deterministic, keyless, explainable: 6 itemized factors, S/A/B/C grades, separate 0–100 safety score
- 🤖 **Agent-native MCP** — JSON-RPC `initialize` / `tools/list` / `tools/call` with 5 tools + live in-page console
- 🔗 **Hash-chained seals** — `SHA-384(prevSeal ‖ canonicalJson)` on every record, replay-verifiable
- 📦 **Bundle composer** — compatibility checks, combined score, install script, MCP bundle export
- 📄 **One-command install** — raw `SKILL.md` per skill for OpenClaw, Claude Code, Cursor, any MCP agent
- 📡 **Live feeds, sealed fallback** — GitHub + Hacker News hourly; 24 curated skills keep everything alive offline
- 🗺️ **Learn the ladder** — docs + safety briefing from prompts to AGI, recursive self-improvement, and ASI
- 🕸️ **Interactive skill network** — canvas hero visual (deliberately *not* a globe: the network *is* the domain)

---

## 🏗️ System architecture

```mermaid
flowchart LR
    H[Human in browser] --> UI[Next.js pages]
    A[AI agent] --> MCP[MCP JSON-RPC /api/mcp]
    UI --> REST[REST /api/skills /score /seals]
    MCP --> ENG[SkillScore engine]
    REST --> ENG
    ENG --> SEAL[SHA-384 seal chain]
    SEAL --> CAT[Sealed catalog]
    FEED[GitHub + HN feeds] --> CAT
    classDef live fill:#22d3ee,color:#04060c;
    classDef ai fill:#a78bfa,color:#04060c;
    classDef agent fill:#34d399,color:#04060c;
    classDef infra fill:#94a3b8,color:#04060c;
    class H,FEED live;
    class UI,REST infra;
    class ENG,SEAL,CAT ai;
    class A,MCP agent;
```

## 📡 Data pipeline

```mermaid
flowchart TB
    GH[GitHub repo search] --> NORM[Normalize to Skill type]
    HN[HN Algolia stories] --> NORM
    CUR[24 curated skills] --> NORM
    NORM --> SCORE[Score: 6 factors + safety]
    SCORE --> CHAIN[Seal chain in id order]
    CHAIN --> SERVE[Serve UI + REST + MCP]
    FAIL{Feed failed?} -.->|yes| CUR
    GH -.-> FAIL
    HN -.-> FAIL
    classDef live fill:#22d3ee,color:#04060c;
    classDef ai fill:#a78bfa,color:#04060c;
    classDef caution fill:#fbbf24,color:#04060c;
    classDef infra fill:#94a3b8,color:#04060c;
    class GH,HN live;
    class NORM,SCORE,CHAIN ai;
    class FAIL caution;
    class CUR,SERVE infra;
```

## 🧮 Engine flow

```mermaid
flowchart LR
    IN[Skill record] --> D[Docs 20]
    IN --> C[Caps 15]
    IN --> X[Compat 15]
    IN --> L[License 10]
    IN --> S[Signal 20]
    IN --> R[Safety 20]
    D --> TOT[Total + grade S/A/B/C]
    C --> TOT
    X --> TOT
    L --> TOT
    S --> TOT
    R --> TOT
    R --> SAFE[Safety 0-100]
    classDef ai fill:#a78bfa,color:#04060c;
    classDef risk fill:#fb7185,color:#04060c;
    classDef ok fill:#34d399,color:#04060c;
    classDef infra fill:#94a3b8,color:#04060c;
    class IN infra;
    class D,C,X,L,S ai;
    class R,TOT risk;
    class SAFE ok;
```

## 🤖 Agent (MCP) sequence

```mermaid
sequenceDiagram
    participant Agent as AI agent
    participant MCP as /api/mcp
    participant Eng as Engine
    participant Chain as Seal chain
    Agent->>MCP: initialize
    MCP-->>Agent: protocolVersion + serverInfo
    Agent->>MCP: tools/list
    MCP-->>Agent: 5 tools
    Agent->>MCP: tools/call search_skills pdf
    MCP->>Eng: search + score
    MCP-->>Agent: ranked skills
    Agent->>MCP: tools/call compose_bundle
    MCP->>Eng: compat check
    MCP->>Chain: seal bundle
    MCP-->>Agent: bundle + seal
```

## 🔗 Integrity / seal chain

```mermaid
flowchart LR
    G[GENESIS] --> H1[hash skill 1]
    H1 --> H2[hash skill 2]
    H2 --> H3[hash skill n]
    H3 --> HEAD[chain head]
    V[POST /api/seals/verify] --> R[recompute + compare]
    HEAD --> R
    classDef ai fill:#a78bfa,color:#04060c;
    classDef agent fill:#34d399,color:#04060c;
    classDef infra fill:#94a3b8,color:#04060c;
    class G,H1,H2,H3 ai;
    class HEAD,V agent;
    class R infra;
```

## 🚀 Deployment pipeline

```mermaid
flowchart TB
    PUSH[push to main] --> CI[CI: node 22, npm ci, lint, build]
    CI --> V[vercel --prod]
    V --> ALIAS[verified alias]
    ALIAS --> CHK{HTTP verify}
    CHK -->|200s + counts| DONE[Live]
    CHK -->|fail| FIX[fix + redeploy]
    FIX --> V
    classDef infra fill:#94a3b8,color:#04060c;
    classDef ok fill:#34d399,color:#04060c;
    classDef caution fill:#fbbf24,color:#04060c;
    classDef risk fill:#fb7185,color:#04060c;
    class PUSH,CI,V infra;
    class ALIAS caution;
    class DONE ok;
    class CHK,FIX risk;
```

## 🧭 User journey

```mermaid
flowchart LR
    LAND[Land on hero] --> SEARCH[Search: pdf]
    SEARCH --> OPEN[Open skill page]
    OPEN --> SCORE[Read score + seal]
    SCORE --> INSTALL[1-line install]
    INSTALL --> BUNDLE[Compose bundle]
    BUNDLE --> VERIFY[Verify seals]
    classDef live fill:#22d3ee,color:#04060c;
    classDef ai fill:#a78bfa,color:#04060c;
    classDef agent fill:#34d399,color:#04060c;
    class LAND,SEARCH live;
    class OPEN,SCORE ai;
    class INSTALL,BUNDLE,VERIFY agent;
```

---

## 🚀 Quickstart

Zero env vars. No keys. Free forever.

```bash
git clone https://github.com/aniruddhaadak80/skillforge.git
cd skillforge
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To install a skill into any agent:

```bash
curl -fsSL "https://skillforge-aniruddha-adaks-projects.vercel.app/api/skills/pdf-miner/skill.md" -o skills/pdf-miner/SKILL.md
```

---

## 🔌 API

| Endpoint | What |
|---|---|
| `GET /api/health` | Service status + catalog size |
| `GET /api/skills?q=&category=&platform=&minSafety=&sort=&limit=` | Scored + sealed catalog |
| `GET /api/skills/:id` | One skill + related + chain head |
| `GET /api/skills/:id/skill.md` | Raw SKILL.md (install target) |
| `POST /api/score` | Score by `{id}` or inline `{skill}` |
| `POST /api/seals/verify` | Replay-verify with `{ids}` |
| `GET/POST /api/mcp` | MCP JSON-RPC: `initialize`, `tools/list`, `tools/call` |

```bash
# Search
curl -s "https://skillforge-aniruddha-adaks-projects.vercel.app/api/skills?q=pdf&sort=score&limit=3"

# Score
curl -s https://skillforge-aniruddha-adaks-projects.vercel.app/api/score -H "Content-Type: application/json" \
  -d '{"id":"pr-reviewer"}'

# Verify seals
curl -s https://skillforge-aniruddha-adaks-projects.vercel.app/api/seals/verify -H "Content-Type: application/json" \
  -d '{"ids":["pr-reviewer","pdf-miner"]}'

# MCP as an agent would call it
curl -s https://skillforge-aniruddha-adaks-projects.vercel.app/api/mcp -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"search_skills","arguments":{"query":"pdf","limit":3}}}'
```

**Agent setup (`mcp.json`):**

```json
{
  "mcpServers": {
    "skillforge": {
      "url": "https://skillforge-aniruddha-adaks-projects.vercel.app/api/mcp",
      "transport": "http-json-rpc"
    }
  }
}
```

A ready-made copy lives at [`public/mcp.json`](public/mcp.json). Tools: `search_skills`, `get_skill`, `score_skill`, `compose_bundle`, `verify_seal`.

---

## 📁 Project map

```
src/
  app/                  # 7 routes: / explore skill/[id] compose safety docs + not-found
    api/                # health, skills, skills/[id], skill.md, score, mcp, seals/verify
  components/           # Nav Footer Hero SkillGraph Ticker SkillCard ScoreBars
                        # McpConsole InstallTabs SearchExplorer BundleComposer
  lib/                  # types · fallback (24 sealed skills) · engine (score/search/compose)
                        # seal (SHA-384 chain) · registry (feeds + merge + seal)
```

**3D decision (one line):** no globe — a planet would be decoration for a skill registry, so the hero is a lightweight interactive 2D skill-dependency network (agent hub → categories → skills) with a static accessible label, zero `three` imports.

---

## 🗺️ Roadmap

**Now — deepen the forge** (more skills, sharper scores):

- [ ] 100 curated skills across 10 categories — wow: every common agent job covered
- [ ] Community skill PR template with auto-score CI comment — wow: contributors see their grade instantly
- [ ] Per-platform install telemetry (opt-in, anonymous) — wow: adopters become real, not seeded

```mermaid
flowchart LR
    MORE[100 skills] --> AUTO[auto-score CI]
    AUTO --> TEL[opt-in telemetry]
    classDef live fill:#22d3ee,color:#04060c;
    classDef ai fill:#a78bfa,color:#04060c;
    classDef agent fill:#34d399,color:#04060c;
    class MORE live;
    class AUTO ai;
    class TEL agent;
```

**Next — agent autonomy** (agents shop alone, safely):

- [ ] MCP `install_skill` tool returning signed bundles — wow: agents self-provision skills
- [ ] Policy packs (strict / balanced / yolo) gating installs by safety floor — wow: one-click risk posture
- [ ] Skill versioning + diff view between versions — wow: updates you can audit

```mermaid
flowchart LR
    INST[install_skill tool] --> POL[policy packs]
    POL --> DIFF[version diffs]
    classDef agent fill:#34d399,color:#04060c;
    classDef caution fill:#fbbf24,color:#04060c;
    classDef ai fill:#a78bfa,color:#04060c;
    class INST agent;
    class POL caution;
    class DIFF ai;
```

**Later — ecosystem** (the registry becomes infrastructure):

- [ ] Federated mirrors with cross-signed heads — wow: no single point of trust
- [ ] Skill test-harness: run guardrails against adversarial prompts — wow: safety you can execute
- [ ] Leaderboards + maintainer reputation from downstream usage — wow: quality compounds

```mermaid
flowchart LR
    FED[federation] --> HARN[test harness]
    HARN --> REP[reputation]
    classDef infra fill:#94a3b8,color:#04060c;
    classDef risk fill:#fb7185,color:#04060c;
    classDef ok fill:#34d399,color:#04060c;
    class FED infra;
    class HARN risk;
    class REP ok;
```

---

## ⚠️ Safety disclaimer

Skills are executable agency: a skill can read files, call APIs, and spend your money. SkillForge scores declared risk and seals records, but **scores are heuristics, not guarantees** — always read the SKILL.md, check the safety number, install least-privilege first, and never paste secrets into a skill. See the [/safety briefing](https://skillforge-aniruddha-adaks-projects.vercel.app/safety).

## 🤝 Contributing

PRs welcome — especially new skills. Read [CONTRIBUTING.md](CONTRIBUTING.md), keep the checklist green, and watch CI auto-comment your skill's grade. Security reports: [SECURITY.md](SECURITY.md).

## 📜 License

MIT — see [LICENSE](LICENSE). Free for humans and agents alike.

## 🙏 Attribution

Live signals: [GitHub REST Search API](https://docs.github.com/en/rest) and [Hacker News Algolia API](https://hn.algolia.com/api) (both keyless). Skill format compatible with the `SKILL.md` convention popularized by Anthropic Agent Skills. Built with Next.js, Tailwind, Framer Motion, Lucide.

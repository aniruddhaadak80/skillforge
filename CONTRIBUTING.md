# Contributing to SkillForge

Thanks for forging with us. Every skill you add makes thousands of agents smarter — and safer.

## Ways to contribute

1. **New skills** (highest value): add a record to `src/lib/fallback.ts`.
2. **Score engine tuning**: improve `src/lib/engine.ts` with better factors or weights.
3. **Live feeds**: new keyless public sources in `src/lib/registry.ts`.
4. **Docs, design, a11y**: always welcome.

## Adding a skill — checklist

- [ ] Unique kebab-case `id`, clear `name` + one-line `tagline`.
- [ ] `skillMd` has all three sections: `## Triggers`, `## Workflow`, `## Guardrails`.
- [ ] Honest `riskFlags` (`exec-code`, `writes-files`, `network-egress`, `external-api`, `reads-secrets`, or `[]`).
- [ ] `capabilities` (3–5), `worksWith` platforms you actually thought about, permissive `license`.
- [ ] `adopters` starts at `0` for community submissions (curators calibrate later).
- [ ] `npm run lint` and `npm run build` both pass.

## Pull request process

1. Fork, branch (`feat/<skill-id>` or `fix/<thing>`), commit with a clear message.
2. Open a PR against `main` describing the skill and its risk surface.
3. CI runs lint + build on Node 22. Fix red before review.
4. A maintainer checks scoring honesty, guardrail quality, and license — then merges.

## Code style

- TypeScript strict, `import type` for types, no unused imports.
- Pure functions in `src/lib` (engine/seal run in UI, API, and MCP alike).
- No secrets, no API keys, no paywalled dependencies — the core experience stays free.
- No raw `'` / `"` / `>` / `}` in JSX text (eslint `react/no-unescaped-entities`).

## Questions?

Open an [issue](https://github.com/aniruddhaadak80/skillforge/issues) — beginners welcome.

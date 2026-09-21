# Security Policy

## Supported versions

SkillForge `main` is the supported line. Security fixes ship as soon as they are verified.

## Reporting a vulnerability

**Do not open a public issue for vulnerabilities.** Instead:

1. Open a [private security advisory](https://github.com/aniruddhaadak80/skillforge/security/advisories/new), or
2. Open a normal issue titled "Security contact request" with no details, and a maintainer will reach out.

We aim to acknowledge within 72 hours and resolve critical issues within 14 days.

## Scope notes specific to this project

- **Skill supply chain**: a malicious `SKILL.md` is the top threat model. Reports about prompt-injection vectors in curated skills, seal-bypass paths, or MCP tool abuse are especially valued.
- **Scores are heuristics**: SkillScore and safety numbers guide judgment; they are not security boundaries. Do not rely on them as access control.
- **No secrets in scope**: the app uses zero API keys by design. If you find a leaked token, rotate it and tell us.

## Safe harbor

Good-faith research against the live demo is welcome. Do not exfiltrate data, degrade the service, or attack other users.

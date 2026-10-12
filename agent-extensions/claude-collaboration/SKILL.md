---
name: claude-collaboration
description: Use repository Claude agents alongside Codex when the user requests Claude collaboration on vizbox projects.
---

Read `.claude/agents/vizbox-manager.md` for repository conventions. For travel UI use `.claude/agents/japan-travel-designer.md`. Keep projects independent and documentation Japanese.

Inspect `claude --help`, then invoke `claude --agent <name> -p` with the bounded assignment on stdin. Prefer read-only tools for reviews; partition file ownership for implementation. Never bypass permissions or delegate credentials, pushes, deployments, or unrelated changes. Verify process completion and actual results. If unavailable, report the failure and continue in Codex. This repository-local skill can be explicitly invoked by its path; it does not claim automatic global installation.

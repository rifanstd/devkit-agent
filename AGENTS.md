# AGENTS.md

## What This Repo Is

Agent and skill definitions for OpenCode's multi-agent coding pipeline. No executable code — all markdown files that define agent behaviors, prompts, and skill workflows.

- **Origin:** `https://github.com/rifanstd/devkit-agent.git`
- **Branch:** `main`

## Directory Structure

```
agents/           # Agent definitions (orchestrator + 4 subagents)
  orchestrator.md # Primary agent — entry point for all requests
  analyst.md      # Requirement analysis (subagent)
  planner.md      # Implementation planning (subagent)
  programmer.md   # Code implementation (subagent)
  reviewer.md     # Code review and testing (subagent)
skills/           # Skill definitions (loaded by agents at runtime)
  brainstorming/             # Requirement analysis workflow (has scripts/ for visual companion)
  receiving-code-review/     # Handling review feedback
  requesting-code-review/    # Code review methodology
  subagent-driven-development/ # Dispatching subagents for plan execution
  systematic-debugging/      # Debugging methodology (has scripts/)
  verification-before-completion/ # Evidence before claims
  writing-plans/             # Implementation plan creation
    SKILL.md      # Skill definition (required per skill)
    *.md           # Supporting prompts, references
    scripts/       # Helper scripts (if any)
```

## Multi-Agent Pipeline

```
User → Orchestrator → Analyst → [user approval] → Planner → [user approval] → Programmer → Reviewer → [user report]
```

- **Orchestrator** is the only primary agent; all others are subagents dispatched via `task` tool
- Hub-and-spoke: ALL communication flows through the Orchestrator — agents never talk to each other directly
- User approval is required at two checkpoints: after analysis and after planning
- Max 3 Programmer↔Reviewer iterations before escalating to user

## Agent File Format

Every agent file has YAML frontmatter + markdown body:

```yaml
---
description: <one-line purpose>
mode: primary | subagent
hidden: true        # subagents only
temperature: 0.2    # lower = more deterministic
permission:
  edit: allow|deny
  bash: allow|deny  # or per-command rules
  glob: allow|deny
  grep: allow|deny
  read: allow|deny
  task:
    "*": deny
    "<agent-name>": allow
---
```

Key sections in the body: Core Identity, Task, Rules, Escalation, Hub-and-Spoke, Skill Usage.

## Skill File Format

- `SKILL.md` must have frontmatter with `name` and `description`
- Skills are loaded by agents via the `skill` tool — agents reference them in "Skill Usage" sections
- When editing a skill, also check which agents reference it (search for `## Skill Usage: <skill-name>`)

## Session Artifacts

In multi-agent mode, all artifacts go under `.knowledge/sessions/<session-id>/`:

- `status.md` — created by Orchestrator at session init
- `requirements.md` — produced by Analyst
- `plan.md` — produced by Planner
- `review.md` — produced by Reviewer

Session ID format: `<YYYYMMDD>-<slugified-session-name>`

`.knowledge/` is session-specific ephemeral data — do not commit it.

## Conventions

- Agent files are self-contained prompts — each subagent gets NO memory of prior conversation
- Always include full context when delegating to a subagent
- Agents load skills at runtime; skill references in agent files use the pattern `## Skill Usage: <skill-name>`
- When adding or modifying a skill, update all agents that reference it
- `.knowledge/project.md` is an optional project context file referenced by multiple agents

## Important Constraints

- Do not add executable code to this repo — it is prompt/config only
- Do not modify the pipeline order (analysis → planning → programming → review) without updating orchestrator.md
- Skill overrides in agent files take precedence over the skill's own defaults

## Special Features

**Brainstorming Visual Companion**: The `brainstorming` skill includes a local server (`scripts/server.cjs`, `scripts/helper.js`) for visual design collaboration. The analyst can offer this when requirements involve UI/visual questions.

# Design: @rifanstd/devkit-agent Installer CLI

## Context

Membuat CLI installer untuk repo `devkit-agent` agar dapat diinstall oleh pengguna OpenCode melalui `npx` atau `npm`. Repo ini berisi agent dan skill definitions untuk multi-agent coding pipeline.

**Target:** Pengguna OpenCode
**Install method:** `npx @rifanstd/devkit-agent` (interactive CLI)
**Scope:** Global (`~/.config/opencode/`) atau Project (`.opencode/`)

## Architecture

### Package Structure

```
@rifanstd/devkit-agent/
├── src/
│   ├── cli.ts              # Entry point, argument parsing
│   ├── commands/
│   │   ├── install.ts      # Install command
│   │   └── uninstall.ts    # Uninstall command
│   ├── lib/
│   │   ├── prompts.ts      # @clack/prompts wrapper
│   │   ├── config.ts       # Paths, agent-skill mapping
│   │   └── fs.ts           # File operations (copy)
│   └── types.ts            # TypeScript types
├── agents/                 # Source: agent .md files
│   ├── orchestrator.md
│   ├── analyst.md
│   ├── planner.md
│   ├── programmer.md
│   └── reviewer.md
├── skills/                 # Source: skill directories
│   ├── brainstorming/
│   ├── receiving-code-review/
│   ├── requesting-code-review/
│   ├── subagent-driven-development/
│   ├── systematic-debugging/
│   ├── verification-before-completion/
│   └── writing-plans/
├── package.json
├── tsconfig.json
└── build.config.mjs
```

### Target Paths (OpenCode)

| Scope | Agents Path | Skills Path |
|-------|-------------|-------------|
| Global | `~/.config/opencode/agents/` | `~/.config/opencode/skills/<name>/SKILL.md` |
| Project | `.opencode/agents/` | `.opencode/skills/<name>/SKILL.md` |

## Install Flow

### Interactive Prompts (menggunakan @clack/prompts)

1. **Scope Selection** — User memilih Global atau Project
2. **Agent Selection** — User memilih agents yang ingin diinstall (multi-select)
3. **Skill Auto-Detection** — Skills otomatis terdeteksi berdasarkan agents yang dipilih
4. **Confirmation** — User konfirmasi sebelum install
5. **Installation** — Copy files ke target path

### Agent-Skill Mapping

```typescript
const AGENT_SKILL_MAP = {
  orchestrator: ["subagent-driven-development"],
  analyst: ["brainstorming"],
  planner: ["writing-plans"],
  programmer: ["receiving-code-review", "verification-before-completion", "systematic-debugging"],
  reviewer: ["requesting-code-review", "verification-before-completion", "systematic-debugging"]
};
```

### Skill Auto-Detection Logic

```typescript
function getRequiredSkills(selectedAgents: string[]): string[] {
  const skills = new Set<string>();
  for (const agent of selectedAgents) {
    for (const skill of AGENT_SKILL_MAP[agent] || []) {
      skills.add(skill);
    }
  }
  return [...skills];
}
```

### Installation Process

1. Determine target paths based on scope
2. Create directories if not exist
3. Copy agent `.md` files to agents path
4. Copy skill directories to skills path (preserving structure)
5. Show summary with checkmarks

## Uninstall Flow

### Command

```bash
npx @rifanstd/devkit-agent uninstall
# atau
npx @rifanstd/devkit-agent --uninstall
```

### Interactive Flow

1. **Detect existing installation** — Check both global and project paths
2. **Scope Selection** — If found in both, ask which to uninstall from
3. **Agent Selection** — Show only installed agents (multi-select)
4. **Smart Skill Cleanup** — Calculate which skills are still needed by remaining agents
5. **Confirmation** — Show what will be removed
6. **Removal** — Delete selected files

### Smart Skill Cleanup

When uninstalling agents, the CLI:
1. Calculates which skills are still needed by remaining installed agents
2. Only removes skills that are NOT used by any remaining agent
3. Shows which skills will be removed and why

## Tech Stack & Dependencies

### Dependencies

| Package | Purpose |
|---------|---------|
| `@clack/prompts` | Interactive CLI prompts (select, multiselect, confirm) |
| `picocolors` | Terminal colors |
| `yaml` | YAML parsing (for SKILL.md frontmatter) |
| `obuild` | Build tool (devDependency) |
| `typescript` | Language (devDependency) |

### Package.json

```json
{
  "name": "@rifanstd/devkit-agent",
  "version": "1.0.0",
  "description": "Installer for OpenCode devkit agents and skills",
  "type": "module",
  "bin": {
    "devkit-agent": "./dist/cli.mjs"
  },
  "files": ["dist", "agents", "skills"],
  "scripts": {
    "build": "obuild",
    "dev": "node src/cli.ts",
    "prepublishOnly": "npm run build"
  },
  "engines": {
    "node": ">=18"
  }
}
```

## CLI Usage & Commands

### Installation

```bash
# Interactive (default)
npx @rifanstd/devkit-agent

# With options
npx @rifanstd/devkit-agent --global        # Global scope
npx @rifanstd/devkit-agent --yes           # Skip confirmations
npx @rifanstd/devkit-agent -g -y           # Combined
```

### Uninstall

```bash
# Interactive
npx @rifanstd/devkit-agent --uninstall
npx @rifanstd/devkit-agent -u

# With options
npx @rifanstd/devkit-agent -u --global     # Uninstall from global
npx @rifanstd/devkit-agent -u -y           # Skip confirmations
```

### Help

```bash
npx @rifanstd/devkit-agent --help
npx @rifanstd/devkit-agent -h
```

### Help Output

```
@rifanstd/devkit-agent - OpenCode devkit installer

Usage:
  npx @rifanstd/devkit-agent [options]

Options:
  -g, --global      Install to global scope (~/.config/opencode/)
  -u, --uninstall   Uninstall agents and skills
  -y, --yes         Skip confirmation prompts
  -h, --help        Show this help message

Examples:
  npx @rifanstd/devkit-agent              # Interactive install
  npx @rifanstd/devkit-agent -g           # Global install
  npx @rifanstd/devkit-agent -u           # Interactive uninstall
```

### Error Handling

| Scenario | Behavior |
|----------|----------|
| No agents selected | Show error, exit 1 |
| Target directory doesn't exist | Create it |
| File already exists | Overwrite with confirmation |
| Permission denied | Show error with suggestion |
| Not in a project directory | Suggest --global flag |

## Constraints

- Tidak ada git commit dalam proses development
- Tidak mengubah struktur repo yang sudah ada (agents/, skills/)
- Hanya menambah file installer (src/, package.json, tsconfig.json, build.config.mjs)
- Mengikuti pola yang sama dengan vercel-labs/skills untuk CLI interaktif

---

Version: 1 | Author: brainstorming | Date: 2026-06-09

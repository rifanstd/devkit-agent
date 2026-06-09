# devkit-agent Installer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an npm CLI package that installs OpenCode agents and skills interactively.

**Architecture:** Monolithic TypeScript CLI using @clack/prompts for interactivity, obuild for bundling, and file copy for installation.

**Tech Stack:** TypeScript, @clack/prompts, picocolors, obuild, Node.js >=18

---

## File Structure

```
devkit-agent/
├── src/
│   ├── cli.ts              # Entry point, argument parsing, command routing
│   ├── commands/
│   │   ├── install.ts      # Install command: scope, agent selection, copy files
│   │   └── uninstall.ts    # Uninstall command: detect, select, remove files
│   ├── lib/
│   │   ├── config.ts       # Agent-skill mapping, path constants
│   │   └── fs.ts           # File operations: copyDir, ensureDir, removeDir
│   └── types.ts            # TypeScript type definitions
├── agents/                 # Source agent .md files (existing)
├── skills/                 # Source skill directories (existing)
├── bin/
│   └── cli.mjs             # Binary entry point (shebang)
├── package.json
├── tsconfig.json
└── build.config.mjs
```

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `build.config.mjs`
- Create: `bin/cli.mjs`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "devkit-agent",
  "version": "1.0.0",
  "description": "Installer for OpenCode devkit agents and skills",
  "type": "module",
  "bin": {
    "devkit-agent": "./bin/cli.mjs"
  },
  "files": ["dist", "bin", "agents", "skills"],
  "scripts": {
    "build": "obuild",
    "dev": "node --import tsx src/cli.ts",
    "prepublishOnly": "npm run build"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "@clack/prompts": "^0.11.0",
    "picocolors": "^1.1.1"
  },
  "devDependencies": {
    "obuild": "^0.4.22",
    "tsx": "^4.19.0",
    "typescript": "^5.9.3"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create build.config.mjs**

```javascript
import { defineBuildConfig } from 'obuild/config';

export default defineBuildConfig({
  entries: [{ type: 'bundle', input: './src/cli.ts' }],
});
```

- [ ] **Step 4: Create bin/cli.mjs**

```javascript
#!/usr/bin/env node
await import('../dist/cli.mjs');
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: Dependencies installed successfully

---

## Task 2: Types & Config

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/config.ts`

- [ ] **Step 1: Create src/types.ts**

```typescript
export type Scope = 'global' | 'project';

export interface InstallOptions {
  global?: boolean;
  yes?: boolean;
}

export interface UninstallOptions {
  global?: boolean;
  yes?: boolean;
}

export type AgentName = 'orchestrator' | 'analyst' | 'planner' | 'programmer' | 'reviewer';

export interface AgentConfig {
  name: AgentName;
  label: string;
  description: string;
  file: string;
  skills: string[];
}

export type SkillName =
  | 'brainstorming'
  | 'receiving-code-review'
  | 'requesting-code-review'
  | 'subagent-driven-development'
  | 'systematic-debugging'
  | 'verification-before-completion'
  | 'writing-plans';
```

- [ ] **Step 2: Create src/lib/config.ts**

```typescript
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AgentConfig, AgentName, Scope, SkillName } from '../types.ts';

export const AGENTS: Record<AgentName, AgentConfig> = {
  orchestrator: {
    name: 'orchestrator',
    label: 'Orchestrator',
    description: 'Manager & team lead — entry point for all requests',
    file: 'orchestrator.md',
    skills: ['subagent-driven-development'],
  },
  analyst: {
    name: 'analyst',
    label: 'Analyst',
    description: 'Requirement analysis specialist',
    file: 'analyst.md',
    skills: ['brainstorming'],
  },
  planner: {
    name: 'planner',
    label: 'Planner',
    description: 'Implementation planning specialist',
    file: 'planner.md',
    skills: ['writing-plans'],
  },
  programmer: {
    name: 'programmer',
    label: 'Programmer',
    description: 'Code implementation specialist',
    file: 'programmer.md',
    skills: ['receiving-code-review', 'verification-before-completion', 'systematic-debugging'],
  },
  reviewer: {
    name: 'reviewer',
    label: 'Reviewer',
    description: 'Code review & testing specialist',
    file: 'reviewer.md',
    skills: ['requesting-code-review', 'verification-before-completion', 'systematic-debugging'],
  },
};

export const AGENT_LIST = Object.values(AGENTS);

export function getRequiredSkills(selectedAgents: AgentName[]): SkillName[] {
  const skills = new Set<SkillName>();
  for (const agent of selectedAgents) {
    for (const skill of AGENTS[agent].skills) {
      skills.add(skill as SkillName);
    }
  }
  return [...skills];
}

export function getAgentsPath(scope: Scope): string {
  if (scope === 'global') {
    return join(homedir(), '.config', 'opencode', 'agents');
  }
  return join(process.cwd(), '.opencode', 'agents');
}

export function getSkillsPath(scope: Scope): string {
  if (scope === 'global') {
    return join(homedir(), '.config', 'opencode', 'skills');
  }
  return join(process.cwd(), '.opencode', 'skills');
}

export function getSourceAgentsPath(): string {
  return join(import.meta.dirname ?? process.cwd(), '..', 'agents');
}

export function getSourceSkillsPath(): string {
  return join(import.meta.dirname ?? process.cwd(), '..', 'skills');
}
```

---

## Task 3: File System Helpers

**Files:**
- Create: `src/lib/fs.ts`

- [ ] **Step 1: Create src/lib/fs.ts**

```typescript
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';

export async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

export async function copyFile(src: string, dest: string): Promise<void> {
  await ensureDir(join(dest, '..'));
  await cp(src, dest);
}

export async function copyDir(src: string, dest: string): Promise<void> {
  await ensureDir(dest);
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

export async function removeDir(dir: string): Promise<void> {
  if (existsSync(dir)) {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function listDirs(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

export async function listFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isFile()).map((e) => e.name);
}
```

---

## Task 4: Install Command

**Files:**
- Create: `src/commands/install.ts`

- [ ] **Step 1: Create src/commands/install.ts**

```typescript
import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  AGENT_LIST,
  AGENTS,
  getAgentsPath,
  getRequiredSkills,
  getSkillsPath,
  getSourceAgentsPath,
  getSourceSkillsPath,
} from '../lib/config.ts';
import { copyDir, copyFile, ensureDir } from '../lib/fs.ts';
import type { AgentName, InstallOptions, Scope } from '../types.ts';

export async function runInstall(options: InstallOptions): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' devkit-agent ')));

  // Step 1: Scope selection
  let scope: Scope;

  if (options.global !== undefined) {
    scope = options.global ? 'global' : 'project';
    p.log.info(`Scope: ${pc.cyan(scope)}`);
  } else {
    const scopeChoice = await p.select({
      message: 'Select installation scope:',
      options: [
        {
          value: 'project' as const,
          label: 'Project',
          description: 'Install to .opencode/ in current directory',
        },
        {
          value: 'global' as const,
          label: 'Global',
          description: 'Install to ~/.config/opencode/',
        },
      ],
    });

    if (p.isCancel(scopeChoice)) {
      p.cancel('Installation cancelled');
      process.exit(0);
    }

    scope = scopeChoice;
  }

  // Step 2: Agent selection
  const agentChoices = AGENT_LIST.map((a) => ({
    value: a.name,
    label: a.label,
    hint: a.description,
  }));

  let selectedAgents: AgentName[];

  if (options.yes) {
    selectedAgents = AGENT_LIST.map((a) => a.name);
    p.log.info(`Installing all ${selectedAgents.length} agents`);
  } else {
    const selected = await p.multiselect({
      message: 'Select agents to install:',
      options: agentChoices,
      required: true,
    });

    if (p.isCancel(selected)) {
      p.cancel('Installation cancelled');
      process.exit(0);
    }

    selectedAgents = selected;
  }

  if (selectedAgents.length === 0) {
    p.log.error('No agents selected');
    process.exit(1);
  }

  // Step 3: Auto-detect skills
  const requiredSkills = getRequiredSkills(selectedAgents);

  p.log.step(`Selected ${pc.green(String(selectedAgents.length))} agents, ${pc.green(String(requiredSkills.length))} skills auto-detected`);

  // Step 4: Confirmation
  const agentsPath = getAgentsPath(scope);
  const skillsPath = getSkillsPath(scope);

  const summaryLines: string[] = [];
  summaryLines.push(`${pc.dim('Scope:')} ${scope}`);
  summaryLines.push(`${pc.dim('Agents:')} ${agentsPath}`);
  summaryLines.push(`${pc.dim('Skills:')} ${skillsPath}`);
  summaryLines.push('');
  summaryLines.push(pc.bold('Agents:'));
  for (const agent of selectedAgents) {
    summaryLines.push(`  ${pc.green('✓')} ${AGENTS[agent].label}`);
  }
  summaryLines.push('');
  summaryLines.push(pc.bold('Skills (auto):'));
  for (const skill of requiredSkills) {
    summaryLines.push(`  ${pc.green('✓')} ${skill}`);
  }

  p.note(summaryLines.join('\n'), 'Installation Summary');

  if (!options.yes) {
    const confirmed = await p.confirm({ message: 'Proceed with installation?' });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Installation cancelled');
      process.exit(0);
    }
  }

  // Step 5: Install
  const spinner = p.spinner();
  spinner.start('Installing...');

  const sourceAgentsPath = getSourceAgentsPath();
  const sourceSkillsPath = getSourceSkillsPath();

  // Copy agents
  await ensureDir(agentsPath);
  for (const agent of selectedAgents) {
    const src = `${sourceAgentsPath}/${AGENTS[agent].file}`;
    const dest = `${agentsPath}/${AGENTS[agent].file}`;
    await copyFile(src, dest);
  }

  // Copy skills
  await ensureDir(skillsPath);
  for (const skill of requiredSkills) {
    const src = `${sourceSkillsPath}/${skill}`;
    const dest = `${skillsPath}/${skill}`;
    await copyDir(src, dest);
  }

  spinner.stop('Installation complete');

  // Show result
  const resultLines: string[] = [];
  resultLines.push(`${pc.green('✓')} ${selectedAgents.length} agents → ${agentsPath}`);
  resultLines.push(`${pc.green('✓')} ${requiredSkills.length} skills → ${skillsPath}`);

  p.note(resultLines.join('\n'), pc.green('Installed'));

  p.outro(pc.green('Done!') + pc.dim('  Restart OpenCode to load new agents.'));
}
```

---

## Task 5: Uninstall Command

**Files:**
- Create: `src/commands/uninstall.ts`

- [ ] **Step 1: Create src/commands/uninstall.ts**

```typescript
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  AGENT_LIST,
  AGENTS,
  getAgentsPath,
  getRequiredSkills,
  getSkillsPath,
} from '../lib/config.ts';
import { removeDir, listFiles } from '../lib/fs.ts';
import type { AgentName, Scope, UninstallOptions } from '../types.ts';

async function getInstalledAgents(scope: Scope): Promise<AgentName[]> {
  const agentsPath = getAgentsPath(scope);
  if (!existsSync(agentsPath)) return [];

  const files = await listFiles(agentsPath);
  const installed: AgentName[] = [];

  for (const agent of AGENT_LIST) {
    if (files.includes(agent.file)) {
      installed.push(agent.name);
    }
  }

  return installed;
}

async function getInstalledSkills(scope: Scope): Promise<string[]> {
  const skillsPath = getSkillsPath(scope);
  if (!existsSync(skillsPath)) return [];

  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(skillsPath, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

export async function runUninstall(options: UninstallOptions): Promise<void> {
  p.intro(pc.bgRed(pc.white(pc.black(' devkit-agent uninstall '))));

  // Step 1: Detect scope
  let scope: Scope;

  const projectInstalled = await getInstalledAgents('project');
  const globalInstalled = await getInstalledAgents('global');

  if (projectInstalled.length === 0 && globalInstalled.length === 0) {
    p.log.error('No devkit-agent installation found');
    process.exit(1);
  }

  if (options.global !== undefined) {
    scope = options.global ? 'global' : 'project';
  } else if (projectInstalled.length > 0 && globalInstalled.length > 0) {
    const scopeChoice = await p.select({
      message: 'Found installations in both scopes. Which to uninstall from?',
      options: [
        { value: 'project' as const, label: 'Project', description: `.opencode/ (${projectInstalled.length} agents)` },
        { value: 'global' as const, label: 'Global', description: `~/.config/opencode/ (${globalInstalled.length} agents)` },
      ],
    });

    if (p.isCancel(scopeChoice)) {
      p.cancel('Uninstall cancelled');
      process.exit(0);
    }

    scope = scopeChoice;
  } else if (projectInstalled.length > 0) {
    scope = 'project';
  } else {
    scope = 'global';
  }

  // Step 2: Agent selection
  const installedAgents = await getInstalledAgents(scope);

  if (installedAgents.length === 0) {
    p.log.error(`No agents found in ${scope} scope`);
    process.exit(1);
  }

  const agentChoices = installedAgents.map((a) => ({
    value: a,
    label: AGENTS[a].label,
    hint: AGENTS[a].description,
  }));

  let selectedAgents: AgentName[];

  if (options.yes) {
    selectedAgents = installedAgents;
    p.log.info(`Uninstalling all ${selectedAgents.length} agents`);
  } else {
    const selected = await p.multiselect({
      message: 'Select agents to uninstall:',
      options: agentChoices,
      required: true,
    });

    if (p.isCancel(selected)) {
      p.cancel('Uninstall cancelled');
      process.exit(0);
    }

    selectedAgents = selected;
  }

  if (selectedAgents.length === 0) {
    p.log.error('No agents selected');
    process.exit(1);
  }

  // Step 3: Smart skill cleanup
  const remainingAgents = installedAgents.filter((a) => !selectedAgents.includes(a));
  const skillsToRemove = getRequiredSkills(selectedAgents);
  const skillsToKeep = getRequiredSkills(remainingAgents);
  const skillsActuallyRemove = skillsToRemove.filter((s) => !skillsToKeep.includes(s));

  // Step 4: Confirmation
  const summaryLines: string[] = [];
  summaryLines.push(pc.bold('Agents to remove:'));
  for (const agent of selectedAgents) {
    summaryLines.push(`  ${pc.red('✗')} ${AGENTS[agent].label}`);
  }

  if (skillsActuallyRemove.length > 0) {
    summaryLines.push('');
    summaryLines.push(pc.bold('Skills to remove (no longer needed):'));
    for (const skill of skillsActuallyRemove) {
      summaryLines.push(`  ${pc.red('✗')} ${skill}`);
    }
  }

  if (skillsToKeep.length > 0) {
    summaryLines.push('');
    summaryLines.push(pc.bold('Skills to keep (still used):'));
    for (const skill of skillsToKeep) {
      summaryLines.push(`  ${pc.dim('·')} ${skill}`);
    }
  }

  p.note(summaryLines.join('\n'), 'Uninstall Summary');

  if (!options.yes) {
    const confirmed = await p.confirm({ message: 'Proceed with uninstall?' });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Uninstall cancelled');
      process.exit(0);
    }
  }

  // Step 5: Remove
  const spinner = p.spinner();
  spinner.start('Uninstalling...');

  const agentsPath = getAgentsPath(scope);
  const skillsPath = getSkillsPath(scope);

  // Remove agent files
  for (const agent of selectedAgents) {
    const filePath = join(agentsPath, AGENTS[agent].file);
    if (existsSync(filePath)) {
      const { unlink } = await import('node:fs/promises');
      await unlink(filePath);
    }
  }

  // Remove skills that are no longer needed
  for (const skill of skillsActuallyRemove) {
    const skillDir = join(skillsPath, skill);
    if (existsSync(skillDir)) {
      await removeDir(skillDir);
    }
  }

  spinner.stop('Uninstall complete');

  // Show result
  const resultLines: string[] = [];
  resultLines.push(`${pc.green('✓')} ${selectedAgents.length} agents removed`);
  if (skillsActuallyRemove.length > 0) {
    resultLines.push(`${pc.green('✓')} ${skillsActuallyRemove.length} skills removed`);
  }

  p.note(resultLines.join('\n'), pc.green('Uninstalled'));

  p.outro(pc.green('Done!') + pc.dim('  Restart OpenCode to apply changes.'));
}
```

---

## Task 6: CLI Entry Point

**Files:**
- Create: `src/cli.ts`

- [ ] **Step 1: Create src/cli.ts**

```typescript
import pc from 'picocolors';
import { runInstall } from './commands/install.ts';
import { runUninstall } from './commands/uninstall.ts';

const args = process.argv.slice(2);

function showHelp(): void {
  console.log(`
${pc.bold(pc.cyan('devkit-agent'))} ${pc.dim('- OpenCode devkit installer')}

${pc.bold('Usage:')}
  npx devkit-agent [options]

${pc.bold('Options:')}
  -g, --global      Install to global scope (~/.config/opencode/)
  -u, --uninstall   Uninstall agents and skills
  -y, --yes         Skip confirmation prompts
  -h, --help        Show this help message

${pc.bold('Examples:')}
  ${pc.dim('npx devkit-agent')}              ${pc.dim('# Interactive install')}
  ${pc.dim('npx devkit-agent -g')}           ${pc.dim('# Global install')}
  ${pc.dim('npx devkit-agent -u')}           ${pc.dim('# Interactive uninstall')}
`);
}

function parseArgs(args: string[]): {
  global?: boolean;
  uninstall?: boolean;
  yes?: boolean;
  help?: boolean;
} {
  const result: { global?: boolean; uninstall?: boolean; yes?: boolean; help?: boolean } = {};

  for (const arg of args) {
    switch (arg) {
      case '-g':
      case '--global':
        result.global = true;
        break;
      case '-u':
      case '--uninstall':
        result.uninstall = true;
        break;
      case '-y':
      case '--yes':
        result.yes = true;
        break;
      case '-h':
      case '--help':
        result.help = true;
        break;
    }
  }

  return result;
}

async function main(): Promise<void> {
  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    return;
  }

  if (options.uninstall) {
    await runUninstall({ global: options.global, yes: options.yes });
  } else {
    await runInstall({ global: options.global, yes: options.yes });
  }
}

main().catch((err) => {
  console.error(pc.red(`Error: ${err.message}`));
  process.exit(1);
});
```

---

## Task 7: Build & Test

**Files:**
- Modify: `package.json` (already created)

- [ ] **Step 1: Build the project**

Run: `npm run build`
Expected: `dist/cli.mjs` created

- [ ] **Step 2: Test locally with tsx**

Run: `npm run dev`
Expected: Interactive CLI starts

- [ ] **Step 3: Test with --help flag**

Run: `npm run dev -- --help`
Expected: Help message displayed

- [ ] **Step 4: Test global flag parsing**

Run: `npm run dev -- -g -y`
Expected: Install runs non-interactively with global scope

---

## Task 8: Binary Entry Point

**Files:**
- Modify: `bin/cli.mjs` (already created)

- [ ] **Step 1: Make bin/cli.mjs executable (Unix)**

Run: `chmod +x bin/cli.mjs` (only needed on Unix)
Expected: File is executable

- [ ] **Step 2: Test npx execution**

Run: `npx .`
Expected: CLI starts interactively

---

## Execution Order

```
Task 1 (Setup) → Task 2 (Types & Config) → Task 3 (FS Helpers) → Task 4 (Install) → Task 5 (Uninstall) → Task 6 (CLI Entry) → Task 7 (Build & Test) → Task 8 (Binary)
```

Tasks 2-3 can be done in parallel. Tasks 4-5 can be done in parallel after Task 3.

---

Version: 1 | Author: writing-plans | Date: 2026-06-09

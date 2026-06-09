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

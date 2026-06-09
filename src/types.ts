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

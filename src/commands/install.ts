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
          hint: 'Install to .opencode/ in current directory',
        },
        {
          value: 'global' as const,
          label: 'Global',
          hint: 'Install to ~/.config/opencode/',
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
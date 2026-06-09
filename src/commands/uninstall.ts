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
        { value: 'project' as const, label: 'Project', hint: `.opencode/ (${projectInstalled.length} agents)` },
        { value: 'global' as const, label: 'Global', hint: `~/.config/opencode/ (${globalInstalled.length} agents)` },
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

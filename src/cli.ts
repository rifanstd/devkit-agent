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

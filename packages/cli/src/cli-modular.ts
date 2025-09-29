#!/usr/bin/env node

import { Command } from 'commander';
import { CommandRegistry } from './commands/CommandRegistry';

/**
 * Main CLI entry point using modular command architecture
 */
function main(): void {
  const program = new Command();
  
  program
    .name('gitswitch')
    .description('Git identity management tool')
    .version('1.0.0');

  // Initialize command registry and register all commands
  const commandRegistry = new CommandRegistry();
  commandRegistry.registerWithProgram(program);

  // Parse CLI arguments
  program.parse();

  // If no command provided, show help
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  main();
}

export { main };
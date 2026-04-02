#!/usr/bin/env node
import program from '../src/index.js';

const args = process.argv.slice(2);

// In watch/dev mode, opening CLI with no args should be a clean help exit.
if (args.length === 0) {
  program.outputHelp();
  process.exit(0);
}

try {
  await program.parseAsync(process.argv);
} catch (error) {
  const message = error?.message || String(error);
  console.error(message);
  process.exit(typeof error?.exitCode === 'number' ? error.exitCode : 1);
}

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import execa from 'execa';
import log from '../utils/logger.js';
import chokidar from 'chokidar';

const automate = new Command('automate');

automate
  .command('watch <dir>')
  .description('Watch a directory for file changes and run a shell command')
  .option('--ext <ext>', 'File extension to watch, e.g. js', '')
  .option('--run <cmd>', 'Shell command to run on change', '')
  .action(async (dir, opts) => {
    const ext = opts.ext ? `**/*.${opts.ext}` : '**/*';
    const runCmd = opts.run;
    log.info(`Watching ${dir} for ${ext} changes. Press Ctrl+C to stop.`);
    chokidar.watch(path.join(dir, ext), { ignoreInitial: true }).on('all', async (event, file) => {
      log.info(`${event}: ${file}`);
      if (runCmd) {
        const spinner = ora(`Running: ${runCmd}`).start();
        try {
          const { stdout } = await execa.command(runCmd, { shell: true });
          spinner.succeed('Command finished');
          log.success(stdout);
        } catch (e) {
          spinner.fail('Command failed');
          log.error(e.stderr || e.message);
        }
      }
    });
  })
  .addHelpText('after', `\nExample:\n  mycli automate watch src --ext js --run "npm test"`);

automate
  .command('run <task>')
  .description('Named task runner reading from a mycli.config.json file')
  .action(async (task) => {
    const configPath = path.resolve('mycli.config.json');
    if (!await fs.pathExists(configPath)) {
      log.error('mycli.config.json not found in current directory.');
      return;
    }
    const cfg = await fs.readJson(configPath);
    if (!cfg.tasks || !cfg.tasks[task]) {
      log.error('Task not found in config.');
      return;
    }
    const cmd = cfg.tasks[task];
    const spinner = ora(`Running task: ${task}`).start();
    try {
      const { stdout } = await execa.command(cmd, { shell: true });
      spinner.succeed('Task finished');
      log.success(stdout);
    } catch (e) {
      spinner.fail('Task failed');
      log.error(e.stderr || e.message);
    }
  })
  .addHelpText('after', `\nExample:\n  mycli automate run build`);

export default automate;

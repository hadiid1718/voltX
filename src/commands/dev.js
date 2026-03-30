import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import log from '../utils/logger.js';
import config from '../utils/config.js';
import os from 'os';

const templates = {
  'node-api': {
    files: {
      'index.js': `import express from 'express';\nconst app = express();\napp.get('/', (req, res) => res.send('Hello API!'));\napp.listen(3000);`,
      'package.json': `{"name":"node-api","type":"module","dependencies":{"express":"^4.18.2"}}`,
    },
    post: async (dir) => {
      await execa('npm', ['install'], { cwd: dir, shell: true });
    },
  },
  'react-app': {
    post: async (dir) => {
      await execa('npx', ['create-react-app', '.'], { cwd: dir, shell: true });
    },
  },
  'cli-tool': {
    files: {
      'cli.js': `#!/usr/bin/env node\nconsole.log('Hello CLI!');`,
      'package.json': `{"name":"cli-tool","bin":{"cli":"cli.js"},"type":"module"}`,
    },
    post: async (dir) => {
      await execa('npm', ['install'], { cwd: dir, shell: true });
    },
  },
};

const dev = new Command('dev');

dev
  .command('scaffold <template>')
  .description('Generate project boilerplate (node-api, react-app, cli-tool)')
  .action(async (template) => {
    if (!templates[template]) {
      log.error('Unknown template. Choose from: ' + Object.keys(templates).join(', '));
      return;
    }
    const { dir } = await inquirer.prompt({
      type: 'input',
      name: 'dir',
      message: 'Target directory:',
      default: template,
    });
    if (await fs.pathExists(dir)) {
      log.error('Directory already exists.');
      return;
    }
    await fs.mkdirp(dir);
    if (templates[template].files) {
      for (const [file, content] of Object.entries(templates[template].files)) {
        await fs.outputFile(path.join(dir, file), content);
      }
    }
    if (templates[template].post) {
      const spinner = ora('Setting up project...').start();
      try {
        await templates[template].post(dir);
        spinner.succeed('Project ready!');
      } catch (e) {
        spinner.fail('Setup failed');
        log.error(e.message);
      }
    }
    log.success('Scaffolded ' + template + ' in ' + dir);
  })
  .addHelpText('after', `\nExample:\n  voltX dev scaffold node-api`);

dev
  .command('env diff <file1> <file2>')
  .description('Compare two .env files and highlight missing/changed keys')
  .action(async (file1, file2) => {
    const parseEnv = (str) => Object.fromEntries(str.split(/\r?\n/).filter(Boolean).map(l => l.split('=')).filter(a => a.length === 2));
    try {
      const env1 = parseEnv(await fs.readFile(file1, 'utf8'));
      const env2 = parseEnv(await fs.readFile(file2, 'utf8'));
      const allKeys = new Set([...Object.keys(env1), ...Object.keys(env2)]);
      for (const key of allKeys) {
        if (!(key in env1)) log.warn(`Missing in ${file1}: ${key}`);
        else if (!(key in env2)) log.warn(`Missing in ${file2}: ${key}`);
        else if (env1[key] !== env2[key]) log.info(chalk.yellow(`Changed: ${key}\n  ${file1}: ${env1[key]}\n  ${file2}: ${env2[key]}`));
      }
      log.success('Diff complete.');
    } catch (e) {
      log.error(e.message);
    }
  })
  .addHelpText('after', `\nExample:\n  voltX dev env diff .env.example .env`);

dev
  .command('git clean')
  .description('Interactive stale local branch cleanup')
  .action(async () => {
    try {
      const { stdout } = await execa('git', ['branch', '--format=%(refname:short)'], { shell: true });
      const branches = stdout.split(/\r?\n/).filter(b => b && b !== 'main' && b !== 'master');
      if (!branches.length) return log.info('No local branches to clean.');
      const { toDelete } = await inquirer.prompt({
        type: 'checkbox',
        name: 'toDelete',
        message: 'Select branches to delete:',
        choices: branches,
      });
      for (const branch of toDelete) {
        await execa('git', ['branch', '-D', branch], { shell: true });
        log.success('Deleted branch: ' + branch);
      }
      if (!toDelete.length) log.info('No branches deleted.');
    } catch (e) {
      log.error(e.message);
    }
  })
  .addHelpText('after', `\nExample:\n  voltX dev git clean`);

dev
  .command('serve <dir>')
  .description('Spin up a quick static file server')
  .option('--port <port>', 'Port to serve on', () => config.get('defaultPort', 5000))
  .action(async (dir, opts) => {
    const port = parseInt(opts.port, 10) || 5000;
    const express = (await import('express')).default;
    const app = express();
    app.use(express.static(dir));
    app.listen(port, () => {
      log.success(`Serving ${dir} at http://localhost:${port}`);
    });
  })
  .addHelpText('after', `\nExample:\n  voltX dev serve public --port 8080`);

export default dev;

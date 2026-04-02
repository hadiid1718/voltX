import { Command } from 'commander';
import figlet from 'figlet';
import chalk from 'chalk';
import network from './commands/network.js';
import dev from './commands/dev.js';
import automate from './commands/automate.js';
import log from './utils/logger.js';
import config from './utils/config.js';

const program = new Command();

program
  .name('voltX')
  .description('A modern CLI toolkit for Windows')
  .version('1.0.0')
  .addHelpText('beforeAll', '\n' + chalk.cyan(figlet.textSync('voltX', { horizontalLayout: 'full' })) + '\n');

program
  .command('config')
  .description('Manage persistent config')
  .option('--get <key>', 'Get config value')
  .option('--set <key...>', 'Set config value')
  .action((opts) => {
    if (opts.get) {
      const val = config.get(opts.get);
      if (val !== undefined) log.success(`${opts.get} = ${val}`);
      else log.warn('Key not found.');
    } else if (Array.isArray(opts.set) && opts.set.length >= 2) {
      const [key, value] = opts.set;
      config.set(key, value);
      log.success(`Set ${key} = ${value}`);
    } else if (opts.set) {
      log.warn('Please provide both a key and a value for --set. Example: voltX config --set defaultPort 8080');
    } else {
      log.info('Use --get <key> or --set <key> <value>');
    }
  })
  .addHelpText('after', `\nExample:\n  voltX config --get defaultPort\n  voltX config --set defaultPort 8080`);

program.addCommand(network);
program.addCommand(dev);
program.addCommand(automate);

export default program;

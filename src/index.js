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
  .name('mycli')
  .description('A modern CLI toolkit for Windows')
  .version('1.0.0')
  .addHelpText('beforeAll', '\n' + chalk.cyan(figlet.textSync('mycli', { horizontalLayout: 'full' })) + '\n');

program
  .command('config')
  .description('Manage persistent config')
  .option('--get <key>', 'Get config value')
  .option('--set <key> <value>', 'Set config value')
  .action((opts) => {
    if (opts.get) {
      const val = config.get(opts.get);
      if (val !== undefined) log.success(`${opts.get} = ${val}`);
      else log.warn('Key not found.');
    } else if (opts.set) {
      config.set(opts.set[0], opts.set[1]);
      log.success(`Set ${opts.set[0]} = ${opts.set[1]}`);
    } else {
      log.info('Use --get <key> or --set <key> <value>');
    }
  })
  .addHelpText('after', `\nExample:\n  mycli config --get defaultPort\n  mycli config --set defaultPort 8080`);

program.addCommand(network);
program.addCommand(dev);
program.addCommand(automate);

export default program;

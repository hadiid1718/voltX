import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import execa from 'execa';
import log from '../utils/logger.js';
import os from 'os';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const network = new Command('net');

network
  .command('ping <host>')
  .description('Ping a host with spinner feedback')
  .option('-c, --count <count>', 'Number of pings', '4')
  .action(async (host, opts) => {
    const count = parseInt(opts.count, 10);
    const spinner = ora(`Pinging ${host} (${count} times)...`).start();
    try {
      const cmd = os.platform() === 'win32' ? 'ping' : 'ping';
      const args = os.platform() === 'win32' ? ['-n', count, host] : ['-c', count, host];
      const { stdout } = await execa(cmd, args, { shell: true });
      spinner.succeed('Ping complete');
      log.success(stdout);
    } catch (err) {
      spinner.fail('Ping failed');
      log.error(err.stderr || err.message);
    }
  })
  .addHelpText('after', `\nExample:\n  mycli net ping google.com -c 5`);

network
  .command('scan <ip>')
  .description('TCP port scanner')
  .option('--ports <range>', 'Port range, e.g. 20-80', '1-1024')
  .action(async (ip, opts) => {
    const [start, end] = opts.ports.split('-').map(Number);
    const spinner = ora(`Scanning ${ip} ports ${start}-${end}...`).start();
    const net = await import('net');
    let openPorts = [];
    let checked = 0;
    for (let port = start; port <= end; port++) {
      await new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(300);
        socket.on('connect', () => {
          openPorts.push(port);
          socket.destroy();
          resolve();
        });
        socket.on('timeout', () => {
          socket.destroy();
          resolve();
        });
        socket.on('error', () => {
          socket.destroy();
          resolve();
        });
        socket.connect(port, ip);
      });
      checked++;
      if (checked % 50 === 0) spinner.text = `Scanning... checked ${checked} ports`;
    }
    spinner.succeed(`Scan complete. Open ports: ${openPorts.length ? openPorts.join(', ') : 'None'}`);
    if (openPorts.length) log.success('Open ports: ' + openPorts.join(', '));
    else log.warn('No open ports found.');
  })
  .addHelpText('after', `\nExample:\n  mycli net scan 127.0.0.1 --ports 22-80`);

network
  .command('monitor <url>')
  .description('Poll an HTTP endpoint and alert on failure')
  .option('--interval <ms>', 'Polling interval in ms', '5000')
  .action(async (url, opts) => {
    const interval = parseInt(opts.interval, 10);
    log.info(`Monitoring ${url} every ${interval}ms. Press Ctrl+C to stop.`);
    while (true) {
      const spinner = ora(`Polling ${url}...`).start();
      try {
        await axios.get(url);
        spinner.succeed('OK');
      } catch (err) {
        spinner.fail('FAIL');
        log.error(`Endpoint failed: ${err.response?.status || err.message}`);
      }
      await sleep(interval);
    }
  })
  .addHelpText('after', `\nExample:\n  mycli net monitor https://example.com --interval 2000`);

network
  .command('http <url>')
  .description('Lightweight terminal HTTP client')
  .option('--method <method>', 'HTTP method', 'GET')
  .option('--headers <headers>', 'Headers as JSON string', '{}')
  .option('--body <body>', 'Request body (for POST/PUT)', '')
  .action(async (url, opts) => {
    let headers = {};
    try { headers = JSON.parse(opts.headers); } catch { log.warn('Invalid headers JSON, using empty.'); }
    const spinner = ora(`${opts.method} ${url}`).start();
    try {
      const res = await axios({
        url,
        method: opts.method,
        headers,
        data: opts.body,
        validateStatus: () => true,
      });
      spinner.succeed(`Status: ${res.status}`);
      log.info('Headers: ' + JSON.stringify(res.headers, null, 2));
      log.success('Body:\n' + (typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : res.data));
    } catch (err) {
      spinner.fail('Request failed');
      log.error(err.message);
    }
  })
  .addHelpText('after', `\nExample:\n  mycli net http https://api.github.com --method GET --headers '{"User-Agent":"mycli"}'`);

export default network;

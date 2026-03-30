# mycli

A modern, production-ready CLI toolkit for Windows, built with Node.js (ESM).

## Features
- **Network tools:** ping, port scan, HTTP monitor, HTTP client
- **Developer tools:** project scaffolding, .env diff, git branch cleanup, static file server
- **Automation:** directory watcher with shell runner, named task runner
- **Persistent config:** User preferences with `conf`
- **Beautiful output:** chalk, ora, figlet banners
- **Windows support:** Path normalization, execa shell, ANSI color

## Installation

```
git clone https://github.com/yourname/mycli.git
cd mycli
npm install
```

## Usage

All commands support `--help` for details and examples.

### Network Commands

#### Ping
```
mycli net ping google.com -c 5
```

#### Port Scan
```
mycli net scan 127.0.0.1 --ports 22-80
```

#### HTTP Monitor
```
mycli net monitor https://example.com --interval 2000
```

#### HTTP Client
```
mycli net http https://api.github.com --method GET --headers '{"User-Agent":"mycli"}'
```

### Developer Commands

#### Scaffold Project
```
mycli dev scaffold node-api
mycli dev scaffold react-app
mycli dev scaffold cli-tool
```

#### .env Diff
```
mycli dev env diff .env.example .env
```

#### Git Clean
```
mycli dev git clean
```

#### Static File Server
```
mycli dev serve public --port 8080
```

### Automate Commands

#### Watch Directory & Run
```
mycli automate watch src --ext js --run "npm test"
```

#### Run Named Task
```
mycli automate run build
```

### Config

```
mycli config --get defaultPort
mycli config --set defaultPort 8080
```

## Persistent Config

User preferences (default port, editor, etc.) are stored using [`conf`](https://www.npmjs.com/package/conf).

## Build Windows Executable

1. Install [pkg](https://github.com/vercel/pkg) globally if not already:
   ```
   npm install -g pkg
   ```
2. Run:
   ```
   npm run build:exe
   ```
3. The `.exe` will be in `dist/mycli.exe`.

## Windows Notes
- All paths are normalized for Windows.
- Execa is used with `shell: true` for compatibility.
- ANSI color is supported in PowerShell/Windows Terminal.

## License
MIT

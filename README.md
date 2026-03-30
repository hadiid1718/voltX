# voltX

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
git clone https://github.com/yourname/voltX.git
cd voltX
npm install
```

## Usage

All commands support `--help` for details and examples.

### Network Commands

#### Ping
```
voltX net ping google.com -c 5
```

#### Port Scan
```
voltX net scan 127.0.0.1 --ports 22-80
```

#### HTTP Monitor
```
voltX net monitor https://example.com --interval 2000
```

#### HTTP Client
```
voltX net http https://api.github.com --method GET --headers '{"User-Agent":"voltX"}'
```

### Developer Commands

#### Scaffold Project
```
voltX dev scaffold node-api
voltX dev scaffold react-app
voltX dev scaffold cli-tool
```

#### .env Diff
```
voltX dev env diff .env.example .env
```

#### Git Clean
```
voltX dev git clean
```

#### Static File Server
```
voltX dev serve public --port 8080
```

### Automate Commands

#### Watch Directory & Run
```
voltX automate watch src --ext js --run "npm test"
```

#### Run Named Task
```
voltX automate run build
```

### Config

```
voltX config --get defaultPort
voltX config --set defaultPort 8080
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
3. The `.exe` will be in `dist/voltx.exe`.

## Windows Notes
- All paths are normalized for Windows.
- Execa is used with `shell: true` for compatibility.
- ANSI color is supported in PowerShell/Windows Terminal.

## License
MIT

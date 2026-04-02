# voltX

`voltX` is a Windows-friendly Node.js CLI that helps developers manage configuration,
check networks, scaffold projects, and automate repeated tasks from the terminal.

It is designed to be useful while building:

- websites
- backend APIs
- local tools and system utilities
- repeatable development workflows

## Why use it?

- keep common settings in one place
- test servers and endpoints quickly
- scaffold starter projects faster
- automate watch/build/test tasks
- reduce manual terminal work during development

## Install

```powershell
git clone https://github.com/yourname/voltX.git
cd voltX
npm install
```

## Run locally

```powershell
node .\bin\voltx.js --help
```

If you want to use the package name directly in your terminal after linking or publishing,
you can run:

```powershell
voltx --help
```

## Commands

### 1) `config`
Stores and reads persistent settings using local config storage.

#### Example

```powershell
voltX config --set defaultPort 8080
voltX config --get defaultPort
```

#### Good use cases

- save a default server port
- store an API base URL
- remember a theme or mode

---

### 2) `net`
Network helpers for pinging, scanning ports, monitoring endpoints, and sending HTTP requests.

#### Ping a host

```powershell
voltX net ping google.com -c 4
```

#### Scan ports

```powershell
voltX net scan 127.0.0.1 --ports 22-80
```

#### Monitor a URL

```powershell
voltX net monitor https://example.com --interval 5000
```

#### Send an HTTP request

```powershell
voltX net http https://api.github.com --method GET --headers "{\"User-Agent\":\"voltX\"}"
```

#### Why it helps

- check whether your API is online
- confirm ports are open during local development
- inspect HTTP responses quickly

---

### 3) `dev`
Developer helpers for project scaffolding, environment checks, branch cleanup, and local serving.

#### Scaffold a Node API project

```powershell
voltX dev scaffold node-api
```

#### Scaffold a React app

```powershell
voltX dev scaffold react-app
```

#### Scaffold a CLI tool

```powershell
voltX dev scaffold cli-tool
```

#### Compare two `.env` files

```powershell
voltX dev env diff .env.example .env
```

#### Clean local Git branches

```powershell
voltX dev git clean
```

#### Serve a static folder

```powershell
voltX dev serve public --port 8080
```

#### Why it helps

- start a project faster
- compare environment settings between dev and prod
- preview frontend files locally
- manage branches without leaving the terminal

---

### 4) `automate`
Watches files and runs commands automatically, or runs named tasks from a config file.

#### Watch files and run a command

```powershell
voltX automate watch src --ext js --run "npm test"
```

#### Run a named task

```powershell
voltX automate run build
```

#### Notes

- `automate watch` is useful for rebuild/test workflows
- `automate run` expects a local `voltX.config.json` file

Example `voltX.config.json`:

```json
{
  "tasks": {
    "build": "npm run build",
    "test": "npm test"
  }
}
```

---

## Quick local test

Use these commands to confirm the CLI works on your machine:

```powershell
cd "E:\npm package\voltX"
node .\bin\voltx.js --help
node .\bin\voltx.js config --set defaultPort 8080
node .\bin\voltx.js config --get defaultPort
node .\bin\voltx.js net ping google.com -c 2
```

## Build an executable

If you want a Windows `.exe`, run:

```powershell
npm run build:exe
```

The output will be created in `dist/voltx.exe`.

## Example workflow for a website

1. scaffold the frontend or API
2. store shared values with `config`
3. use `dev serve` to preview files
4. use `automate watch` to rerun tests or builds
5. use `net` to check if your endpoint is alive

This makes `voltX` helpful for day-to-day website and system development because it keeps the most repeated tasks in one CLI.

## License

MIT

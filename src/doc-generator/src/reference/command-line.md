# Command line

## Help
```bash
npx envarna --help
```

Get additional help per command
```bash
npx envarna list --help
```

## Commands
- `list`: prints a table of env vars, types, defaults, usual paths
  - this is a screen dump of all settings defined by all classes in your project
- `env`: writes `.env.template`
  - include `.env.template` in your repo so developers can copy it to `.env` (which should not be in the repo), then modify it for development use
- `md`: writes `SETTINGS.md`
- `values`: writes `values.yaml`
  - useful as a starting point for CI/CD configuration
- `compose`: prints docker-compose `environment:`
  - copy this into your `docker-compose.yml` 
- `k8s`: prints Kubernetes `env:` list
  - for use in kubernetes manifests
- `json` [root]: prints JSON structure 
- `yaml` [root]: prints YAML structure
- `raw`: prints raw extracted spec
  - this is the internal representation of all settings used by the command line tool to produce all other formats

## Common flags
- `--skip-dev`: omit `@devOnly` fields
- `json --root <name> --flat --code`: choose root, flatten, and use field names instead of ENVARs
- `yaml --root <name> --flat --code`: same for YAML

Defaults
- `json`: `root` defaults to none (top-level object of groups/fields)
- `yaml`: `root` defaults to `settings`


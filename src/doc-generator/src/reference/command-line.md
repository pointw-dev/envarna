# Command line (Reference)

## Commands
- list: table of env vars, types, defaults, usual paths
- env: write `.env.template`
- md: write `SETTINGS.md`
- values: write `values.yaml`
- compose: print docker-compose `environment:`
- k8s: print Kubernetes `env:` list
- json [root]: print JSON structure
- yaml [root]: print YAML structure
- raw: print raw extracted spec

## Common flags
- `--skip-dev`: omit `@devOnly` fields
- `json --root <name> --flat --code`: choose root, flatten, and use field names instead of ENVARs
- `yaml --root <name> --flat --code`: same for YAML

## Help
```bash
npx envarna --help
```

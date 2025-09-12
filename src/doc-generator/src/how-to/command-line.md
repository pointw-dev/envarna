# Command line

<centered-image src="/img/work-in-progress.png" />

Envarna can output your settings definitions in a number of formats.  Call `envarna` from the command line (usually with `npx`)

## --help
Here is the output of `npx envarna --help`

```plaintext
envarna <command>

Commands:
  envarna list         Display settings details
  envarna env          Write ".env.template"
  envarna md           Write "SETTINGS.md"
  envarna values       Write "values.yaml"
  envarna compose      Display docker-compose style environment yaml
  envarna k8s          Display kubernetes style env var structure
  envarna json [root]  Display JSON settings structure
  envarna yaml [root]  Display YAML settings structure
  envarna raw          Display the raw structure extracted from the settings cla
                       sses used to power the other formats

Options:
  --version   Show version number                                       [boolean]
  --skip-dev  Exclude fields marked @devOnly (default: false)           [boolean]
  --help      Show help                                                 [boolean]
```

### Flags

- `--skip-dev`: omit fields decorated with `@devOnly()`.
- `json --root <name>`: wrap output under a root object (or omit for flat).
- `json --flat`: flatten output (no group nesting under root).
- `json --code`: use field names as keys instead of ENVAR names.
- `yaml --root/--flat/--code`: same as JSON for YAML output.

## list
Display settings details

## env
Write `.env.template`

## md
Write `SETTINGS.md`

## values
Write `values.yaml`

## compose
Display docker-compose style environment yaml

## k8s
Display kubernetes style env var structure

## json
Display JSON settings structure
[root]
--flat (default: false)
--code (default: false)

## yaml
Display YAML settings structure
[root]
--flat (default: false)
--code (default: false)

## raw
Raw output of the structure used to create the above

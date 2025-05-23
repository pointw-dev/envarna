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
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

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
--flat
--code

## yaml
Display YAML settings structure
[root]
--flat
--code

## raw
Raw output of the structure used to create the above

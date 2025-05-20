# Decorators

<centered-image src="/img/work-in-progress.png" />

## `v`
* `v` is used with `@settings()` to create more complex validation chains 
*  `v` is for "validation".  It is a light extension of `z` from Zod designed for use in a settings environment.
* automatic coercion (e.g. `v.number()` accepts strings like "42")
* access to Zod validations e.g.:
  ```ts
  @setting(v.url())
  @setting(v.email())
  @setting(v.string().startsWith('aaa').includes('mmm').length(15).toUpperCase())
  ```
* handling for arrays (and soon objects)

> You can still use raw Zod if needed, just remember to be aware of coercion:

## @secret
* marks a field as a secret
* adds this note to generated formats (e.g. `npx envarna list`)
* prevents typical log dumps from revealing the secret value (replaced with `***`)


## @alias
* allows you to set an environment variable name to be used to populate this field


## @pushToEnv
* if the matching environment variable for this field is missing, the default supplied to this field is exported to that envar.
* this is handy for setting up a dev version that pushes environment variable values for use by external services that require them
* handy when needed, but use with caution!


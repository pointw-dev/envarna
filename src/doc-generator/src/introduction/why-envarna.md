# Why envarna? 

> Why not just use `process.env`? Isn’t it good enough?

`dotenv` and `process.env` are time-tested, widely used tools.  Envarna builds on them. For many projects, they’re all you need. But as configuration grows more complex, envarna steps in to provide structure, validation, and safety on top of that foundation.

Here’s how envarna complements what `process.env` already does well, and why it can be worth adopting even in projects that start small.


## Everyone understands `process.env`. Why introduce decorators and a new library?
Exactly!  `process.env` is familiar and universal. That’s one reason envarna works *with* it, not against it. But as your configuration surface area grows, the risk of errors grows too:

* Misspelled or reused variables
* Scattered defaults and fallback logic
* Type coercion bugs
* Latent failures that surface only at runtime

Envarna adds structure without taking away control. You define what you expect, with types and defaults, in one place. Decorators give you lightweight structure that scales with your needs.


## It’s simple. Just do `process.env.FOO || 'bar'` and move on.
This works—until:

* You forget to coerce a value (`parseInt`, `=== "true"`, etc.)
* You apply different defaults in different files
* You forget to validate the format

With envarna, defaults, coercion, and validation are expressed declaratively:

```ts
@settings(v.number().int().positive().default(10))
maxPageSize: number;
```

One source of truth, and it's enforced automatically.


## This is fine for small apps. I don’t need a framework just for config.
That may be true, configuration complexity tends to creep up:

* A second environment (staging)
* A few conditional flags
* A new team member unsure which env vars are required

Envarna stays lightweight but gives you room to grow:

* Logical grouping of settings (e.g. SMTP, DB, PubSub)
* CLI-based discovery (`npx envarna list`, `env`, etc.)
* Code completion and documentation via decorators

## At least with `process.env`, everything is in one place. I can see the behavior right there.
It can feel that way, but in practice the responsibility for handling configuration (parsing, coercion, validation, and defaulting) often gets mixed into unrelated parts of the codebase:
* Conditionals buried inside functions
* Defaults embedded in constructors
* Validation scattered across utility files

This tight coupling makes it harder to change or audit configuration logic, and it violates separation of concerns.

With envarna:
* Type, default, and validation are co-located with the declaration of each setting
* Application logic uses already-validated values and doesn’t worry about how they were derived
* Other complex validation is also part of the settings class: e.g. mutually-exclusive settings, settings that must be set together (e.g. username/password). 

It preserves the benefits of a single source and moves that source to a clearly defined, purpose-built layer.


## Testing with `process.env` is fine if you’re careful.
It can work, but requires discipline:

* Set the env var before the module is imported
* Clean it up after the test
* Reload modules if env values change

Which means it's error-prone.

Envarna makes it safer:
* Inject values directly via `.load({ field: value })`
* Or mock a scoped portion of the `settings` object
* No global mutation, no test bleed-through

Your tests stay readable, predictable, and isolated.


## This looks like overkill for 10–20 variables.
Maybe.  But even with 10 variables, you often end up with:

* Fallbacks scattered across files
* Missing or misnamed variables
* Unintentional reuse or inconsistent defaults

With envarna:
* Definitions are centralized
* Validation is enforced early
* Developer experience improves with type safety and code completion

You don’t need to reach for envarna—but if you do, it’ll meet you where you are and grow with you.

---

Still unsure? Try envarna in a single feature module. It may feel like a small shift now, but it prevents the kind of configuration debt that tends to surface later—often when it's least convenient.

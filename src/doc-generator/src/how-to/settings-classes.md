# Settings classes

> The following assumes that you create all settings classes in `src/settings`. Adjust as required if you put yours somewhere else.

The settings class is where it all begins.  Extend envarna's `BaseSettings` and define each setting your application needs as a field of that class.  When loaded

Here is a quick example:

```typescript:line-numbers
import { BaseSettings, setting } from "envarna";

export class SmtpSettings extends BaseSettings {
  @setting.string()
  host: string = 'localhost';

  @setting.number()
  port: number = 25;

  @setting.string()
  fromEmail: string = 'noreply@example.org';
}
```

## Anatomy of the settings class
### import
> line 1
* At a minimum import the `BaseSettings` class and the `setting` decorator
* import other [decorators](decorators) as needed

### Class definition
> line 3
* settings class names must end in `Settings` and extend `BaseSettings`

### Fields
> lines 5, 8, 11
* it is the class fields you use when you need the settings value (see )
* the field is typed for TypeScript purposes (the decorator is for environment variable validation)
* assigning a default value is optional, and the value is used if no matching environment variable is provided
 
### Field decorators
> lines 4, 7, 10
* each setting is a field in the class, and must be decorated with `@setting`
* decorators provide the validation rule for the incoming environment variable to be applied to the field
  * malformed environment variables cause an early rejection at startup
* basic decorators are shown in the example, one of
  * `@setting.string()`
  * `@setting.number()`
  * `@setting.boolean()`
  * `@setting.date()`
  * `@setting.array()`
  * `@setting.object()`
* for more advanced validation, use `v` to build a validation chain
  * e.g. `@setting(v.string().length(10))`
* See [Decorators](decorators) for more


## Naming Convention
The matching of environment variables to field names is done by way of the following naming conventions: 
* The class name must end with `Settings` (e.g., `MongoSettings`, `FooBarSettings`).
* Each field name should be in camelCase (e.g., `host`, `apiKey`, `cacheTtl`).

Environment variables are derived from these names using the following rules:

- Take the portion of the class name before `Settings` as the **prefix** (e.g., `Mongo`, `FooBar`).
- Convert this prefix to **uppercase**, exactly as written — no splitting or snake-casing:
  - `Mongo` → `MONGO`
  - `FooBar` → `FOOBAR`
- Convert the field name from camelCase to **UPPER_SNAKE_CASE** by inserting underscores before capital letters and uppercasing the result:
  - `apiKey` → `API_KEY`
  - `defaultTtl` → `DEFAULT_TTL`
- Join the two parts with an underscore:  
  **`<PREFIX>` + `_` + `<FIELD>`**, both fully uppercased.

**Example:**

```ts
class FooBarSettings {
  apiKey: string      // → FOOBAR_API_KEY
}
```

Or more formally:
### EBNF
```plaintext
env-var        = uppercase(class-prefix) , "_" , uppercase(camel-to-snake(field-name)) ;

class-name     = class-prefix , "Settings" ;
class-prefix   = title-case ;  (* e.g., FooBar *)

field-name     = camel-case ;

title-case     = uppercase-letter , { letter-or-digit } ;
camel-case     = lowercase-letter , { letter-or-digit | uppercase-segment } ;

uppercase-segment = uppercase-letter , { lowercase-letter } ;

uppercase(s)   = convert all letters of s to uppercase ;
camel-to-snake(s) = replace each uppercase letter in s with "_" + lowercase(letter) ;
```

## Advanced validation
In addition to field by field validations with decorators, you can also override `validate()` to perform validations across all fields.  For example, in the following class `username` and `password` are each optional.  To enforce the rule that if one is set both must be set:

```typescript{23-32}
import { BaseSettings, setting, secret, v, alias } from "envarna";

export class SmtpSettings extends BaseSettings {
  @setting.string()
  host: string = 'localhost'

  @setting.number()
  port: number = 25

  @setting.string()
  from: string = 'noreply@example.org'

  @setting.boolean()
  useTls: boolean = false

  @setting(v.string().optional())
  username?: string;

  @setting(v.string().optional())
  @secret()
  password?: string;

  override validate(): void {
    const hasUsername = this.username !== undefined;
    const hasPassword = this.password !== undefined;

    if (hasUsername !== hasPassword) {
      throw new Error(
        "Both username and password must be set together or left undefined."
      );
    }
  }  
}
```

This is also a way to enforce mutual exclusivity amongst two or more fields.

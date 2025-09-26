Feature: Validator-driven field definitions

  # Valid cases using explicit validator expressions
  Scenario Outline: Valid input passes validation and coercion
    Given a fresh class named "ExampleSettings" includes a setting named "<field>" validated as "<expr>"
    And the environment variable for class "ExampleSettings" field "<field>" is set to "<value>"
    When I load settings
    Then the setting "<field>" value is "<expected>"

    Examples:
      | field      | expr                                            | value       | expected     |
      | mode       | v.enum(['debug','info','warn','error'])         | warn        | warn         |
      | port       | v.number().gte(2112)                            | 2114        | 2114         |
      | statusCode | v.number().gt(99).lt(600)                       | 200         | 200          |
      | email      | v.string().email()                              | a@b.com     | a@b.com      |
      | flags      | v.array(v.string())                             | ["a","b"]   | ["a","b"]    |
      | user       | v.object({ name: v.string(), age: v.number() }) | {"name":"Ada","age":42} | {"name":"Ada","age":42} |

  # Invalid cases should fail with helpful messages
  Scenario Outline: Invalid input fails with a validation error
    Given a fresh class named "ExampleSettings" includes a setting named "<field>" validated as "<expr>"
    And the environment variable for class "ExampleSettings" field "<field>" is set to "<value>"
    When I attempt to load settings
    Then loading fails with an error containing "<message>"

    Examples:
      | field      | expr                                      | value     | message                        |
      | mode       | v.enum(['debug','info','warn','error'])   | verbose   | Invalid enum value             |
      | port       | v.number().gte(2112)                      | 2111      | greater than or equal to 2112  |
      | statusCode | v.number().gt(99).lt(600)                 | 99        | greater than 99                |
      | email      | v.string().email()                        | not_email | Invalid email                  |

  # Defaults and required_error message check
  Scenario: Validator default applies when env is absent
    Given a fresh class named "ExampleSettings" includes a setting named "defaultDecorator" validated as "v.string().default('hello')"
    When I load settings
    Then the setting "defaultDecorator" value is "hello"

  Scenario: Custom required_error surfaces when missing
    Given a fresh class named "ExampleSettings" includes a setting named "apiKey" validated as "v.string({ required_error: 'API_KEY is required. Contact Bob.' })"
    When I attempt to load settings
    Then loading fails with an error containing "API_KEY is required. Contact Bob."


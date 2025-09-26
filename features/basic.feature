Feature: The settings defined in a subclass of BaseSettings are populated in various ways

  Scenario: settings value loaded from environment
    Given the environment variable "API_HOST" is set to "from-process"
    And a class named ApiSettings includes a setting named host
    When I load settings
    Then the setting "host" value is "from-process"

  Scenario: settings value loaded from .env file
    Given an .env file that contains:
    """
    API_HOST=from-dotenv
    """
    And a class named ApiSettings includes a setting named host
    When I load settings
    Then the setting "host" value is "from-dotenv"

  Scenario: envars take precedence over .env file
    Given the environment variable "API_HOST" is set to "from-process"
    And an .env file that contains:
    """
    API_HOST=from-dotenv
    """
    And a class named ApiSettings includes a setting named host
    When I load settings
    Then the setting "host" value is "from-process"

  Scenario: injection takes precedence over envars and .env file
    Given the environment variable "API_HOST" is set to "from-process"
    And an .env file that contains:
    """
    API_HOST=from-dotenv
    API_NAME=from-dotenv
    """
    And a class named ApiSettings includes a setting named host
    And the class also includes a setting named name
    When I load settings with a value "from-injection"
    Then the setting "host" value is "from-injection"
    And the setting "name" value is "from-dotenv"

  Scenario: repeating prefixes
    Given the environment variable "API_API_KEY" is set to "from-process"
    And a class named ApiSettings includes a setting named apiKey
    When I load settings
    Then the setting "apiKey" value is "from-process"

  Scenario Outline: coerces data type from environment variable string
    Given the environment variable "<envar>" is set to "<value>"
    And a class named ApiSettings includes a setting named "<field>" of type "<type>"
    When I load settings
    Then the setting "<field>" value is "<value>"

    Examples:
      | envar        | value      | field    | type    |
      | API_TEXT     | hello      | text     | string  |
      | API_NUMERIC  | 42         | numeric  | number  |
      | API_LOGIC    | true       | logic    | boolean |
      | API_LOGIC    | false      | logic    | boolean |
      | API_RECORD  | {"name":"Michael","age":56}  | record   | object  |
#      | API_CALENDAR | 2025-05-16 | calendar | date    |
#      | API_LIST     | ["a","b"]  | list     | array   |


  Scenario Outline: Coerce and validate single field via env, class, and field name
    Given a fresh class named "<class>" includes a setting named "<field>" of type "<type>"
    And the environment variable for class "<class>" field "<field>" is set to "<value>"
    When I load settings
    Then the setting "<field>" value is "<expected>"

    Examples:
      | class           | field       | type    | value                            | expected                         |
      | ExampleSettings | appName     | string  | Hello App                        | Hello App                        |
      | ExampleSettings | port        | number  | 2114                             | 2114                             |
      | ExampleSettings | debug       | boolean | true                             | true                             |
      | ExampleSettings | debug       | boolean | false                            | false                            |
      | ExampleSettings | hosts       | array   | ["John","Paul","George","Ringo"] | ["John","Paul","George","Ringo"] |
      | ExampleSettings | record      | object  | {"name":"Michael","age":56}      | {"name":"Michael","age":56}      |

  Scenario Outline: Date-specific ISO check
    Given a fresh class named "<class>" includes a setting named "<field>" of type "date"
    And the environment variable for class "<class>" field "<field>" is set to "<value>"
    When I load settings
    Then the date setting "<field>" ISO equals "<value>"

    Examples:
      | class            | field    | value      |
      | ExampleSettings  | calendar | 2025-05-16 |


  Scenario: object setting can be accessed by fields
    Given the environment variable "SOME_RECORD" is set to "{\"name\":\"Michael\",\"age\":56}"
    And a class named SomeSettings includes an object setting named record with name string and age number
    When I load settings
    And I print the fields record.name and record.age
    Then the printed lines are:
    """
    Michael
    56
    """

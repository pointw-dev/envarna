Feature: can load settings values from async sources, e.g. secrets manager

  Scenario: Load a value from an async source (overrides envar)
    Given a settings object created following the async loading pattern
    And the environment variable "DB_CONNECTION_STRING" is set to "connection-from-env"
    When I initialize settings
    Then the setting "db.connectionString" has a value of "mongodb://secret-uri"

  Scenario: Values not explicitly set in async loader fall back to envar
    Given a settings object created following the async loading pattern
    And the environment variable "DB_NAME" is set to "name-from-env"
    When I initialize settings
    Then the setting "db.name" has a value of "name-from-env"

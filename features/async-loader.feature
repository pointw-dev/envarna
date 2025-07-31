Feature: can load settings values from async sources, e.g. secrets manager

  Scenario: Load a value from an async source
    Given a settings object created following the async loading pattern
    And the environment variable "DB_CONNECTION_STRING" is set to "connection-from-env"
    And the environment variable "DB_NAME" is set to "name-from-env"
    When I initialize settings
    Then the setting "db.connectionString" key's value is "mongodb://secret-uri"

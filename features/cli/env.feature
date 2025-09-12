Feature: envarna env template generation

  Background:
    Given a stubbed CLI settings spec

  Scenario: Write .env.template with default values and aliases
    When I write the env template with default options
    Then the env file contains "DEMO_APP_NAME" = "myapp"
    And the env file contains "DEMO_MAX" = "10"
    And the env file contains "MAIL_SERVER_HOST_NAME" = "localhost"

  Scenario: Skip dev-only fields in env template
    When I write the env template skipping dev fields
    Then the env file does not contain "DEMO_DEV_ONLY"

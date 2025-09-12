Feature: envarna json output

  Background:
    Given a stubbed CLI settings spec

  Scenario: Default JSON structure with groups and alias keys
    When I generate JSON with default options
    Then the JSON group "demo" has key "DEMO_APP_NAME" equal to "myapp"
    And the JSON group "demo" has key "DEMO_MAX" equal to 10
    And the JSON group "demo" has key "DEMO_DEBUG" equal to boolean false
    And the JSON group "smtp" has key "MAIL_SERVER_HOST_NAME" equal to "localhost"

  Scenario: JSON with code keys uses field names
    When I generate JSON with code keys
    Then the JSON group "demo" has key "appName" equal to "myapp"
    And the JSON group "demo" has key "max" equal to 10
    And the JSON group "demo" has key "debug" equal to boolean false
    And the JSON group "smtp" has key "host" equal to "localhost"

  Scenario: Flat JSON with custom root and skipping dev-only fields
    When I generate JSON with root "cfg" flat true code true skipDev true
    Then the flat JSON under root "cfg" has key "appName" equal to "myapp"
    And the flat JSON under root "cfg" lacks key "devOnlyFlag"

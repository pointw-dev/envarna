Feature: envarna yaml output

  Background:
    Given a stubbed CLI settings spec

  Scenario: Default YAML structure with settings root and alias keys
    When I generate YAML with default options
    Then the YAML under root "settings" group "demo" has key "DEMO_APP_NAME" equal to "myapp"
    And the YAML under root "settings" group "smtp" has key "MAIL_SERVER_HOST_NAME" equal to "localhost"

  Scenario: Flat YAML with custom root and skipping dev-only fields
    When I generate YAML with root "cfg" flat true code true skipDev true
    Then the flat YAML under root "cfg" has key "appName" equal to "myapp"
    And the flat YAML under root "cfg" lacks key "devOnlyFlag"

Feature: envarna values.yaml generation

  Background:
    Given a stubbed CLI settings spec

  Scenario: Write values.yaml with camelCase keys per group
    When I write values.yaml with default options
    Then values.yaml has key "appName" under group "demo" equal to "myapp"
    And values.yaml has key "host" under group "smtp" equal to "localhost"

  Scenario: Skip dev-only fields in values.yaml
    When I write values.yaml skipping dev fields
    Then values.yaml does not have key "devOnlyFlag" under group "demo"

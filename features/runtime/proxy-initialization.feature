Feature: settings proxy initialization API

  Scenario: Accessing a key before initialization throws
    Given a blank settings proxy
    When I try to access the key "foo"
    Then an error is thrown containing "before initialization"
    And an error is thrown containing "$override()"

  Scenario: $initialized is false before init and true after
    Given a typed proxy for a class named TestSettings with a field named flag defaulting to "off"
    Then settings is not initialized
    When I initialize settings now setting flag to "on"
    Then settings is initialized
    And the setting "test.flag" has a value of "on"

  Scenario: $ready waits for asynchronous initialization
    Given a typed proxy for a class named TestSettings with a field named flag defaulting to "off"
    When I schedule async initialization after 50 ms setting flag to "ready"
    Then waiting for settings to be ready succeeds
    And the setting "test.flag" has a value of "ready"

  Scenario: JSON stringify warns when async loaders exist before init
    Given a proxy with an async loader for key "foo"
    When I stringify the settings object
    Then an error is thrown containing "before dumping to JSON"
    And an error is thrown containing "$override()"

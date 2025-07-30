Feature: settings can be safely exported to JSON

  Scenario: straight dump
    Given a settings object created following the recommended pattern
    When I dump the settings object
    Then the result is stringified JSON

Feature: default values via assignment and decorator

  Scenario: Default by assignment is used when no env var provided
    And no environment variables with prefix "DEMO_" are set
    And a class named DemoSettings includes a setting named defaultAssignment with assignment default "from-assignment"
    When I load settings
    Then the setting "defaultAssignment" value is "from-assignment"

  Scenario: Default by decorator is used when no env var provided
    And no environment variables with prefix "DEMO_" are set
    And a class named DemoSettings includes a setting named defaultDecorator with decorator default "from-decorator"
    When I load settings
    Then the setting "defaultDecorator" value is "from-decorator"

  Scenario: When both defaults exist, assignment default takes precedence
    And no environment variables with prefix "DEMO_" are set
    And a class named DemoSettings includes a setting named dualDefault with assignment default "from-assignment" and decorator default "from-decorator"
    When I load settings
    Then the setting "dualDefault" value is "from-assignment"

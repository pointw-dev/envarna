Feature: optional, nullable, and devOnly semantics

  Scenario: Nullable string accepts null default
    Given a class named DemoSettings includes a setting named optionalComment as nullable string defaulting to null
    And no environment variables with prefix "DEMO_" are set
    When I load settings
    Then the setting "optionalComment" is null

  Scenario: Optional string remains undefined when not provided
    Given a class named DemoSettings includes a setting named logLevel as optional string
    And no environment variables with prefix "DEMO_" are set
    When I load settings
    Then the setting "logLevel" is undefined

  Scenario: devOnly field is marked appropriately
    Given a class named DemoSettings includes a setting named slug marked devOnly
    Then the field "slug" is marked devOnly

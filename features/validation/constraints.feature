Feature: validation rules for common constraints

  Scenario: Email must be valid format
    Given a class named ApiSettings includes a setting named contact validated as email
    And the environment variable "API_CONTACT" is set to "not-an-email"
    When I attempt to load settings
    Then loading fails with an error containing "email"

  Scenario: Enum must be one of allowed values
    Given a class named ApiSettings includes a setting named mode as enum "debug,info,warn,error"
    And the environment variable "API_MODE" is set to "loud"
    When I attempt to load settings
    Then loading fails with an error containing "Invalid"

  Scenario: Enum accepts a valid value
    Given a class named ApiSettings includes a setting named mode as enum "debug,info,warn,error"
    And the environment variable "API_MODE" is set to "warn"
    When I load settings
    Then the setting "mode" value is "warn"

  Scenario: Number minimum boundary is enforced (invalid)
    Given a class named ApiSettings includes a setting named port with minimum 2112
    And the environment variable "API_PORT" is set to "2111"
    When I attempt to load settings
    Then loading fails with an error containing "greater than or equal"

  Scenario: Number minimum boundary passes at threshold
    Given a class named ApiSettings includes a setting named port with minimum 2112
    And the environment variable "API_PORT" is set to "2112"
    When I load settings
    Then the setting "port" value is "2112"

  Scenario: UUID must match exact length (invalid)
    Given a class named ApiSettings includes a setting named uuid with length 36
    And the environment variable "API_UUID" is set to "1234"
    When I attempt to load settings
    Then loading fails with an error containing "exactly 36"

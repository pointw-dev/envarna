Feature: reports detailed validation errors

  Scenario: Missing required shows structured validation details
    Given no environment variables with prefix "API_" are set
    And a class named ApiSettings includes a setting named "host" of type "string"
    When I attempt to load settings
    Then the error is a validation error
    And the error has 1 issues
    And the error includes an issue at path "host"
    And loading fails with an error containing "[ApiSettings.host]"

  Scenario: Multiple violations are aggregated with per-field messages
    Given no environment variables with prefix "API_" are set
    And a class named ApiSettings includes a setting named contact validated as email
    And the class also includes a setting named "port" validated as "v.number().gte(2112)"
    And the environment variable "API_CONTACT" is set to "not-an-email"
    And the environment variable "API_PORT" is set to "2111"
    When I attempt to load settings
    Then the error is a validation error
    And the error has 2 issues
    And the error includes an issue at path "contact"
    And the error includes an issue at path "port"
    And loading fails with an error containing "[ApiSettings.contact]"
    And loading fails with an error containing "[ApiSettings.port]"

  Scenario: Validation error exposes the underlying cause
    Given no environment variables with prefix "API_" are set
    And a fresh class named "ApiSettings" includes a setting named "apiKey" validated as "v.string({ required_error: 'API_KEY is required. Contact Bob.' })"
    When I attempt to load settings
    Then the error is a validation error
    And the error has 1 issues
    And the error includes an issue message containing "API_KEY is required. Contact Bob."
    And the error cause is present

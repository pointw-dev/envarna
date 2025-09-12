Feature: pushToEnv uses conventional ENV var names

  Scenario: CamelCase property name maps to UPPER_SNAKE env var
    Given a class named ApiSettings includes a setting named fromEmail pushed to env
    When I load settings injecting "fromEmail" = "noreply@example.org"
    Then the process environment variable "API_FROM_EMAIL" equals "noreply@example.org"


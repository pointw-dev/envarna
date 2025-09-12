Feature: envarna list and raw outputs

  Background:
    Given a stubbed CLI settings spec

  Scenario: List settings produces a table per group
    When I print settings list
    Then the list output includes a header for "demo"
    And the list output includes a header for "smtp"

  Scenario: List skips dev-only fields when requested
    When I print settings list skipping dev fields
    Then the list output does not include "DEMO_DEV_ONLY"

  Scenario: Raw JSON mirrors the spec shape
    When I generate raw JSON
    Then the raw JSON has group "Demo" and key "DEMO_APP_NAME"
    And the raw JSON has group "Smtp" and key "SMTP_HOST"

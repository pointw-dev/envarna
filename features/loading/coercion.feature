Feature: extended type coercion

  Scenario: Date coercion from env var string
    Given the environment variable "API_CALENDAR" is set to "2025-05-16"
    And a class named ApiSettings includes a setting named "calendar" of type "date"
    When I load settings
    Then the date setting "calendar" ISO equals "2025-05-16"

  Scenario: Array coercion from env var JSON
    Given the environment variable "API_LIST" is set to "[\"a\",\"b\"]"
    And a class named ApiSettings includes a setting named "list" as a coercing array
    When I load settings
    Then the array setting "list" JSON equals "[\"a\",\"b\"]"

  Scenario: Numeric array coercion from env var JSON
    Given the environment variable "API_NUMBERS" is set to "[1,2,3]"
    And a class named ApiSettings includes a setting named "numbers" as a coercing numeric array
    When I load settings
    Then the array setting "numbers" JSON equals "[1,2,3]"

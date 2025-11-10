Feature: reports detailed validation errors

  Scenario: fails with details when environment is not supplied
    Given the environment variable "API_IMPORTANT" is set to "some_value"
    And a class named ApiSettings includes a setting named "critical" of type "string"
    When I load settings
    Then validation fails with details about why

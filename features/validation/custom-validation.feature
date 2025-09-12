Feature: custom validation errors in settings classes

  Scenario: SMTP username and password must be both set or both undefined
    And a class named SmtpSettings with paired credentials validation
    And the environment variable "SMTP_USERNAME" is set to "user1"
    When I attempt to load settings
    Then loading fails with an error containing "Both username and password must be set"


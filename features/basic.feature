Feature: The settings defined in a subclass of BaseSettings are populated in various ways

  Scenario: settings value loaded from environment
    Given the environment variable "API_HOST" is set to "from-process"
    And a class named ApiSettings includes a setting named host
    When I load settings
    Then the setting "host" value is "from-process"

  Scenario: settings value loaded from .env file
    Given an .env file that contains:
    """
    API_HOST=from-dotenv
    """
    And a class named ApiSettings includes a setting named host
    When I load settings
    Then the setting "host" value is "from-dotenv"

  Scenario: envars take precedence over .env file
    Given the environment variable "API_HOST" is set to "from-process"
    And an .env file that contains:
    """
    API_HOST=from-dotenv
    """
    And a class named ApiSettings includes a setting named host
    When I load settings
    Then the setting "host" value is "from-process"

  Scenario: injection takes precedence over envars and .env file
    Given the environment variable "API_HOST" is set to "from-process"
    And an .env file that contains:
    """
    API_HOST=from-dotenv
    """
    And a class named ApiSettings includes a setting named host
    When I load settings with a value "from-injection"
    Then the setting "host" value is "from-injection"

  Scenario: repeating prefixes
    Given the environment variable "API_API_KEY" is set to "from-process"
    And a class named ApiSettings includes a setting named apiKey
    When I load settings
    Then the setting "apiKey" value is "from-process"

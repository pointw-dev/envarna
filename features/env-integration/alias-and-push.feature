Feature: alias mapping and push-to-env behavior

  Scenario: Alias env var overrides and is pushed back
    Given the environment variable "GOOGLE_CLOUD_PROJECT" is set to "gcp-from-env"
    And the environment variable "PUBSUB_PROJECT_ID" is set to "pubsub-from-env"
    And a class named PubsubSettings includes a setting named projectId aliased to "GOOGLE_CLOUD_PROJECT" and pushed to env
    When I load settings
    Then the setting "projectId" value is "gcp-from-env"
    And the process environment variable "GOOGLE_CLOUD_PROJECT" equals "gcp-from-env"

  Scenario: Injection value is pushed to the aliased env var
    And a class named PubsubSettings includes a setting named projectId aliased to "GOOGLE_CLOUD_PROJECT" and pushed to env
    When I load settings injecting "projectId" = "my-proj"
    Then the process environment variable "GOOGLE_CLOUD_PROJECT" equals "my-proj"

  Scenario: Pushing to default env var name when no alias exists
    And a class named ApiSettings includes a setting named host pushed to env
    When I load settings injecting "host" = "api.local"
    Then the process environment variable "API_HOST" equals "api.local"


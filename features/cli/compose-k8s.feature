Feature: envarna compose and k8s outputs

  Background:
    Given a stubbed CLI settings spec

  Scenario: Compose environment mapping from spec
    When I generate compose env
    Then the compose yaml has "DEMO_APP_NAME": "myapp"
    And the compose yaml has "MAIL_SERVER_HOST_NAME": "localhost"

  Scenario: Kubernetes env list from spec
    When I generate k8s env
    Then the k8s env has name "DEMO_APP_NAME" with value "myapp"
    And the k8s env has name "MAIL_SERVER_HOST_NAME" with value "localhost"


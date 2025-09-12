Feature: secret fields are redacted in JSON output

  Scenario: Redact secret values when dumping settings to JSON
    Given a settings object created following the standard pattern
    And the setting "db.connectionString" is marked secret
    When I dump the settings object
    Then the JSON path "db.connectionString" is redacted

  Scenario: Redact secret SMTP password
    Given a settings object with SMTP settings where password is marked secret
    And the setting "smtp.password" is marked secret
    When I dump the settings object
    Then the JSON path "smtp.password" is redacted

  Scenario: Redact secret Redis URI
    Given a settings object with Redis settings where uri is marked secret
    And the setting "redis.uri" is marked secret
    When I dump the settings object
    Then the JSON path "redis.uri" is redacted

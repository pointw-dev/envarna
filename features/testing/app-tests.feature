Feature: Testing application code that depends on settings

  Scenario: Override settings in tests without DI or mocks
    Given a PaginationSettings class with default maxPageSize 10
    And a lazy settings proxy exposing pagination
    And I override PaginationSettings for tests with:
      """
      { "maxPageSize": 7 }
      """
    When my app lists widgets with no page size
    Then it prints 7 widgets

  Scenario: Clearing overrides restores defaults
    Given a PaginationSettings class with default maxPageSize 10
    And a lazy settings proxy exposing pagination
    And I override PaginationSettings for tests with:
      """
      { "maxPageSize": 5 }
      """
    And I clear the PaginationSettings test override
    When my app lists widgets with no page size
    Then it prints 10 widgets

  Scenario: Jest-style mocking also works if preferred
    Given a PaginationSettings class with default maxPageSize 10
    And an app that reads settings from a module-level variable
    And I mock app settings to:
      """
      { "pagination": { "maxPageSize": 3 } }
      """
    When my app lists widgets with no page size using the mock
    Then it prints 3 widgets

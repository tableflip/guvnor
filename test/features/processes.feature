Feature: Do a Google Search
  Using a web browser
  I want to perform a Google search

  Scenario: Google Search
    Given the daemon is running
    And I visit the web interface
    Then I expect the title to be "Google"
    When I search for "Tamarin"
    When I click the "Images" menu link
    Then I expect to see some "Image" results

Feature: Google Search
  As a user
  I want to search for a topic on Google
  So that I can find relevant results

  Background:
    Given I am on the Google homepage

  Scenario: Search for 4Runners shows Toyota website in results
    Given the results will include a link to "toyota.com"
    When I search for "4Runners"
    Then a link to "toyota.com" should be visible in the results

  Scenario Outline: Searching for car models shows manufacturer results
    Given the results will include a link to "<expected_domain>"
    When I search for "<query>"
    Then a link to "<expected_domain>" should be visible in the results
    Examples: {'datafile':'manufacturers.json'}

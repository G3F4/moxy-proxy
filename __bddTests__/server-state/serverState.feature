Feature: Server State
  Scenario: One with adding server state scenario
    When I open Moxy Proxy
    When I select "Tabs view" option
    When I click "ADD SERVER SCENARIO" button
    When I enter "test scenario" in input with label "Scenario name"
    Then I wait for 2 seconds
    When I press tab on keyboard
    Then I wait for 2 seconds
    When I click "SUBMIT" button

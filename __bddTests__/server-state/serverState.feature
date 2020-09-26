Feature: Server State
  Scenario: One with adding server state scenario
    * I open Moxy Proxy
    * I open select with label "View mode" and select "Tabs view" option
    * I click tab with label "STATE INTERFACE"
    * I click "ADD SERVER SCENARIO" button
    * I enter "test scenario" in input with label "Scenario name"
    * I press tab on keyboard
    * I press end on keyboard
    * I press left on keyboard
    * I press enter on keyboard
    * I type ""foo": true" on keyboard
    * I click "SUBMIT" button
    * I open select with label "State scenario" and select "test scenario" option
    * I see ""foo":booltrue" line in JSON viewer

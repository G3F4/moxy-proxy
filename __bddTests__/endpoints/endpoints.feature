Feature: Server State
  Scenario: One with adding simplest endpoint
    * I open Moxy Proxy
    * I open select with label "View mode" and select "Tabs view" option
    * I click tab with label "ENDPOINTS"
    * I click "ADD ENDPOINT" button
    * I enter "test" in input with label "URL pattern"
    * I click "NEXT" button
    * I click "NEXT" button
    * I click "NEXT" button
    * I click "NEXT" button
    * I click "NEXT" button
    * I click "SUBMIT" button
    * I can see on endpoint with "GET: test" label
    * I wait for 5 seconds

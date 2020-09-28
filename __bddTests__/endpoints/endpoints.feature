Feature: Server State
#  Scenario: One with adding simplest endpoint
#    * I open Moxy Proxy
#    * I open select with label "View mode" and select "Tabs view" option
#    * I click tab with label "ENDPOINTS"
#    * I click "ADD ENDPOINT" button
#    * I enter "test" in input with label "URL pattern"
#    * I click "NEXT" button
#    * I click "NEXT" button
#    * I click "NEXT" button
#    * I click "NEXT" button
#    * I click "NEXT" button
#    * I click "SUBMIT" button
#    * I can see on endpoint with "GET: test" label
#    * I wait for 5 seconds
  Scenario: One with adding static response endpoint
    * I open Moxy Proxy
    * I open select with label "View mode" and select "Tabs view" option
    * I click tab with label "ENDPOINTS"
    * I click "ADD ENDPOINT" button
    * I enter "test-static" in input with label "URL pattern"
    * I click "NEXT" button
    * I click "NEXT" button
    * I click "NEXT" button
    * I click "EDIT" button
    * I wait for editor to load
    * I click editor to set cursor at the end of last line
    * I press up on keyboard
    * I press end on keyboard
    * I press backspace on keyboard 6 times
    * I type "'test';" on keyboard
    * I click "DONE" button
    * I click "NEXT" button
    * I click "NEXT" button
    * I click "SUBMIT" button
    * I can see on endpoint with "GET: test-static" label
    * I open endpoints expansion panel with "GET: test-static" label
    * I click "TEST ENDPOINT" button
    * I click "TEST" button
    * I wait for 5 seconds

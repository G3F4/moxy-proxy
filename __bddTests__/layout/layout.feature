Feature: Layout

  I want to find out if layout works fine

  Scenario: One with changing layout
    When I open Moxy Proxy
    When I select "Board view" option
    Then Layout changes to Board
    When I select "Panels view" option
    Then Layout changes to Panels
    When I select "Tabs view" option
    Then Layout changes to Tabs
    When I select "Panels view" option
    Then Layout changes to Panels
    When I select "Board view" option
    Then Layout changes to Board

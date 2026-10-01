Feature: Access the API using an identity provider's JWT
  As a React user authenticated by Keycloak
  I want the API to validate my access token
  So that only tokens intended for this API can load my profile

  Scenario: A valid access token identifies the user
    Given I have a "valid" access token
    When I request my profile
    Then the response status should be 200
    And the profile identifies "alice" with user ID "user-123"

  Scenario: An anonymous request is rejected
    When I request my profile
    Then the response status should be 401

  Scenario Outline: Invalid access tokens are rejected
    Given I have a "<kind>" access token
    When I request my profile
    Then the response status should be 401
    Examples:
      | kind            |
      | expired         |
      | wrong issuer    |
      | wrong audience  |
      | wrong signature |
      | malformed       |
      | missing subject |

  Scenario: React can preflight the Authorization header
    When React preflights the profile endpoint
    Then the response status should be 200
    And the allowed origin should be "http://localhost:3000"

  Scenario: Another website cannot use the API through CORS
    When another website preflights the profile endpoint
    Then the response status should be 403

  Scenario Outline: The old password endpoints no longer issue local tokens
    Given I have a "valid" access token
    When I post credentials to "<path>"
    Then the response status should be 404
    Examples:
      | path               |
      | /api/auth/login    |
      | /api/auth/register |

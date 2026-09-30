Feature: User login with JWT
  As a user of the app
  I want to register and log in
  So that I receive a JWT that lets me access protected pages

  Scenario: Registering a new user
    When I register with username "alice" and password "secret123"
    Then the response status should be 201

  Scenario: Registering a username that is already taken
    Given a user exists with username "alice" and password "secret123"
    When I register with username "alice" and password "another123"
    Then the response status should be 409

  Scenario: Logging in with correct credentials returns a token
    Given a user exists with username "alice" and password "secret123"
    When I log in with username "alice" and password "secret123"
    Then the response status should be 200
    And I should receive a JWT

  Scenario: Logging in with the wrong password is rejected
    Given a user exists with username "alice" and password "secret123"
    When I log in with username "alice" and password "wrongpass"
    Then the response status should be 401
    And I should not receive a JWT

  Scenario: Accessing a protected endpoint with a valid token
    Given a user exists with username "alice" and password "secret123"
    And I have logged in with username "alice" and password "secret123"
    When I request my profile using my token
    Then the response status should be 200
    And the profile username should be "alice"

  Scenario: Accessing a protected endpoint without a token
    When I request my profile without a token
    Then the response status should be 401

  Scenario: Accessing a protected endpoint with a tampered token
    Given a user exists with username "alice" and password "secret123"
    And I have logged in with username "alice" and password "secret123"
    When I request my profile using a tampered token
    Then the response status should be 401

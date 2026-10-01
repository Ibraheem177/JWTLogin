Feature: JWT user authentication
  As a user of the portal
  I want to authenticate with my credentials
  So that I can receive a signed JWT for my session

  Scenario: Successful login returns a JWT and allows the frontend origin
    When the client logs in with username "test-user" and password "test-password" from origin "http://localhost:3000"
    Then the response status is 200
    And the response contains a valid JWT for "test-user"
    And the CORS response allows origin "http://localhost:3000"

  Scenario: Invalid password is rejected
    When the client logs in with username "test-user" and password "wrong"
    Then the response status is 401
    And the response message is "Invalid username or password."

  Scenario: Missing credentials are rejected
    When the client logs in with username "" and password ""
    Then the response status is 400
    And the response message is "Username and password are required."

package com.example.demo.bdd;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;

import com.example.demo.user.UserRepository;

import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import tools.jackson.databind.ObjectMapper;

/**
 * Each method is matched to a line in login.feature by its annotation text.
 * The {string} / {int} placeholders become the method parameters.
 *
 * Cucumber creates a fresh instance of this class for every scenario,
 * so the fields below never leak between scenarios.
 */
public class LoginSteps {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    private final HttpClient http = HttpClient.newHttpClient();
    private final ObjectMapper json = new ObjectMapper();

    private HttpResponse<String> lastResponse;
    private String token;

    @Before
    public void clearDatabase() {
        userRepository.deleteAll();
    }

    // ---------- Given: set up the starting state ----------

    @Given("a user exists with username {string} and password {string}")
    public void aUserExists(String username, String password) throws Exception {
        HttpResponse<String> response = post("/api/auth/register", credentials(username, password));
        assertThat(response.statusCode()).isEqualTo(201);
    }

    @Given("I have logged in with username {string} and password {string}")
    public void iHaveLoggedIn(String username, String password) throws Exception {
        iLogIn(username, password);
        assertThat(lastResponse.statusCode()).isEqualTo(200);
    }

    // ---------- When: the action being tested ----------

    @When("I register with username {string} and password {string}")
    public void iRegister(String username, String password) throws Exception {
        lastResponse = post("/api/auth/register", credentials(username, password));
    }

    @When("I log in with username {string} and password {string}")
    public void iLogIn(String username, String password) throws Exception {
        lastResponse = post("/api/auth/login", credentials(username, password));
        if (lastResponse.statusCode() == 200) {
            token = json.readTree(lastResponse.body()).get("token").asString();
        }
    }

    @When("I request my profile using my token")
    public void iRequestMyProfileWithToken() throws Exception {
        lastResponse = getProfile("Bearer " + token);
    }

    @When("I request my profile without a token")
    public void iRequestMyProfileWithoutToken() throws Exception {
        lastResponse = getProfile(null);
    }

    @When("I request my profile using a tampered token")
    public void iRequestMyProfileWithTamperedToken() throws Exception {
        // Change the payload (middle part) so the signature no longer matches it.
        String[] parts = token.split("\\.");
        String fakePayload = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"sub\":\"admin\"}".getBytes());
        lastResponse = getProfile("Bearer " + parts[0] + "." + fakePayload + "." + parts[2]);
    }

    // ---------- Then: check the outcome ----------

    @Then("the response status should be {int}")
    public void theResponseStatusShouldBe(int expected) {
        assertThat(lastResponse.statusCode()).isEqualTo(expected);
    }

    @Then("I should receive a JWT")
    public void iShouldReceiveAJwt() {
        // A JWT is always three Base64URL sections separated by dots.
        assertThat(token).matches("^[\\w-]+\\.[\\w-]+\\.[\\w-]+$");
    }

    @Then("I should not receive a JWT")
    public void iShouldNotReceiveAJwt() {
        assertThat(token).isNull();
    }

    @Then("the profile username should be {string}")
    public void theProfileUsernameShouldBe(String expected) {
        String username = json.readTree(lastResponse.body()).get("username").asString();
        assertThat(username).isEqualTo(expected);
    }

    // ---------- helpers ----------

    private String credentials(String username, String password) {
        return json.writeValueAsString(Map.of("username", username, "password", password));
    }

    private HttpResponse<String> post(String path, String body) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(uri(path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> getProfile(String authorizationHeader) throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder(uri("/api/users/me")).GET();
        if (authorizationHeader != null) {
            builder.header("Authorization", authorizationHeader);
        }
        return http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }
}

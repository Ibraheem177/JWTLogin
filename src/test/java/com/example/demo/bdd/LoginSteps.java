package com.example.demo.bdd;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import com.example.demo.JwtTestSupport;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.ObjectMapper;

/** Each scenario gets fresh fields; requests pass through the real security chain. */
public class LoginSteps {
    @LocalServerPort
    private int port;
    private final HttpClient http = HttpClient.newHttpClient();
    private final ObjectMapper json = new ObjectMapper();
    private String token;
    private HttpResponse<String> response;

    @Given("I have a {string} access token")
    public void accessToken(String kind) throws Exception {
        token = JwtTestSupport.token(kind);
    }

    @When("I request my profile")
    public void profile() throws Exception {
        send(request("/api/users/me").GET());
    }

    @When("React preflights the profile endpoint")
    public void reactPreflight() throws Exception {
        preflight("http://localhost:3000");
    }

    @When("another website preflights the profile endpoint")
    public void foreignPreflight() throws Exception {
        preflight("https://untrusted.example");
    }

    @When("I post credentials to {string}")
    public void oldLogin(String path) throws Exception {
        send(request(path).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"username\":\"alice\",\"password\":\"secret123\"}")));
    }

    @Then("the response status should be {int}")
    public void status(int expected) {
        assertThat(response.statusCode()).isEqualTo(expected);
    }

    @Then("the profile identifies {string} with user ID {string}")
    public void identity(String username, String id) {
        var body = json.readTree(response.body());
        assertThat(body.get("username").asString()).isEqualTo(username);
        assertThat(body.get("id").asString()).isEqualTo(id);
    }

    @Then("the allowed origin should be {string}")
    public void origin(String expected) {
        assertThat(response.headers().firstValue("Access-Control-Allow-Origin")).contains(expected);
    }

    private void preflight(String origin) throws Exception {
        send(request("/api/users/me").method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                .header("Origin", origin)
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "authorization"));
    }

    private HttpRequest.Builder request(String path) {
        return HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
    }

    private void send(HttpRequest.Builder builder) throws Exception {
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }
}

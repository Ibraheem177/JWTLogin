package com.example.demo.auth.bdd;

import com.example.demo.auth.AuthController;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

public class AuthStepDefinitions {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private MvcResult response;

    @When("the client logs in with username {string} and password {string}")
    public void theClientLogsInWithUsernameAndPassword(String username, String password) throws Exception {
        response = mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AuthController.LoginRequest(username, password))))
                .andReturn();
    }

    @When("the client logs in with username {string} and password {string} from origin {string}")
    public void theClientLogsInWithUsernameAndPasswordFromOrigin(
            String username, String password, String origin) throws Exception {
        response = mockMvc.perform(post("/api/login")
                        .header("Origin", origin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AuthController.LoginRequest(username, password))))
                .andReturn();
    }

    @Then("the response status is {int}")
    public void theResponseStatusIs(int status) {
        assertThat(response.getResponse().getStatus()).isEqualTo(status);
    }

    @Then("the response contains a valid JWT for {string}")
    public void theResponseContainsAValidJwtFor(String username) throws Exception {
        JsonNode body = objectMapper.readTree(response.getResponse().getContentAsString());
        String token = body.path("accessToken").asText();
        String[] parts = token.split("\\.");

        assertThat(parts).hasSize(3);
        JsonNode header = objectMapper.readTree(Base64.getUrlDecoder().decode(parts[0]));
        JsonNode claims = objectMapper.readTree(Base64.getUrlDecoder().decode(parts[1]));
        assertThat(header.path("alg").asText()).isEqualTo("HS256");
        assertThat(claims.path("sub").asText()).isEqualTo(username);
        assertThat(claims.path("exp").asLong()).isGreaterThan(claims.path("iat").asLong());

        Mac hmac = Mac.getInstance("HmacSHA256");
        hmac.init(new SecretKeySpec(
                CucumberSpringConfiguration.JWT_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String expectedSignature = Base64.getUrlEncoder().withoutPadding().encodeToString(
                hmac.doFinal((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII)));
        assertThat(parts[2]).isEqualTo(expectedSignature);
    }

    @Then("the CORS response allows origin {string}")
    public void theCorsResponseAllowsOrigin(String origin) {
        assertThat(response.getResponse().getHeader("Access-Control-Allow-Origin")).isEqualTo(origin);
    }

    @Then("the response message is {string}")
    public void theResponseMessageIs(String message) throws Exception {
        JsonNode body = objectMapper.readTree(response.getResponse().getContentAsString());
        assertThat(body.path("message").asText()).isEqualTo(message);
    }
}

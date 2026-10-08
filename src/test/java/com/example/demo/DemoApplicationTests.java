package com.example.demo;

import com.example.demo.auth.AuthService;
import com.example.demo.auth.AppUser;
import com.example.demo.auth.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:jwtlogin-demo-tests;DB_CLOSE_DELAY=-1",
		"app.auth.username=admin",
		"app.auth.password=password"
})
@AutoConfigureMockMvc
class DemoApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AuthService authService;

	@Autowired
	private UserRepository userRepository;

	@Test
	void contextLoads() {
	}

	@Test
	void apiRequiresAKeycloakAccessToken() throws Exception {
		mockMvc.perform(get("/api/me"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void apiAcceptsAValidBackendUserToken() throws Exception {
		mockMvc.perform(get("/api/me")
						.header(AUTHORIZATION, "Bearer " + authService.createToken("local-user")))
				.andExpect(status().isOk());
	}

	@Test
	void defaultAdminCanLogIn() throws Exception {
		mockMvc.perform(post("/api/login")
						.contentType(APPLICATION_JSON)
						.content("""
								{"username":"admin","password":"password"}
								"""))
				.andExpect(status().isOk());
	}

	@Test
	void registeredUserIsStoredWithHashedPasswordAndCanLogIn() throws Exception {
		mockMvc.perform(post("/api/register")
						.contentType(APPLICATION_JSON)
						.content("""
								{"username":"new-user","password":"new-password"}
								"""))
				.andExpect(status().isCreated());

		AppUser user = userRepository.findByUsername("new-user").orElseThrow();
		assertThat(user.getPasswordHash()).startsWith("$2a$");
		assertThat(user.getPasswordHash()).isNotEqualTo("new-password");

		mockMvc.perform(post("/api/login")
						.contentType(APPLICATION_JSON)
						.content("""
								{"username":"new-user","password":"new-password"}
								"""))
				.andExpect(status().isOk());
	}

	@Test
	void registrationRejectsDuplicateUsernames() throws Exception {
		String request = """
				{"username":"duplicate-user","password":"new-password"}
				""";

		mockMvc.perform(post("/api/register").contentType(APPLICATION_JSON).content(request))
				.andExpect(status().isCreated());
		mockMvc.perform(post("/api/register").contentType(APPLICATION_JSON).content(request))
				.andExpect(status().isConflict());
	}
}

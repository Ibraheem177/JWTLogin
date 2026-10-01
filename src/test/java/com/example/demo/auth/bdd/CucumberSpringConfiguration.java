package com.example.demo.auth.bdd;

import io.cucumber.spring.CucumberContextConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

@CucumberContextConfiguration
@SpringBootTest(properties = {
        "app.auth.username=test-user",
        "app.auth.password=test-password",
        "app.jwt.secret=" + CucumberSpringConfiguration.JWT_SECRET,
        "app.cors.allowed-origin=http://localhost:3000"
})
@AutoConfigureMockMvc
public class CucumberSpringConfiguration {
    static final String JWT_SECRET = "0123456789abcdef0123456789abcdef";
}

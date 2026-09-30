package com.example.demo.bdd;

import org.springframework.boot.test.context.SpringBootTest;

import io.cucumber.spring.CucumberContextConfiguration;

/**
 * Starts the whole Spring Boot app on a random free port once for the test run,
 * so the scenarios hit it over real HTTP - exactly like the React frontend would.
 */
@CucumberContextConfiguration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class CucumberSpringConfiguration {
}

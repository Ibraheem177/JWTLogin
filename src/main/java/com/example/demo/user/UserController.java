package com.example.demo.user;

import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Protected endpoints - only reachable with a valid JWT. */
@RestController
@RequestMapping("/api/users")
public class UserController {

    /** Spring injects the Authentication that JwtAuthenticationFilter put in the SecurityContext. */
    @GetMapping("/me")
    public Map<String, String> me(Authentication authentication) {
        return Map.of("username", authentication.getName());
    }
}

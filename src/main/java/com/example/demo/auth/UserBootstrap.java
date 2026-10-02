package com.example.demo.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class UserBootstrap {
    @Bean
    ApplicationRunner seedBootstrapUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.auth.username:}") String username,
            @Value("${app.auth.password:}") String password) {
        return args -> {
            if (username.isBlank() || password.isBlank()) {
                return;
            }
            if (userRepository.findByUsername(username).isEmpty()) {
                userRepository.save(new AppUser(username, passwordEncoder.encode(password)));
            }
        };
    }
}

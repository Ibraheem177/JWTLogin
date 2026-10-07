package com.example.demo.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}
    public record Credentials(@NotBlank @Size(max = 80) String username, @NotBlank @Size(min = 8, max = 72) String password) {}
    public record UserView(Long id, String username) {}
    public record AuthResponse(String token, String tokenType, long expiresIn, UserView user) {}
}

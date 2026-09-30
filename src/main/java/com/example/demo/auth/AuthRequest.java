package com.example.demo.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** JSON body for both /register and /login: {"username":"...","password":"..."} */
public record AuthRequest(
        @NotBlank String username,
        @NotBlank @Size(min = 6, message = "must be at least 6 characters") String password) {
}

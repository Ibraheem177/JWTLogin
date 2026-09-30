package com.example.demo.auth;

/** JSON returned after a successful login: {"token":"xxx.yyy.zzz","username":"..."} */
public record AuthResponse(String token, String username) {
}

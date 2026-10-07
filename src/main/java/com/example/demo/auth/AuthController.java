package com.example.demo.auth;

import com.example.demo.user.AppUser;
import com.example.demo.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import static com.example.demo.auth.AuthDtos.*;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    public AuthController(UserRepository users, PasswordEncoder encoder, AuthenticationManager authenticationManager, JwtService jwtService) {
        this.users = users; this.encoder = encoder; this.authenticationManager = authenticationManager; this.jwtService = jwtService;
    }
    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody Credentials credentials) {
        if (users.existsByUsername(credentials.username())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken");
        AppUser user = users.save(new AppUser(credentials.username().trim(), encoder.encode(credentials.password())));
        return response(user);
    }
    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody Credentials credentials) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(credentials.username(), credentials.password()));
        return response((AppUser) authentication.getPrincipal());
    }
    @GetMapping("/me")
    public UserView me(@AuthenticationPrincipal AppUser user) { return new UserView(user.getId(), user.getUsername()); }
    private AuthResponse response(AppUser user) {
        return new AuthResponse(jwtService.issue(user), "Bearer", jwtService.expirationSeconds(), new UserView(user.getId(), user.getUsername()));
    }
}

package com.studyos.studyos_api.controller;

import com.studyos.studyos_api.dto.AuthResponse;
import com.studyos.studyos_api.dto.ForgotPasswordRequest;
import com.studyos.studyos_api.dto.GoogleAuthRequest;
import com.studyos.studyos_api.dto.LoginRequest;
import com.studyos.studyos_api.dto.RegisterRequest;
import com.studyos.studyos_api.dto.ResetPasswordRequest;
import com.studyos.studyos_api.service.AuthService;
import com.studyos.studyos_api.service.GoogleAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleAuthRequest request) {
        try {
            // Se tem nome, é o segundo passo do cadastro
            if (request.getName() != null && !request.getName().isBlank()) {
                return ResponseEntity.ok(googleAuthService.registerWithGoogle(
                        request.getCredential(), request.getName()));
            }
            return ResponseEntity.ok(googleAuthService.authenticateWithGoogle(
                    request.getCredential(), request.getMode()));

        } catch (GoogleAuthService.NeedsNameException e) {
            return ResponseEntity.status(202).body(Map.of(
                    "needsName", true,
                    "email", e.email,
                    "googleId", e.googleId,
                    "googleName", e.googleName != null ? e.googleName : ""
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "Se esse email estiver cadastrado, você receberá um link em breve."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Senha redefinida com sucesso!"));
    }
}
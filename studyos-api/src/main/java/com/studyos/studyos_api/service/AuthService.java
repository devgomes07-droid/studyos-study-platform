package com.studyos.studyos_api.service;

import com.studyos.studyos_api.dto.AuthResponse;
import com.studyos.studyos_api.dto.LoginRequest;
import com.studyos.studyos_api.dto.RegisterRequest;
import com.studyos.studyos_api.entity.User;
import com.studyos.studyos_api.repository.UserRepository;
import com.studyos.studyos_api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim(); // normaliza

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new RuntimeException("Email já cadastrado");
        }

        User user = User.builder()
                .email(email) // salva normalizado
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(user);

        String token = generateJwtForUser(user);
        return buildResponseForUser(token, user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim(); // normaliza

        // Busca o usuário antes de autenticar pra checar se é conta Google
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        // Bloqueia login manual em conta criada pelo Google
        if ("GOOGLE_OAUTH".equals(user.getPassword())) {
            throw new RuntimeException("Esta conta usa login com Google. Clique em 'Entrar com Google'.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        String token = generateJwtForUser(user);
        return buildResponseForUser(token, user);
    }

    public void forgotPassword(String email) {
        String normalizedEmail = email.toLowerCase().trim(); // normaliza
        userRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            emailService.sendPasswordResetEmail(normalizedEmail, token);
        });
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Token inválido ou expirado."));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expirado. Solicite um novo link.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    // Usados pelo GoogleAuthService também
    public String generateJwtForUser(User user) {
        String password = user.getPassword() != null ? user.getPassword() : "";
        return jwtService.generateToken(
                org.springframework.security.core.userdetails.User
                        .withUsername(user.getEmail())
                        .password(password)
                        .authorities("USER")
                        .build()
        );
    }

    public AuthResponse buildResponseForUser(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .xp(user.getXp())
                .level(user.getLevel())
                .build();
    }
}
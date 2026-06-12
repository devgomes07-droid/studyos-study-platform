package com.studyos.studyos_api.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.studyos.studyos_api.dto.AuthResponse;
import com.studyos.studyos_api.entity.User;
import com.studyos.studyos_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final AuthService authService;

    @Value("${google.client-id}")
    private String googleClientId;

    public AuthResponse authenticateWithGoogle(String credential) {
        GoogleIdToken.Payload payload = verifyToken(credential);

        String googleId = payload.getSubject();
        String email    = payload.getEmail();
        String name     = (String) payload.get("name");

        User user = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(email))
                .orElse(null);

        if (user == null) {
            // Usuário novo — cria via Google
            user = User.builder()
                    .email(email)
                    .name(name != null ? name : email)
                    .googleId(googleId)
                    .password("GOOGLE_OAUTH") // placeholder, nunca usado pra login normal
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepository.save(user);
        } else if (user.getGoogleId() == null) {
            // Conta existente por email — vincula o googleId
            user.setGoogleId(googleId);
            userRepository.save(user);
        }

        String token = authService.generateJwtForUser(user);
        return authService.buildResponseForUser(token, user);
    }

    private GoogleIdToken.Payload verifyToken(String credential) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken == null) {
                throw new RuntimeException("Token do Google inválido");
            }
            return idToken.getPayload();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao verificar token do Google: " + e.getMessage());
        }
    }
}
package com.studyos.studyos_api.service;

import com.studyos.studyos_api.dto.AuthResponse;
import com.studyos.studyos_api.entity.User;
import com.studyos.studyos_api.repository.UserRepository;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final AuthService authService;

    @Value("${google.client-id}")
    private String googleClientId;

    private static final String GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
    private static final String GOOGLE_ISSUER_1 = "https://accounts.google.com";
    private static final String GOOGLE_ISSUER_2 = "accounts.google.com";

    public AuthResponse authenticateWithGoogle(String credential) {
        JWTClaimsSet claims = verifyToken(credential);

        String googleId = claims.getSubject();
        String email;
        String name;
        try {
            email = claims.getStringClaim("email");
            name = claims.getStringClaim("name");
        } catch (Exception e) {
            throw new RuntimeException("Erro ao ler dados do token do Google: " + e.getMessage());
        }

        User user = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(email))
                .orElse(null);

        if (user == null) {
            user = User.builder()
                    .email(email)
                    .name(name != null ? name : email)
                    .googleId(googleId)
                    .password("GOOGLE_OAUTH")
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepository.save(user);
        } else if (user.getGoogleId() == null) {
            user.setGoogleId(googleId);
            userRepository.save(user);
        }

        String token = authService.generateJwtForUser(user);
        return authService.buildResponseForUser(token, user);
    }

    private JWTClaimsSet verifyToken(String credential) {
        try {
            JWKSource<SecurityContext> keySource = new RemoteJWKSet<>(new URL(GOOGLE_JWKS_URL));

            ConfigurableJWTProcessor<SecurityContext> jwtProcessor = new DefaultJWTProcessor<>();
            JWSVerificationKeySelector<SecurityContext> keySelector =
                    new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keySource);
            jwtProcessor.setJWSKeySelector(keySelector);

            JWTClaimsSet claims = jwtProcessor.process(credential, null);

            String issuer = claims.getIssuer();
            if (!GOOGLE_ISSUER_1.equals(issuer) && !GOOGLE_ISSUER_2.equals(issuer)) {
                throw new RuntimeException("Issuer invalido: " + issuer);
            }

            String clientIdTrimmed = googleClientId.trim();
            boolean audienceMatches = claims.getAudience().stream()
                    .anyMatch(aud -> aud.trim().equals(clientIdTrimmed));

            if (!audienceMatches) {
                System.out.println("DEBUG audience token: [" + claims.getAudience() + "]");
                System.out.println("DEBUG googleClientId: [" + googleClientId + "]");
                throw new RuntimeException("Audience invalida: " + claims.getAudience());
            }

            java.util.Date exp = claims.getExpirationTime();
            if (exp == null || exp.before(new java.util.Date())) {
                throw new RuntimeException("Token expirado");
            }

            return claims;
        } catch (Exception e) {
            System.out.println("EXCEPTION na verificação: " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erro ao verificar token do Google: " + e.getMessage());
        }
    }
}
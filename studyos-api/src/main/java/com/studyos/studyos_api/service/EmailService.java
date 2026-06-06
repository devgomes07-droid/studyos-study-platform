package com.studyos.studyos_api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${resend.api-key}")
    private String resendApiKey;

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/pages/reset-password.html?token=" + token;

        String body = """
                {
                  "from": "StudyOS <onboarding@resend.dev>",
                  "to": ["%s"],
                  "subject": "StudyOS — Redefinição de senha",
                  "html": "<p>Olá!</p><p>Clique no link abaixo para redefinir sua senha:</p><p><a href='%s'>Redefinir senha</a></p><p>Este link expira em 1 hora.</p><p>Se você não solicitou, ignore este email.</p>"
                }
                """.formatted(toEmail, resetLink);

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        HttpEntity<String> request = new HttpEntity<>(body, headers);

        restTemplate.postForEntity("https://api.resend.com/emails", request, String.class);
    }
}
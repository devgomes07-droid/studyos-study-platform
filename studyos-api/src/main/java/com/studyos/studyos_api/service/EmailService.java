package com.studyos.studyos_api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/pages/reset-password.html?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("StudyOS — Redefinição de senha");
        message.setText(
                "Olá!\n\n" +
                        "Recebemos uma solicitação para redefinir a senha da sua conta StudyOS.\n\n" +
                        "Clique no link abaixo para criar uma nova senha:\n" +
                        resetLink + "\n\n" +
                        "Este link expira em 1 hora.\n\n" +
                        "Se você não solicitou a redefinição, ignore este email.\n\n" +
                        "— Equipe StudyOS"
        );

        mailSender.send(message);
    }



}

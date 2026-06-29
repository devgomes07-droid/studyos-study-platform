package com.studyos.studyos_api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class GeminiAIService {

    @Value("${gemini.api.key}")
    private String apiKey;

    // Modelo gratuito e rápido, ideal pra esse tipo de tarefa curta
    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Gera uma pergunta de flashcard a partir de uma resposta,
     * usando a API gratuita do Gemini.
     */
    public String generateQuestion(String answer, String subjectName) {
        String prompt = buildPrompt(answer, subjectName);

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.4,
                        "maxOutputTokens", 100
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            String response = restTemplate.postForObject(GEMINI_URL + apiKey, request, String.class);
            return extractText(response);
        } catch (Exception e) {
            log.error("Erro ao chamar Gemini API: {}", e.getMessage());
            throw new RuntimeException("Não foi possível gerar a pergunta agora. Tente novamente.");
        }
    }

    private String buildPrompt(String answer, String subjectName) {
        String contexto = (subjectName != null && !subjectName.isBlank())
                ? " A matéria é: " + subjectName + "."
                : "";

        return "Você cria perguntas de flashcard de estudo. " +
                "Dada a resposta abaixo, gere APENAS a pergunta correspondente, " +
                "curta, direta e clara, sem explicações, sem aspas, sem prefixos como 'Pergunta:'." +
                contexto +
                "\n\nResposta: " + answer +
                "\n\nPergunta:";
    }

    private String extractText(String responseJson) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            String text = root
                    .path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text")
                    .asText();
            return text.trim().replaceAll("^\"|\"$", "");
        } catch (Exception e) {
            log.error("Erro ao parsear resposta do Gemini: {}", e.getMessage());
            throw new RuntimeException("Resposta inesperada da IA. Tente novamente.");
        }
    }
}
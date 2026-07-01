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

    // modelo estável do tier gratuito
    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generateQuestion(String answer, String subjectName) {
        String prompt = buildPrompt(answer, subjectName);

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "maxOutputTokens", 300  // aumentado pra não cortar a pergunta
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
                ? " Matéria: " + subjectName + "."
                : "";

        return "Você é um professor criando flashcards de estudo." + contexto + "\n\n" +
                "Com base na resposta abaixo, crie UMA pergunta de flashcard.\n" +
                "Regras:\n" +
                "- A pergunta deve ser completa, clara e direta\n" +
                "- Entre 5 e 15 palavras\n" +
                "- Sem aspas, sem prefixos como 'Pergunta:' ou 'P:'\n" +
                "- Apenas a pergunta, nada mais\n\n" +
                "Resposta: " + answer + "\n\n" +
                "Pergunta:";
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
            return text.trim().replaceAll("^\"|\"$", "").replaceAll("\\n+$", "");
        } catch (Exception e) {
            log.error("Erro ao parsear resposta do Gemini: {}", e.getMessage());
            throw new RuntimeException("Resposta inesperada da IA. Tente novamente.");
        }
    }
}

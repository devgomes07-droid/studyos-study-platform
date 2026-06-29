package com.studyos.studyos_api.controller;

import com.studyos.studyos_api.dto.FlashcardRequest;
import com.studyos.studyos_api.dto.FlashcardResponse;
import com.studyos.studyos_api.dto.GenerateQuestionRequest;
import com.studyos.studyos_api.dto.GenerateQuestionResponse;
import com.studyos.studyos_api.service.FlashcardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;

    @GetMapping
    public ResponseEntity<List<FlashcardResponse>> listAll(
            @RequestParam(required = false) Long subjectId) {
        return ResponseEntity.ok(flashcardService.listAll(subjectId));
    }

    @GetMapping("/due")
    public ResponseEntity<List<FlashcardResponse>> listDue() {
        return ResponseEntity.ok(flashcardService.listDue());
    }

    @PostMapping
    public ResponseEntity<FlashcardResponse> create(@RequestBody FlashcardRequest request) {
        return ResponseEntity.ok(flashcardService.create(request));
    }

    // ── NOVO: faltava a rota de edição usada pelo frontend (saveEdit -> Api.updateFlashcard) ──
    @PutMapping("/{id}")
    public ResponseEntity<FlashcardResponse> update(
            @PathVariable Long id,
            @RequestBody FlashcardRequest request) {
        return ResponseEntity.ok(flashcardService.update(id, request));
    }

    @PostMapping("/generate-question")
    public ResponseEntity<?> generateQuestion(@RequestBody GenerateQuestionRequest request) {
        try {
            String question = flashcardService.generateQuestion(
                    request.getAnswer(),
                    request.getSubjectId()
            );
            return ResponseEntity.ok(
                    GenerateQuestionResponse.builder().question(question).build()
            );
        } catch (IllegalArgumentException e) {
            // erro de validação (ex: resposta vazia) -> 400 com mensagem clara pro frontend
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            // falha ao chamar a IA -> 502 com mensagem clara pro frontend
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<FlashcardResponse> review(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body) {
        return ResponseEntity.ok(flashcardService.review(id, body.get("quality")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        flashcardService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
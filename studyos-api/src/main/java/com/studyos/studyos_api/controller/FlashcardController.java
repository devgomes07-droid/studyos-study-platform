package com.studyos.studyos_api.controller;

import com.studyos.studyos_api.dto.FlashcardRequest;
import com.studyos.studyos_api.dto.FlashcardResponse;
import com.studyos.studyos_api.service.FlashcardService;
import lombok.RequiredArgsConstructor;
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
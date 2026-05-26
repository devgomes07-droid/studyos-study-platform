package com.studyos.studyos_api.controller;

import com.studyos.studyos_api.dto.SessionRequest;
import com.studyos.studyos_api.dto.SessionResponse;
import com.studyos.studyos_api.service.StudySessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class StudySessionController {

    private final StudySessionService sessionService;

    @PostMapping("/start")
    public ResponseEntity<SessionResponse> start(@RequestBody SessionRequest request) {
        return ResponseEntity.ok(sessionService.start(request));
    }

    @PostMapping("/{id}/finish")
    public ResponseEntity<SessionResponse> finish(@PathVariable Long id, @RequestBody SessionRequest request) {
        return ResponseEntity.ok(sessionService.finish(id, request));
    }

    @GetMapping
    public ResponseEntity<List<SessionResponse>> history() {
        return ResponseEntity.ok(sessionService.history());
    }
}

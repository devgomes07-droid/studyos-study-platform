package com.studyos.studyos_api.controller;

import com.studyos.studyos_api.dto.StudyMethodResponse;
import com.studyos.studyos_api.service.StudyMethodService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/study-methods")
@RequiredArgsConstructor
public class StudyMethodController {

    private final StudyMethodService studyMethodService;

    @GetMapping
    public ResponseEntity<List<StudyMethodResponse>> findAll() {
        return ResponseEntity.ok(studyMethodService.findAll());
    }
}
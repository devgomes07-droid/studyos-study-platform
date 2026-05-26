package com.studyos.studyos_api.controller;

import com.studyos.studyos_api.dto.SubjectRequest;
import com.studyos.studyos_api.dto.SubjectResponse;
import com.studyos.studyos_api.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public ResponseEntity<List<SubjectResponse>> listAll() {
        return ResponseEntity.ok(subjectService.listAll());
    }

    @PostMapping
    public ResponseEntity<SubjectResponse> create(@RequestBody SubjectRequest request) {
        return ResponseEntity.ok(subjectService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubjectResponse> update(@PathVariable Long id, @RequestBody SubjectRequest request) {
        return ResponseEntity.ok(subjectService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        subjectService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

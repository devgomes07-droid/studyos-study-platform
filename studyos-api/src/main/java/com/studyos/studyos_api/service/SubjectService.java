package com.studyos.studyos_api.service;

import com.studyos.studyos_api.dto.SubjectRequest;
import com.studyos.studyos_api.dto.SubjectResponse;
import com.studyos.studyos_api.entity.Subject;
import com.studyos.studyos_api.entity.User;
import com.studyos.studyos_api.repository.SubjectRepository;
import com.studyos.studyos_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public List<SubjectResponse> listAll() {
        User user = getCurrentUser();
        return subjectRepository.findByUserIdAndActiveTrue(user.getId())
                .stream().map(this::toResponse).toList();
    }

    public SubjectResponse create(SubjectRequest request) {
        User user = getCurrentUser();
        Subject subject = Subject.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .color(request.getColor() != null ? request.getColor() : "#6366f1")
                .icon(request.getIcon())
                .weeklyGoalHours(request.getWeeklyGoalHours() != null ? request.getWeeklyGoalHours() : 0)
                .build();
        return toResponse(subjectRepository.save(subject));
    }

    public SubjectResponse update(Long id, SubjectRequest request) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matéria não encontrada"));
        subject.setName(request.getName());
        subject.setDescription(request.getDescription());
        subject.setColor(request.getColor());
        subject.setIcon(request.getIcon());
        subject.setWeeklyGoalHours(request.getWeeklyGoalHours());
        return toResponse(subjectRepository.save(subject));
    }

    public void delete(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matéria não encontrada"));
        subject.setActive(false);
        subjectRepository.save(subject);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    private SubjectResponse toResponse(Subject s) {
        return SubjectResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .color(s.getColor())
                .icon(s.getIcon())
                .weeklyGoalHours(s.getWeeklyGoalHours())
                .totalHoursStudied(s.getTotalHoursStudied())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
package com.studyos.studyos_api.service;

import com.studyos.studyos_api.dto.SessionRequest;
import com.studyos.studyos_api.dto.SessionResponse;
import com.studyos.studyos_api.entity.StudySession;
import com.studyos.studyos_api.entity.Subject;
import com.studyos.studyos_api.entity.User;
import com.studyos.studyos_api.repository.StudySessionRepository;
import com.studyos.studyos_api.repository.SubjectRepository;
import com.studyos.studyos_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudySessionService {

    private final StudySessionRepository sessionRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public SessionResponse start(SessionRequest request) {
        User user = getCurrentUser();
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Matéria não encontrada"));
        StudySession session = StudySession.builder()
                .user(user)
                .subject(subject)
                .startedAt(LocalDateTime.now())
                .build();
        return toResponse(sessionRepository.save(session), subject);
    }

    public SessionResponse finish(Long sessionId, SessionRequest request) {
        StudySession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Sessão não encontrada"));
        LocalDateTime endedAt = LocalDateTime.now();
        long minutes = Duration.between(session.getStartedAt(), endedAt).toMinutes();
        session.setEndedAt(endedAt);
        session.setDurationMinutes((int) minutes);
        session.setCompleted(true);
        session.setNotes(request.getNotes());
        session.setXpEarned(10 + (int)(minutes / 5));
        Subject subject = subjectRepository.findById(session.getSubject().getId())
                .orElseThrow(() -> new RuntimeException("Matéria não encontrada"));
        subject.setTotalHoursStudied(subject.getTotalHoursStudied() + (minutes / 60.0));
        subjectRepository.save(subject);
        User user = getCurrentUser();
        user.addXp(session.getXpEarned());
        userRepository.save(user);
        sessionRepository.save(session);
        return toResponse(session, subject);
    }

    public List<SessionResponse> history() {
        User user = getCurrentUser();
        return sessionRepository.findByUserIdOrderByStartedAtDesc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    private SessionResponse toResponse(StudySession s, Subject subject) {
        return SessionResponse.builder()
                .id(s.getId())
                .subjectId(subject.getId())
                .subjectName(subject.getName())
                .startedAt(s.getStartedAt())
                .endedAt(s.getEndedAt())
                .durationMinutes(s.getDurationMinutes())
                .type(s.getType().name())
                .completed(s.getCompleted())
                .xpEarned(s.getXpEarned())
                .notes(s.getNotes())
                .build();
    }

    private SessionResponse toResponse(StudySession s) {
        Subject subject = subjectRepository.findById(s.getSubject().getId())
                .orElseThrow(() -> new RuntimeException("Matéria não encontrada"));
        return toResponse(s, subject);
    }
}
package com.studyos.studyos_api.service;

import com.studyos.studyos_api.dto.SessionRequest;
import com.studyos.studyos_api.dto.SessionResponse;
import com.studyos.studyos_api.entity.StudySession;
import com.studyos.studyos_api.entity.Subject;
import com.studyos.studyos_api.entity.User;
import com.studyos.studyos_api.enums.StudyMethodType;
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

    private static final int MIN_XP_MINUTES = 5;

    private final StudySessionRepository sessionRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public SessionResponse start(SessionRequest request) {
        User user = getCurrentUser();

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Materia nao encontrada"));

        StudyMethodType method = request.getStudyMethod() != null
                ? request.getStudyMethod()
                : StudyMethodType.FREE_REVIEW;

        StudySession session = StudySession.builder()
                .user(user)
                .subject(subject)
                .startedAt(LocalDateTime.now())
                .build();

        session.setStudyMethod(method);

        return toResponse(sessionRepository.save(session), subject);
    }

    public SessionResponse finish(Long sessionId, SessionRequest request) {
        User user = getCurrentUser();

        StudySession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Sessao nao encontrada"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Voce nao pode finalizar esta sessao.");
        }

        if (Boolean.TRUE.equals(session.getCompleted())) {
            throw new RuntimeException("Esta sessao ja foi finalizada.");
        }

        LocalDateTime endedAt = LocalDateTime.now();
        int minutes = Math.toIntExact(Duration.between(session.getStartedAt(), endedAt).toMinutes());

        session.setEndedAt(endedAt);
        session.setDurationMinutes(minutes);
        session.setCompleted(true);
        session.setNotes(request.getNotes());

        StudyMethodType method = session.getStudyMethod() != null
                ? session.getStudyMethod()
                : StudyMethodType.FREE_REVIEW;

        int xpEarned = minutes >= MIN_XP_MINUTES ? calculateXp(minutes, method) : 0;
        session.setXpEarned(xpEarned);

        Subject subject = session.getSubject();
        subject.setTotalHoursStudied(subject.getTotalHoursStudied() + (minutes / 60.0));
        subjectRepository.save(subject);

        if (xpEarned > 0) {
            user.addXp(xpEarned);
            userRepository.save(user);
        }

        sessionRepository.save(session);

        return toResponse(session, subject);
    }

    public List<SessionResponse> history() {
        User user = getCurrentUser();

        return sessionRepository.findByUserIdOrderByStartedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private int calculateXp(int minutes, StudyMethodType method) {
        int baseXp = switch (method) {
            case FEYNMAN, ACTIVE_RECALL, QUESTIONS -> 20;
            case POMODORO, FIFTY_TWO_SEVENTEEN, TIMEBOXING -> 15;
            case FLASHCARDS, SPACED_REPETITION -> 12;
            default -> 10;
        };

        int timeXp = minutes * 2;

        int methodBonus = switch (method) {
            case FEYNMAN, ACTIVE_RECALL, QUESTIONS -> 8;
            case POMODORO, FIFTY_TWO_SEVENTEEN -> 5;
            default -> 0;
        };

        return Math.min(baseXp + timeXp + methodBonus, 120);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario nao encontrado"));
    }

    private SessionResponse toResponse(StudySession session, Subject subject) {
        return SessionResponse.builder()
                .id(session.getId())
                .subjectId(subject.getId())
                .subjectName(subject.getName())
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .durationMinutes(session.getDurationMinutes())
                .type(session.getType().name())
                .studyMethod(session.getStudyMethod() != null ? session.getStudyMethod().name() : null)
                .completed(session.getCompleted())
                .xpEarned(session.getXpEarned())
                .notes(session.getNotes())
                .build();
    }

    private SessionResponse toResponse(StudySession session) {
        Subject subject = subjectRepository.findById(session.getSubject().getId())
                .orElseThrow(() -> new RuntimeException("Materia nao encontrada"));

        return toResponse(session, subject);
    }
}
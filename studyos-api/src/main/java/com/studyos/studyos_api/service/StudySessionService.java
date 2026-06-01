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
    private final BadgeService badgeService;

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
                .completed(false)
                .xpEarned(0)
                .build();

        session.setStudyMethod(method);

        sessionRepository.save(session);

        return toResponse(session, subject);
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

        int minutes = Math.toIntExact(
                Duration.between(session.getStartedAt(), endedAt).toMinutes()
        );

        session.setEndedAt(endedAt);
        session.setDurationMinutes(minutes);
        session.setCompleted(true);
        session.setNotes(request.getNotes());

        StudyMethodType method = session.getStudyMethod() != null
                ? session.getStudyMethod()
                : StudyMethodType.FREE_REVIEW;

        int xpEarned = 0;

        if (minutes >= MIN_XP_MINUTES) {
            xpEarned = calculateXp(minutes, method);
        }

        session.setXpEarned(xpEarned);

        Subject subject = session.getSubject();

        double currentHours = subject.getTotalHoursStudied() != null
                ? subject.getTotalHoursStudied()
                : 0.0;

        subject.setTotalHoursStudied(currentHours + (minutes / 60.0));
        subjectRepository.save(subject);

        if (xpEarned > 0) {
            user.addXp(xpEarned);
            userRepository.save(user);
        }

        sessionRepository.save(session);

        // Verifica e desbloqueia badges — retorna apenas os recém-desbloqueados
        List<String> newBadges = badgeService.checkAndUnlock(user);

        SessionResponse response = toResponse(session, subject);
        response.setNewBadges(newBadges);
        return response;
    }

    public List<SessionResponse> history() {

        User user = getCurrentUser();

        return sessionRepository.findByUserIdOrderByStartedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private int calculateXp(int minutes, StudyMethodType method) {

        int baseXp;
        int multiplier;

        switch (method) {
            case POMODORO -> { baseXp = 15; multiplier = 2; }
            case FLOW_STATE -> { baseXp = 30; multiplier = 4; }
            case FIFTY_TWO_SEVENTEEN -> { baseXp = 20; multiplier = 3; }
            case TIMEBOXING -> { baseXp = 18; multiplier = 2; }
            case FEYNMAN -> { baseXp = 35; multiplier = 5; }
            case ACTIVE_RECALL -> { baseXp = 32; multiplier = 5; }
            case FLASHCARDS -> { baseXp = 16; multiplier = 2; }
            case SPACED_REPETITION -> { baseXp = 22; multiplier = 3; }
            case GUIDED_READING -> { baseXp = 14; multiplier = 2; }
            case QUESTIONS -> { baseXp = 30; multiplier = 4; }
            case CORNELL_NOTES -> { baseXp = 24; multiplier = 3; }
            default -> { baseXp = 10; multiplier = 1; }
        }

        int xp = baseXp + (minutes * multiplier);

        if (minutes >= 60)  xp += 25;
        if (minutes >= 120) xp += 50;

        return Math.min(xp, 500);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
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
                .studyMethod(
                        session.getStudyMethod() != null
                                ? session.getStudyMethod().name()
                                : null
                )
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
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
                ? subject.getTotalHoursStudied() : 0.0;
        subject.setTotalHoursStudied(currentHours + (minutes / 60.0));
        subjectRepository.save(subject);

        if (xpEarned > 0) {
            user.addXp(xpEarned);
            userRepository.save(user);
        }

        sessionRepository.save(session);

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
        int xp;

        switch (method) {

            // ── Pomodoro: XP fixo por sessão concluída ──────────────
            // Cada pomodoro é uma unidade de trabalho com começo e fim.
            // Não faz sentido dar XP por minuto aqui.
            case POMODORO -> xp = 30;

            // ── Alta concentração: base alta + tempo, teto 150 ──────
            // Feynman e Active Recall exigem esforço cognitivo real.
            // Recompensa maior pra incentivar métodos difíceis.
            case FEYNMAN        -> xp = Math.min(40 + (int)(minutes * 1.5), 150);
            case ACTIVE_RECALL  -> xp = Math.min(35 + (int)(minutes * 1.5), 140);
            case QUESTIONS      -> xp = Math.min(25 + (int)(minutes * 1.5), 120);

            // ── Estruturado: base média + tempo, teto 110 ───────────
            // Métodos com estrutura definida (blocos, anotações).
            // Mais XP que livre, menos que alta concentração.
            case CORNELL_NOTES      -> xp = Math.min(20 + minutes, 110);
            case SPACED_REPETITION  -> xp = Math.min(15 + (int)(minutes * 1.2), 100);
            case FIFTY_TWO_SEVENTEEN-> xp = Math.min(15 + (int)(minutes * 1.2), 100);
            case TIMEBOXING         -> xp = Math.min(15 + (int)(minutes * 1.2), 100);

            // ── Cronômetro livre: 1 XP/min, teto 90 ─────────────────
            // Flow State é o mais fácil de farmar — teto baixo
            // e XP por minuto mínimo pra não compensar deixar rodando.
            case FLOW_STATE -> xp = Math.min(minutes, 90);

            // ── Flashcards: por minuto, teto 80 ─────────────────────
            // Já tem recompensa via badges (10, 20, 50 flashcards).
            // XP moderado pra não duplicar recompensa.
            case FLASHCARDS         -> xp = Math.min((int)(minutes * 0.9), 80);
            case GUIDED_READING     -> xp = Math.min((int)(minutes * 0.8), 80);

            // ── Padrão: XP mínimo ────────────────────────────────────
            default -> xp = Math.min((int)(minutes * 0.5), 60);
        }

        // Bônus de sessão longa — recompensa quem estuda mais de 1h
        // Valores menores que antes pra não inflar o total
        if (minutes >= 60)  xp = Math.min(xp + 15, getMaxXp(method));
        if (minutes >= 120) xp = Math.min(xp + 25, getMaxXp(method));

        return xp;
    }

    // Teto por método — usado nos bônus de sessão longa
    private int getMaxXp(StudyMethodType method) {
        return switch (method) {
            case FEYNMAN, ACTIVE_RECALL         -> 150;
            case QUESTIONS                      -> 120;
            case CORNELL_NOTES                  -> 110;
            case SPACED_REPETITION,
                 FIFTY_TWO_SEVENTEEN,
                 TIMEBOXING                     -> 100;
            case FLOW_STATE                     -> 90;
            case FLASHCARDS, GUIDED_READING     -> 80;
            case POMODORO                       -> 30;
            default                             -> 60;
        };
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
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
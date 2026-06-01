package com.studyos.studyos_api.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;
    private Integer xp;
    private Integer level;
    private Integer currentStreak;
    private Integer overall;
    // skills originais
    private Integer skillConsistency;
    private Integer skillSessions;
    private Integer skillHours;
    private Integer skillFlashcards;
    private Integer skillProductivity;
    // skills novas
    private Integer skillFocus;
    private Integer skillNightOwl;
    private Integer skillDiscipline;
    private Integer skillPerfectionist;
    private Integer skillExplorer;
    private Integer focusRate;
    private LocalDateTime createdAt;
}
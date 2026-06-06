package com.studyos.studyos_api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Builder.Default @Column(nullable = false)
    private Integer xp = 0;

    @Builder.Default @Column(nullable = false)
    private Integer level = 1;

    @Builder.Default @Column(name = "current_streak", nullable = false)
    private Integer currentStreak = 0;

    @Builder.Default @Column(nullable = false)
    private Integer overall = 0;

    @Builder.Default @Column(name = "skill_consistency",  nullable = false) private Integer skillConsistency  = 1;
    @Builder.Default @Column(name = "skill_sessions",     nullable = false) private Integer skillSessions     = 1;
    @Builder.Default @Column(name = "skill_hours",        nullable = false) private Integer skillHours        = 1;
    @Builder.Default @Column(name = "skill_flashcards",   nullable = false) private Integer skillFlashcards   = 1;
    @Builder.Default @Column(name = "skill_productivity", nullable = false) private Integer skillProductivity = 1;

    @Builder.Default @Column(name = "skill_focus",         nullable = false) private Integer skillFocus        = 1;
    @Builder.Default @Column(name = "skill_nightowl",      nullable = false) private Integer skillNightOwl     = 1;
    @Builder.Default @Column(name = "skill_discipline",    nullable = false) private Integer skillDiscipline   = 1;
    @Builder.Default @Column(name = "skill_perfectionist", nullable = false) private Integer skillPerfectionist= 1;
    @Builder.Default @Column(name = "skill_explorer",      nullable = false) private Integer skillExplorer     = 1;

    @Builder.Default @Column(name = "focus_rate", nullable = false)
    private Integer focusRate = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // ── Reset de senha ──────────────────────────
    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    public void addXp(int amount) {
        this.xp += amount;
        this.level = (this.xp / 500) + 1;
    }

    public void recalculateOverall() {
        double avg = (skillConsistency + skillSessions + skillHours + skillFlashcards
                + skillProductivity + skillFocus + skillNightOwl + skillDiscipline
                + skillPerfectionist + skillExplorer) / 10.0;
        this.overall = (int) Math.round((avg - 1) / 4.0 * 99);
    }
}
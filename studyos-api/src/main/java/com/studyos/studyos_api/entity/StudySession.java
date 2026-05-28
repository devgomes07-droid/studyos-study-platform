package com.studyos.studyos_api.entity;

import com.studyos.studyos_api.enums.SessionType;
import com.studyos.studyos_api.enums.StudyMethodType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "study_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ALTERADO DE LAZY → EAGER
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ALTERADO DE LAZY → EAGER
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private SessionType type = SessionType.FOCUS;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "study_method", nullable = false)
    private StudyMethodType studyMethod = StudyMethodType.FREE_REVIEW;

    @Builder.Default
    @Column(nullable = false)
    private Boolean completed = false;

    @Builder.Default
    @Column(name = "xp_earned", nullable = false)
    private Integer xpEarned = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
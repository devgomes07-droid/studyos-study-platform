package com.studyos.studyos_api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "flashcards")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    // SM-2
    @Builder.Default
    @Column(name = "interval_days", nullable = false)
    private Integer intervalDays = 1;

    @Builder.Default
    @Column(name = "ease_factor", nullable = false)
    private Double easeFactor = 2.5;

    @Builder.Default
    @Column(name = "repetitions", nullable = false)
    private Integer repetitions = 0;

    @Column(name = "next_review_at")
    private LocalDateTime nextReviewAt;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Algoritmo SM-2
    public void review(int quality) {
        if (quality < 3) {
            this.repetitions = 0;
            this.intervalDays = 1;
        } else {
            if (repetitions == 0) this.intervalDays = 1;
            else if (repetitions == 1) this.intervalDays = 6;
            else this.intervalDays = (int) Math.round(intervalDays * easeFactor);

            double newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            this.easeFactor = Math.max(1.3, newEF);
            this.repetitions++;
        }
        this.nextReviewAt = LocalDateTime.now().plusDays(intervalDays);
    }
}
package com.studyos.studyos_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardResponse {
    private Long id;
    private Long subjectId;
    private String subjectName;
    private String subjectColor;
    private String subjectIcon;
    private String question;
    private String answer;
    private Integer intervalDays;
    private Integer repetitions;
    private Double easeFactor;
    private LocalDateTime nextReviewAt;
    private LocalDateTime createdAt;
}
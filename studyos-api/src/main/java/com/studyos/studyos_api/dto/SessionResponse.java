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
public class SessionResponse {

    private Long id;

    private Long subjectId;

    private String subjectName;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    private Integer durationMinutes;

    private String type;

    private String studyMethod;

    private Boolean completed;

    private Integer xpEarned;

    private Integer focusScore;

    private Boolean perfectSession;

    private String notes;
}

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
public class SubjectResponse {
    private Long id;
    private String name;
    private String description;
    private String color;
    private String icon;
    private Integer weeklyGoalHours;
    private Double totalHoursStudied;
    private LocalDateTime createdAt;
}
package com.studyos.studyos_api.dto;

import lombok.Data;

@Data
public class SubjectRequest {
    private String name;
    private String description;
    private String color;
    private String icon;
    private Integer weeklyGoalHours;
}
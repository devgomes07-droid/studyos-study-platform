package com.studyos.studyos_api.dto;

import com.studyos.studyos_api.enums.StudyMethodType;

public class StudyMethodResponse {

    private final StudyMethodType id;
    private final String icon;
    private final String name;
    private final String description;
    private final String duration;
    private final String intensity;
    private final String color;

    public StudyMethodResponse(
            StudyMethodType id,
            String icon,
            String name,
            String description,
            String duration,
            String intensity,
            String color
    ) {
        this.id = id;
        this.icon = icon;
        this.name = name;
        this.description = description;
        this.duration = duration;
        this.intensity = intensity;
        this.color = color;
    }

    public StudyMethodType getId() {
        return id;
    }

    public String getIcon() {
        return icon;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getDuration() {
        return duration;
    }

    public String getIntensity() {
        return intensity;
    }

    public String getColor() {
        return color;
    }
}
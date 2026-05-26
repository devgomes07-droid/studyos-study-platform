package com.studyos.studyos_api.dto;

import lombok.Data;

@Data
public class SessionRequest {
    private Long subjectId;
    private String notes;
}

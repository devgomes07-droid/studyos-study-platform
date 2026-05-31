package com.studyos.studyos_api.dto;

import lombok.Data;

@Data
public class FlashcardRequest {
    private Long subjectId;
    private String question;
    private String answer;
}
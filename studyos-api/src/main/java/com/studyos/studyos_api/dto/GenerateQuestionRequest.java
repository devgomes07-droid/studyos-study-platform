package com.studyos.studyos_api.dto;

import lombok.Data;

@Data
public class GenerateQuestionRequest {
    private String answer;
    private Long subjectId; // opcional, ajuda a IA a dar contexto melhor
}

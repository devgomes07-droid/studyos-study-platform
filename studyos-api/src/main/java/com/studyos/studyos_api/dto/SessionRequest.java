package com.studyos.studyos_api.dto;

import com.studyos.studyos_api.enums.StudyMethodType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SessionRequest {

    @NotNull(message = "Materia é obrigatoria.")
    private Long subjectId;

    private StudyMethodType studyMethod;

    @Size(max = 3000, message = "Notas devem ter no maximo 3000 caracteres.")
    private String notes;
}
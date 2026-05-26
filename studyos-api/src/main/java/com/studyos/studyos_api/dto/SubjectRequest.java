package com.studyos.studyos_api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubjectRequest {

    @NotBlank(message = "Nome da materia e obrigatorio.")
    @Size(min = 2, max = 60, message = "Nome da materia deve ter entre 2 e 60 caracteres.")
    @Pattern(
            regexp = "^[A-Za-zÀ-ÿ0-9\\s\\-]+$",
            message = "Nome da materia deve conter apenas letras, numeros, espacos ou hifen."
    )
    private String name;

    @Size(max = 180, message = "Descricao deve ter no maximo 180 caracteres.")
    private String description;

    @NotBlank(message = "Cor e obrigatoria.")
    @Pattern(
            regexp = "^#[0-9A-Fa-f]{6}$",
            message = "Cor deve estar no formato hexadecimal. Exemplo: #4f46e5."
    )
    private String color;

    @Size(max = 8, message = "Icone deve ser curto.")
    private String icon;

    @Min(value = 1, message = "Meta semanal deve ser de pelo menos 1 hora.")
    @Max(value = 80, message = "Meta semanal nao pode passar de 80 horas.")
    private Integer weeklyGoalHours;
}
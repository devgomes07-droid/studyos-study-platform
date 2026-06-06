package com.studyos.studyos_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Token é obrigatório.")
    private String token;

    @NotBlank(message = "Senha é obrigatória.")
    @Size(min = 8, max = 72, message = "Senha deve ter entre 8 e 72 caracteres.")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
            message = "Senha deve conter letras e números."
    )
    private String newPassword;
}

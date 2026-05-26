package com.studyos.studyos_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Nome e obrigatorio.")
    @Size(min = 2, max = 60, message = "Nome deve ter entre 2 e 60 caracteres.")
    @Pattern(
            regexp = "^[A-Za-zÀ-ÿ\\s]+$",
            message = "Nome deve conter apenas letras e espacos."
    )
    private String name;

    @NotBlank(message = "Email e obrigatorio.")
    @Email(message = "Email invalido.")
    @Size(max = 120, message = "Email deve ter no maximo 120 caracteres.")
    private String email;

    @NotBlank(message = "Senha e obrigatoria.")
    @Size(min = 8, max = 72, message = "Senha deve ter entre 8 e 72 caracteres.")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
            message = "Senha deve conter letras e numeros."
    )
    private String password;
}
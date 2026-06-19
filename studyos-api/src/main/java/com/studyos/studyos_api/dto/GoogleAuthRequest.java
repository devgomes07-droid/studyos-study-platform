package com.studyos.studyos_api.dto;

import lombok.Data;

@Data
public class GoogleAuthRequest {
    private String credential;
    private String mode; // "login" ou "register"
    private String name; // só no cadastro, quando pede o nome
}
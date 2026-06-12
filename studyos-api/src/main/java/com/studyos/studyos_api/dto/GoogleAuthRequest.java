package com.studyos.studyos_api.dto;

import lombok.Data;

@Data
public class GoogleAuthRequest {
    private String credential; // token JWT que o Google envia ao frontend
}
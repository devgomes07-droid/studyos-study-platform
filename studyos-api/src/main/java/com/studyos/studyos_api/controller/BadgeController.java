package com.studyos.studyos_api.controller;

import com.studyos.studyos_api.entity.User;
import com.studyos.studyos_api.entity.UserBadge;
import com.studyos.studyos_api.repository.UserRepository;
import com.studyos.studyos_api.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMyBadges() {
        User user = getCurrentUser();

        List<Map<String, Object>> badges = badgeService.getUnlocked(user.getId())
                .stream()
                .map(b -> Map.<String, Object>of(
                        "badgeId",     b.getBadgeId(),
                        "unlockedAt",  b.getUnlockedAt().toString()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(badges);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("Usuario nao encontrado"));
    }
}
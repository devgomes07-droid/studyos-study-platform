package com.studyos.studyos_api.repository;

import com.studyos.studyos_api.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    List<UserBadge> findByUserId(Long userId);

    Optional<UserBadge> findByUserIdAndBadgeId(Long userId, String badgeId);

    boolean existsByUserIdAndBadgeId(Long userId, String badgeId);
}
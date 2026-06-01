package com.studyos.studyos_api.service;

import com.studyos.studyos_api.entity.User;
import com.studyos.studyos_api.entity.UserBadge;
import com.studyos.studyos_api.repository.StudySessionRepository;
import com.studyos.studyos_api.repository.UserBadgeRepository;
import com.studyos.studyos_api.repository.FlashcardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BadgeService {

    private final UserBadgeRepository badgeRepository;
    private final StudySessionRepository sessionRepository;
    private final FlashcardRepository flashcardRepository;

    public List<String> checkAndUnlock(User user) {

        long sessions     = sessionRepository.countByUserIdAndCompletedTrue(user.getId());
        long flashcards   = flashcardRepository.countByUserIdAndActiveTrue(user.getId());
        int  totalMinutes = sessionRepository.sumDurationByUserId(user.getId());
        int  streak       = user.getCurrentStreak();
        int  level        = user.getLevel();

        List<String> newlyUnlocked = new ArrayList<>();

        check(user, "first_session",   sessions >= 1,        newlyUnlocked);
        check(user, "10_sessions",     sessions >= 10,       newlyUnlocked);
        check(user, "50_sessions",     sessions >= 50,       newlyUnlocked);
        check(user, "streak_3",        streak  >= 3,         newlyUnlocked);
        check(user, "streak_7",        streak  >= 7,         newlyUnlocked);
        check(user, "streak_30",       streak  >= 30,        newlyUnlocked);
        check(user, "10h_studied",     totalMinutes >= 600,  newlyUnlocked);
        check(user, "50h_studied",     totalMinutes >= 3000, newlyUnlocked);
        check(user, "first_flashcard", flashcards >= 1,      newlyUnlocked);
        check(user, "20_flashcards",   flashcards >= 20,     newlyUnlocked);
        check(user, "level_3",         level >= 3,           newlyUnlocked);
        check(user, "level_5",         level >= 5,           newlyUnlocked);

        return newlyUnlocked;
    }

    public List<UserBadge> getUnlocked(Long userId) {
        return badgeRepository.findByUserId(userId);
    }

    private void check(User user, String badgeId, boolean condition, List<String> newlyUnlocked) {
        if (!condition) return;
        if (badgeRepository.existsByUserIdAndBadgeId(user.getId(), badgeId)) return;

        UserBadge badge = UserBadge.builder()
                .user(user)
                .badgeId(badgeId)
                .unlockedAt(LocalDateTime.now())
                .build();

        badgeRepository.save(badge);
        newlyUnlocked.add(badgeId);
    }
}
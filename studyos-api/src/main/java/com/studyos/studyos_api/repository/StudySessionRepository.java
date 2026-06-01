package com.studyos.studyos_api.repository;

import com.studyos.studyos_api.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    List<StudySession> findByUserIdOrderByStartedAtDesc(Long userId);

    @Query("SELECT SUM(s.durationMinutes) FROM StudySession s WHERE s.user.id = :userId AND s.startedAt >= :from AND s.completed = true")
    Integer sumMinutesFrom(Long userId, LocalDateTime from);

    @Query("SELECT COUNT(s) FROM StudySession s WHERE s.user.id = :userId AND s.completed = true")
    long countByUserIdAndCompletedTrue(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(s.durationMinutes), 0) FROM StudySession s WHERE s.user.id = :userId AND s.completed = true")
    int sumDurationByUserId(@Param("userId") Long userId);

}


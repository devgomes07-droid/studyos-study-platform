package com.studyos.studyos_api.repository;

import com.studyos.studyos_api.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    List<StudySession> findByUserIdOrderByStartedAtDesc(Long userId);

    @Query("SELECT SUM(s.durationMinutes) FROM StudySession s WHERE s.user.id = :userId AND s.startedAt >= :from AND s.completed = true")
    Integer sumMinutesFrom(Long userId, LocalDateTime from);
}

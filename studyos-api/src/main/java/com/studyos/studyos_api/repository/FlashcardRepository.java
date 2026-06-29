package com.studyos.studyos_api.repository;

import com.studyos.studyos_api.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

    List<Flashcard> findByUserIdAndActiveTrue(Long userId);

    List<Flashcard> findByUserIdAndSubjectIdAndActiveTrue(Long userId, Long subjectId);

    // usado em review()/update()/delete() para garantir que o card pertence ao usuário logado
    Optional<Flashcard> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT f FROM Flashcard f WHERE f.user.id = :userId AND f.active = true AND (f.nextReviewAt IS NULL OR f.nextReviewAt <= :now)")
    List<Flashcard> findDueForReview(Long userId, LocalDateTime now);

    long countByUserIdAndActiveTrue(Long userId);
}
package com.studyos.studyos_api.repository;

import com.studyos.studyos_api.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByUserIdAndActiveTrue(Long userId);

    // usado em FlashcardService para garantir que a matéria pertence ao usuário logado
    // antes de vinculá-la a um flashcard (create/update) ou usá-la como contexto da IA
    Optional<Subject> findByIdAndUserId(Long id, Long userId);
}
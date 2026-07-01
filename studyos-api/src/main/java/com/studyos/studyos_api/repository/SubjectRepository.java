package com.studyos.studyos_api.repository;

import com.studyos.studyos_api.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Long> {

    List<Subject> findByUserIdAndActiveTrue(Long userId);

    Optional<Subject> findById(Long id);

    // necessário para o FlashcardService validar que a matéria pertence ao usuário logado
    Optional<Subject> findByIdAndUserId(Long id, Long userId);

    long countByUserIdAndActiveTrue(Long userId);
}
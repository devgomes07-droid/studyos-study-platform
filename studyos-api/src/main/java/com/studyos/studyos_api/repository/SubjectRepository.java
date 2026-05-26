package com.studyos.studyos_api.repository;

import com.studyos.studyos_api.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByUserIdAndActiveTrue(Long userId);
}
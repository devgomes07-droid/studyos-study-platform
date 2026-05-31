package com.studyos.studyos_api.service;

import com.studyos.studyos_api.dto.FlashcardRequest;
import com.studyos.studyos_api.dto.FlashcardResponse;
import com.studyos.studyos_api.entity.Flashcard;
import com.studyos.studyos_api.entity.Subject;
import com.studyos.studyos_api.entity.User;
import com.studyos.studyos_api.repository.FlashcardRepository;
import com.studyos.studyos_api.repository.SubjectRepository;
import com.studyos.studyos_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public List<FlashcardResponse> listAll(Long subjectId) {
        User user = getCurrentUser();
        List<Flashcard> cards = subjectId != null
                ? flashcardRepository.findByUserIdAndSubjectIdAndActiveTrue(user.getId(), subjectId)
                : flashcardRepository.findByUserIdAndActiveTrue(user.getId());
        return cards.stream().map(this::toResponse).toList();
    }

    public List<FlashcardResponse> listDue() {
        User user = getCurrentUser();
        return flashcardRepository.findDueForReview(user.getId(), LocalDateTime.now())
                .stream().map(this::toResponse).toList();
    }

    public FlashcardResponse create(FlashcardRequest request) {
        User user = getCurrentUser();
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Materia nao encontrada"));

        Flashcard card = Flashcard.builder()
                .user(user)
                .subject(subject)
                .question(request.getQuestion())
                .answer(request.getAnswer())
                .nextReviewAt(LocalDateTime.now())
                .build();

        return toResponse(flashcardRepository.save(card));
    }

    public FlashcardResponse review(Long id, int quality) {
        Flashcard card = flashcardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard nao encontrado"));
        card.review(quality);
        return toResponse(flashcardRepository.save(card));
    }

    public void delete(Long id) {
        Flashcard card = flashcardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard nao encontrado"));
        card.setActive(false);
        flashcardRepository.save(card);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario nao encontrado"));
    }

    private FlashcardResponse toResponse(Flashcard f) {
        Subject s = subjectRepository.findById(f.getSubject().getId())
                .orElseThrow(() -> new RuntimeException("Materia nao encontrada"));
        return FlashcardResponse.builder()
                .id(f.getId())
                .subjectId(s.getId())
                .subjectName(s.getName())
                .subjectColor(s.getColor())
                .subjectIcon(s.getIcon())
                .question(f.getQuestion())
                .answer(f.getAnswer())
                .intervalDays(f.getIntervalDays())
                .repetitions(f.getRepetitions())
                .easeFactor(f.getEaseFactor())
                .nextReviewAt(f.getNextReviewAt())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
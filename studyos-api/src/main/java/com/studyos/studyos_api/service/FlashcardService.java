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
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final GeminiAIService geminiAIService;

    @Transactional(readOnly = true)
    public List<FlashcardResponse> listAll(Long subjectId) {
        User user = getCurrentUser();
        List<Flashcard> cards = subjectId != null
                ? flashcardRepository.findByUserIdAndSubjectIdAndActiveTrue(user.getId(), subjectId)
                : flashcardRepository.findByUserIdAndActiveTrue(user.getId());
        return cards.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<FlashcardResponse> listDue() {
        User user = getCurrentUser();
        return flashcardRepository.findDueForReview(user.getId(), LocalDateTime.now())
                .stream().map(this::toResponse).toList();
    }

    public FlashcardResponse create(FlashcardRequest request) {
        User user = getCurrentUser();
        Subject subject = findOwnedSubjectOrThrow(request.getSubjectId(), user.getId());

        Flashcard card = Flashcard.builder()
                .user(user)
                .subject(subject)
                .question(request.getQuestion())
                .answer(request.getAnswer())
                .nextReviewAt(LocalDateTime.now())
                .build();

        return toResponse(flashcardRepository.save(card));
    }

    public FlashcardResponse update(Long id, FlashcardRequest request) {
        User user = getCurrentUser();
        Flashcard card = findOwnedCardOrThrow(id, user.getId());

        if (request.getSubjectId() != null) {
            Subject subject = findOwnedSubjectOrThrow(request.getSubjectId(), user.getId());
            card.setSubject(subject);
        }
        if (request.getQuestion() != null && !request.getQuestion().isBlank()) {
            card.setQuestion(request.getQuestion());
        }
        if (request.getAnswer() != null && !request.getAnswer().isBlank()) {
            card.setAnswer(request.getAnswer());
        }

        return toResponse(flashcardRepository.save(card));
    }

    public FlashcardResponse review(Long id, int quality) {
        User user = getCurrentUser();
        Flashcard card = findOwnedCardOrThrow(id, user.getId());
        card.review(quality);
        return toResponse(flashcardRepository.save(card));
    }

    public void delete(Long id) {
        User user = getCurrentUser();
        Flashcard card = findOwnedCardOrThrow(id, user.getId());
        card.setActive(false);
        flashcardRepository.save(card);
    }

    public String generateQuestion(String answer, Long subjectId) {
        if (answer == null || answer.isBlank()) {
            throw new IllegalArgumentException("Informe a resposta antes de gerar a pergunta.");
        }
        String subjectName = null;
        if (subjectId != null) {
            User user = getCurrentUser();
            subjectName = subjectRepository.findByIdAndUserId(subjectId, user.getId())
                    .map(Subject::getName)
                    .orElse(null);
        }
        return geminiAIService.generateQuestion(answer, subjectName);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario nao encontrado"));
    }

    private Flashcard findOwnedCardOrThrow(Long cardId, Long userId) {
        return flashcardRepository.findByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new RuntimeException("Flashcard nao encontrado"));
    }

    private Subject findOwnedSubjectOrThrow(Long subjectId, Long userId) {
        return subjectRepository.findByIdAndUserId(subjectId, userId)
                .orElseThrow(() -> new RuntimeException("Materia nao encontrada"));
    }

    private FlashcardResponse toResponse(Flashcard f) {
        Subject s = f.getSubject();
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
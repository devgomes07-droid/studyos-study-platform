package com.studyos.studyos_api.service;

import com.studyos.studyos_api.dto.StudyMethodResponse;
import com.studyos.studyos_api.enums.StudyMethodType;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudyMethodService {

    public List<StudyMethodResponse> findAll() {
        return List.of(
                method(
                        StudyMethodType.POMODORO,
                        "POM",
                        "Pomodoro",
                        "Ciclos de foco e pausa para estudar com ritmo e evitar desgaste.",
                        "25/5",
                        "Foco guiado",
                        "#ef4444"
                ),
                method(
                        StudyMethodType.FLOW_STATE,
                        "FLOW",
                        "Flow State",
                        "Sessao livre, sem cronometro pressionando. Ideal para foco profundo.",
                        "Livre",
                        "Imersivo",
                        "#0f766e"
                ),
                method(
                        StudyMethodType.FIFTY_TWO_SEVENTEEN,
                        "52",
                        "52/17",
                        "52 minutos de foco e 17 minutos de pausa para blocos mais longos.",
                        "52/17",
                        "Foco longo",
                        "#2563eb"
                ),
                method(
                        StudyMethodType.TIMEBOXING,
                        "BOX",
                        "Timeboxing",
                        "Defina um bloco fechado de tempo para uma tarefa especifica.",
                        "Personalizado",
                        "Planejado",
                        "#7c3aed"
                ),
                method(
                        StudyMethodType.FEYNMAN,
                        "FEY",
                        "Feynman",
                        "Estude e explique com suas palavras para encontrar falhas no entendimento.",
                        "Livre",
                        "Explicacao",
                        "#d97706"
                ),
                method(
                        StudyMethodType.ACTIVE_RECALL,
                        "AR",
                        "Active Recall",
                        "Tente lembrar antes de consultar o material. Excelente para memoria.",
                        "Livre",
                        "Memoria ativa",
                        "#16a34a"
                ),
                method(
                        StudyMethodType.FLASHCARDS,
                        "CARD",
                        "Flashcards",
                        "Revise perguntas e respostas com repeticao espacada.",
                        "Revisao",
                        "SM-2",
                        "#db2777"
                ),
                method(
                        StudyMethodType.SPACED_REPETITION,
                        "SR",
                        "Repeticao Espacada",
                        "Revise no momento certo para fortalecer memoria de longo prazo.",
                        "Agenda",
                        "Retencao",
                        "#9333ea"
                ),
                method(
                        StudyMethodType.GUIDED_READING,
                        "READ",
                        "Leitura Guiada",
                        "Estude PDFs, textos e materiais com anotacoes e destaques.",
                        "Livre",
                        "Leitura",
                        "#0891b2"
                ),
                method(
                        StudyMethodType.QUESTIONS,
                        "QST",
                        "Questoes",
                        "Treine com perguntas, simulados e exercicios da materia.",
                        "Variavel",
                        "Pratica",
                        "#ea580c"
                ),
                method(
                        StudyMethodType.CORNELL_NOTES,
                        "COR",
                        "Metodo Cornell",
                        "Organize anotacoes em ideias principais, detalhes e resumo final.",
                        "Livre",
                        "Anotacao",
                        "#475569"
                ),
                method(
                        StudyMethodType.FREE_REVIEW,
                        "REV",
                        "Revisao Livre",
                        "Sessao curta para revisar conceitos, resumos ou anotacoes antigas.",
                        "Curta",
                        "Revisao",
                        "#65a30d"
                )
        );
    }

    private StudyMethodResponse method(
            StudyMethodType id,
            String icon,
            String name,
            String description,
            String duration,
            String intensity,
            String color
    ) {
        return new StudyMethodResponse(
                id,
                icon,
                name,
                description,
                duration,
                intensity,
                color
        );
    }
}
import { ref } from 'vue';
import Groq from 'groq-sdk';
import MarkdownIt from 'markdown-it';
import { db, auth } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function useAiAssistant(isPremium, apiKey) {
    const groq = new Groq({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });
    const md = new MarkdownIt();

    const generatedContent = ref('');
    const quizData = ref(null);
    const flashcardData = ref(null);
    const planningData = ref(null);
    const isLoading = ref(false);

    const generateAiResponse = async (mode, input, hasAccess, options = {}) => {
        if (!input) return;
        if (!hasAccess) {
            alert("Cette fonctionnalité est réservée aux membres Premium !");
            return;
        }

        isLoading.value = true;
        generatedContent.value = '';
        quizData.value = null;
        flashcardData.value = null;
        planningData.value = null;

        try {
            let systemPrompt = "";
            let userPrompt = "";

            switch (mode) {
                case 'summary':
                    systemPrompt = "Tu es un expert pédagogique. Fais un résumé structuré (Markdown) du cours fourni.";
                    userPrompt = `Résumé ce cours :\n\n${input}`;
                    break;
                case 'sheet':
                    systemPrompt = "Tu es un professeur. Crée une fiche de révision claire (Markdown) avec Définitions, Formules/Dates clés, et Concepts principaux.";
                    userPrompt = `Fais une fiche de révision pour :\n\n${input}`;
                    break;
                case 'quiz':
                    const qCount = options.questionCount || 10;
                    systemPrompt = `Tu es un générateur de quiz. Tu DOIS répondre UNIQUEMENT avec un objet JSON valide.
                    Structure : { "questions": [ { "text": "...", "options": ["..."], "correctIndex": 0, "explanation": "..." } ] }
                    Génère exactement ${qCount} questions.`;
                    userPrompt = `Génère un quiz de ${qCount} questions sur :\n\n${input}`;
                    break;
                case 'flashcard':
                    systemPrompt = `Tu es un créateur de cartes mémoire (Flashcards). Tu DOIS répondre UNIQUEMENT avec un objet JSON valide.
                     Structure : { "cards": [ { "front": "Question/Terme", "back": "Réponse/Définition" } ] }
                     Crée 10 cartes pertinentes pour l'apprentissage par cœur.`;
                    userPrompt = `Crée des flashcards sur ce sujet :\n\n${input}`;
                    break;
                case 'explain':
                    systemPrompt = "Tu es un vulgarisateur de génie (type ELI5). Explique le concept de manière extrêmement simple, avec des analogies concrètes, pour un élève qui a du mal à comprendre.";
                    userPrompt = `Explique-moi simplement :\n\n${input}`;
                    break;
                case 'improve':
                    systemPrompt = "Tu es un expert en littérature et rédaction. Corrige les fautes, améliore le style, rend le texte plus fluide et soutenu, tout en gardant le sens original. Affiche d'abord le texte corrigé, puis une liste des améliorations majeures.";
                    userPrompt = `Améliore ce texte :\n\n${input}`;
                    break;
                case 'qa':
                    systemPrompt = "Tu es un tuteur personnel bienveillant et pédagogue. Réponds à la question de l'étudiant avec précision, en donnant des exemples si nécessaire.";
                    userPrompt = `Question :\n\n${input}`;
                    break;
                case 'planning':
                    systemPrompt = `Tu es un coach. Réponds UNIQUEMENT avec un JSON valide.
                    Structure : { "schedule": [ { "day": "...", "tasks": ["..."], "focus": "..." } ], "advice": "..." }`;
                    userPrompt = `Crée un planning pour :\n\n${input}`;
                    break;
            }

            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.5,
                response_format: (mode === 'quiz' || mode === 'planning' || mode === 'flashcard') ? { type: "json_object" } : undefined
            });

            const result = completion.choices[0]?.message?.content;

            if (mode === 'quiz') {
                const parsed = JSON.parse(result);
                quizData.value = parsed.questions;
            } else if (mode === 'flashcard') {
                flashcardData.value = JSON.parse(result).cards;
            } else if (mode === 'planning') {
                planningData.value = JSON.parse(result);
            } else {
                generatedContent.value = md.render(result || "Erreur de génération.");
            }

            // Persistence
            if (auth.currentUser && result) {
                try {
                    await addDoc(collection(db, 'users', auth.currentUser.uid, 'ai_history'), {
                        mode: mode,
                        input: input,
                        result: result, // Save raw result for reconstruction
                        type: (mode === 'quiz' || mode === 'planning' || mode === 'flashcard') ? 'json' : 'text',
                        createdAt: serverTimestamp()
                    });
                } catch (e) {
                    console.error("Failed to save history:", e);
                }
            }

        } catch (error) {
            console.error("Groq Error:", error);
            generatedContent.value = "Une erreur est survenue lors de la génération.";
        } finally {
            isLoading.value = false;
        }

        // SAVE TO HISTORY
        if (auth.currentUser) {
            try {
                const historyData = {
                    mode: mode,
                    input: input,
                    // Use the raw result from generation here, but since it's local scope we need to capture it.
                    // Actually, let's capture it in the try block or reconstruct it.
                    // Better approach: Since 'result' was local in try block, we can't access it here.
                    // I will move this logic INTO the try block success path.
                };
            } catch (e) { console.error("Save error", e); }
        }
    };

    return {
        generatedContent,
        quizData,
        flashcardData,
        planningData,
        isLoading,
        generateAiResponse
    };
}

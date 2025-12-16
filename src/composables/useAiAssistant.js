import { ref } from 'vue';
import Groq from 'groq-sdk';
import MarkdownIt from 'markdown-it';
import { db, auth } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

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

    const FREE_MODES = ['summary', 'explain', 'qa'];
    const FREE_DAILY_LIMIT = 3;

    const checkLimit = async () => {
        if (!auth.currentUser) return false;

        // 1. Check Mode Access
        // Handled in UI, but good to have double check or just rely on limit

        // 2. Check Daily Limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, 'users', auth.currentUser.uid, 'ai_history'),
            where('createdAt', '>=', today)
        );
        const snap = await getDocs(q);
        return snap.size < FREE_DAILY_LIMIT;
    };

    const generateAiResponse = async (mode, input, hasAccess, options = {}) => {
        if (!input) return;

        // FREEMIUM LOGIC
        if (!hasAccess) {
            // Check allowed modes
            if (!FREE_MODES.includes(mode)) {
                alert("🔒 Mode réservé aux membres Premium !");
                return;
            }
            // Check usage limit
            const canProceed = await checkLimit();
            if (!canProceed) {
                alert(`🚫 Limite quotidienne atteinte (${FREE_DAILY_LIMIT}/jour). Passez Premium pour l'illimité !`);
                return;
            }
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
                    systemPrompt = "Tu es un expert pédagogique d'excellence. Ta mission est de synthétiser ce cours pour un étudiant. Génère un résumé structuré en Markdown comprenant :\n" +
                        "1. 🎯 Objectifs du cours\n" +
                        "2. 🔑 Concepts clés (liste à puces détaillée)\n" +
                        "3. ⚠️ Points de vigilance (pièges à éviter aux examens)\n" +
                        "4. 📝 Résumé détaillé par grande partie du cours.\n" +
                        "Sois clair, concis, utilise du gras pour les mots importants.";
                    userPrompt = `Génère le résumé structuré pour ce cours :\n\n${input}`;
                    break;
                case 'sheet':
                    systemPrompt = "Tu es un professeur spécialisé dans la préparation aux examens. Crée une 'Fiche de Révision Ultime' en Markdown. Structure obligatoire :\n" +
                        "- 📌 Définitions incontournables (courtes)\n" +
                        "- ⚡ Formules / Dates / Théorèmes essentiels\n" +
                        "- 🧠 Carte mentale textuelle (hiérarchie des idées)\n" +
                        "- 🚫 Erreurs à ne pas faire le jour J\n" +
                        "Rends le contenu visuel (emojis, gras, tirets) et optimisé pour la mémorisation.";
                    userPrompt = `Fais une fiche de révision optimisée pour :\n\n${input}`;
                    break;
                case 'quiz':
                    const qCount = options.questionCount || 10;
                    systemPrompt = `Tu es un examinateur exigeant. Tu DOIS répondre UNIQUEMENT avec un objet JSON valide.
                    L'objectif est de vérifier la compréhension profonde (pas seulement du par cœur).
                    Structure : { "questions": [ { "text": "Question claire ?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctIndex": 0, "explanation": "Pourquoi c'est la bonne réponse ?" } ] }
                    Génère exactement ${qCount} questions avec 4 choix de réponse par question.`;
                    userPrompt = `Génère un quiz pertinent de ${qCount} questions sur le sujet :\n\n${input}`;
                    break;
                case 'flashcard':
                    systemPrompt = `Tu es un expert en mémorisation (Spaced Repetition). Tu DOIS répondre UNIQUEMENT avec un objet JSON valide.
                     Structure : { "cards": [ { "front": "Concept / Question", "back": "Définition courte / Réponse" } ] }
                     Crée 10 à 15 cartes.
                     Règles :
                     - Le recto doit être une question précise ou un terme.
                     - Le verso doit être court et percutant.`;
                    userPrompt = `Crée des flashcards optimisées pour ce contenu :\n\n${input}`;
                    break;
                case 'explain':
                    systemPrompt = "Tu es le meilleur vulgarisateur du monde (niveau ELI5 + Expert). Ta méthode :\n" +
                        "1. Explique le concept très simplement (comme à un enfant de 10 ans).\n" +
                        "2. Donne une ANALOGIE concrète de la vie de tous les jours (ex: 'C'est comme cuisiner...').\n" +
                        "3. Donne un exemple d'application réelle.\n" +
                        "Ton but est de créer le déclic 'Ah, j'ai compris !'.";
                    userPrompt = `Explique-moi ce concept :\n\n${input}`;
                    break;
                case 'improve':
                    systemPrompt = "Tu es un professeur de littérature et correcteur académique. Ta mission :\n" +
                        "1. Corrige toutes les fautes (orthographe, grammaire, syntaxe).\n" +
                        "2. Améliore le style pour le rendre académique et fluide.\n" +
                        "3. Affiche le texte corrigé complet.\n" +
                        "4. Liste ensuite les 3 principales améliorations apportées.\n" +
                        "Garde le sens original du texte.";
                    userPrompt = `Reformule et améliore ce texte pour un rendu académique :\n\n${input}`;
                    break;
                case 'qa':
                    systemPrompt = "Tu es un tuteur personnel bienveillant, patient et pédagogue. Réponds à la question de l'étudiant avec précision.\n" +
                        "Si la question porte sur un exercice, ne donne pas juste la solution : guide-le vers la réponse.\n" +
                        "Utilise des exemples si cela aide à la compréhension.";
                    userPrompt = `Ma question :\n\n${input}`;
                    break;
                case 'planning':
                    const today = new Date().toLocaleDateString('fr-FR');
                    systemPrompt = `Tu es un coach en gestion du temps pour étudiants.
                     Tes instructions STRICTES :
                    1. Nous sommes le ${today}. Le planning commence AUJOURD'HUI.
                    2. Analyse les dates et contraintes fournies.
                    3. Crée un planning réaliste : pas de journées de 15h de travail. Inclus des pauses.
                    4. DIVISE la matière intelligemment.
                    5. Réponds UNIQUEMENT avec un JSON valide.
                    Structure : { "schedule": [ { "day": "Lundi 12/01", "tasks": ["Chapitre 1", "Exercice 2"], "focus": "Priorité du jour (ex: Compréhension)" } ], "advice": "Conseil méthodologique spécifique pour réussir ce planning." }`;
                    userPrompt = `Voici mes contraintes :\n\n${input}\n\n Crée mon planning de révision optimisé.`;
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

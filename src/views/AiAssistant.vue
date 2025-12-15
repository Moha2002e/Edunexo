<script setup>
import { ref, watch } from 'vue';
import { Sparkles, Copy, Check, BookOpen, Send, FileText, BrainCircuit, HelpCircle, Lock, Calendar, PlayCircle, RefreshCw } from 'lucide-vue-next';
import Groq from 'groq-sdk';
import MarkdownIt from 'markdown-it';
import { usePremium } from '../firebase/usePremium'; // Import the new composable
import { auth } from '../firebase/firebase';

const md = new MarkdownIt();
const { isPremium, isLoading: isPremiumLoading } = usePremium();

const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true
});

// UI State
const selectedMode = ref('summary'); // dropdown value
const inputText = ref('');
const generatedContent = ref(''); // For text/markdown results
const quizData = ref(null); // For JSON quiz results
const planningData = ref(null); // For JSON planning results
const isLoading = ref(false);
const showCopyFeedback = ref(false);
const currentQuizScore = ref(0);
const quizCompleted = ref(false);
const userAnswers = ref({}); // { questionIndex: optionIndex }

// Helper to determine if current user is admin (hardcoded email check for ease, or rely on isPremium)
const isAdmin = () => auth.currentUser?.email === 'admin@edunexo.com'; 

// Computed check for access
const hasAccess = () => isPremium.value || isAdmin();

/**
 * CORE GENERATION LOGIC
 */
const generate = async () => {
    if (!inputText.value) return;
    if (!hasAccess()) {
        alert("Cette fonctionnalité est réservée aux membres Premium !");
        return;
    }

    isLoading.value = true;
    generatedContent.value = '';
    quizData.value = null;
    planningData.value = null;
    quizCompleted.value = false;
    currentQuizScore.value = 0;
    userAnswers.value = {};

    try {
        let systemPrompt = "";
        let userPrompt = "";
        
        switch (selectedMode.value) {
            case 'summary':
                systemPrompt = "Tu es un expert pédagogique. Fais un résumé structuré (Markdown) du cours fourni.";
                userPrompt = `Résumé ce cours :\n\n${inputText.value}`;
                break;
            case 'sheet':
                systemPrompt = "Tu es un professeur. Crée une fiche de révision claire (Markdown) avec Définitions, Formules/Dates clés, et Concepts principaux.";
                userPrompt = `Fais une fiche de révision pour :\n\n${inputText.value}`;
                break;
            case 'quiz':
                // JSON FORCE for Quiz
                systemPrompt = `Tu es un générateur de quiz. Tu DOIS répondre UNIQUEMENT avec un objet JSON valide, sans markdown autour.
                Structure attendue :
                {
                    "questions": [
                        {
                            "text": "Question text",
                            "options": ["Choix A", "Choix B", "Choix C"],
                            "correctIndex": 0,
                            "explanation": "Pourquoi c'est la bonne réponse"
                        }
                    ]
                }
                Génère 10 questions variées.`;
                userPrompt = `Génère un quiz de 10 questions sur ce contenu :\n\n${inputText.value}`;
                break;
            case 'planning':
                // JSON FORCE for Planning
                systemPrompt = `Tu es un coach d'organisation. Tu DOIS répondre UNIQUEMENT avec un objet JSON valide.
                L'utilisateur va te donner ses contraintes (examens, chapitres, dates).
                Génère un planning jour par jour.
                Structure attendue :
                {
                    "schedule": [
                        { "day": "Lundi 12", "tasks": ["Chapitre 1", "Exercice de math"], "focus": "Apprentissage" },
                        ...
                    ],
                    "advice": "Conseil global"
                }`;
                userPrompt = `Crée un planning de révision pour :\n\n${inputText.value}`;
                break;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            response_format: (selectedMode.value === 'quiz' || selectedMode.value === 'planning') ? { type: "json_object" } : undefined
        });

        const result = completion.choices[0]?.message?.content;

        if (selectedMode.value === 'quiz') {
            const parsed = JSON.parse(result);
            quizData.value = parsed.questions; // Expecting { questions: [...] }
        } else if (selectedMode.value === 'planning') {
            planningData.value = JSON.parse(result);
        } else {
            // Text modes
            generatedContent.value = md.render(result || "Erreur de génération.");
        }

    } catch (error) {
        console.error("Groq Error:", error);
        generatedContent.value = "Une erreur est survenue. Vérifiez le format de votre demande.";
    } finally {
        isLoading.value = false;
    }
};

/**
 * QUIZ INTERACTION
 */
const selectAnswer = (qIndex, oIndex) => {
    if (quizCompleted.value) return; // Prevent changing after submit
    userAnswers.value[qIndex] = oIndex;
};

const submitQuiz = () => {
    let score = 0;
    quizData.value.forEach((q, idx) => {
        if (userAnswers.value[idx] === q.correctIndex) {
            score++;
        }
    });
    currentQuizScore.value = score;
    quizCompleted.value = true;
};

const getOptionClass = (qIndex, oIndex) => {
    if (!quizCompleted.value) {
        return userAnswers.value[qIndex] === oIndex ? 'selected' : '';
    }
    // Quiz completed logic
    const q = quizData.value[qIndex];
    if (oIndex === q.correctIndex) return 'correct'; // Always show correct answer in green
    if (userAnswers.value[qIndex] === oIndex && oIndex !== q.correctIndex) return 'wrong'; // Show user error in red
    return 'dimmed';
};

const copyToClipboard = async () => {
    // ... same as before
    try {
        const text = generatedContent.value.replace(/<[^>]*>?/gm, '');
        await navigator.clipboard.writeText(text);
        showCopyFeedback.value = true;
        setTimeout(() => showCopyFeedback.value = false, 2000);
    } catch(e) {}
};
</script>

<template>
  <div class="container">
    <div class="header-section">
      <h1><Sparkles size="28" style="color:#7E22CE; vertical-align: bottom; margin-right: 8px;"/> Assistant Intelligent</h1>
      <p style="color:var(--text-light);">Générateur de Quiz, Fiches et Plannings sur-mesure.</p>
    </div>

    <!-- Premium Gate Banner -->
    <div v-if="!isPremiumLoading && !hasAccess()" class="premium-gate">
        <Lock size="48" class="lock-icon" />
        <h2>Fonctionnalité Premium</h2>
        <p>Débloquez l'IA illimitée, les quiz interactifs et le planning automatique.</p>
        <router-link to="/premium" class="btn-upgrade">Passer Premium</router-link>
    </div>

    <div class="ai-grid" :class="{ 'blurred': !hasAccess() && !isPremiumLoading }">
      <!-- Controls -->
      <div class="card h-fit control-panel">
        
        <label class="section-label">Je veux générer :</label>
        <div class="select-wrapper">
            <select v-model="selectedMode" class="mode-select">
                <option value="summary">📝 Résumé de cours</option>
                <option value="sheet">📄 Fiche de révision</option>
                <option value="quiz">❓ Quiz Interactif (10 Q)</option>
                <option value="planning">📅 Planning de révision</option>
            </select>
        </div>

        <div class="input-area">
            <label v-if="selectedMode === 'planning'">
                Décris tes examens (dates, matières) et tes objectifs :
            </label>
            <label v-else-if="selectedMode === 'quiz'">
                Colle ton chapitre ici pour générer le quiz :
            </label>
            <label v-else>
                Ton contenu de cours à analyser :
            </label>

            <textarea 
                v-model="inputText" 
                :placeholder="selectedMode === 'planning' ? 'Ex: J\'ai un examen de Math le 20 juin, il me reste 5 chapitres. Je peux travailler le soir...' : 'Colle ton texte ici...'" 
                rows="12">
            </textarea>
        </div>

        <button @click="generate" class="full-width" :disabled="isLoading || !inputText">
            <Sparkles size="18" style="margin-right:8px;"/> 
            {{ isLoading ? 'Travail en cours...' : 'Lancer l\'IA' }}
        </button>
      </div>

      <!-- Result Area -->
      <div class="card result-card">
        
        <!-- Loading -->
        <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Intelligence Artificielle au travail...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!generatedContent && !quizData && !planningData" class="placeholder-result">
            <div class="placeholder-icon">
                <BrainCircuit size="48" opacity="0.2" />
            </div>
            <p>Le résultat s'affichera ici.</p>
            <p class="sub">Choisis une option à gauche pour commencer.</p>
        </div>

        <!-- TEXT / MARKDOWN RESULT -->
        <div v-if="generatedContent" class="result-text-wrappeer">
             <div class="result-header">
                <h3>Résultat</h3>
                <button @click="copyToClipboard" class="icon-btn" title="Copier"><Copy size="16"/></button>
            </div>
            <div class="result-content markdown-body" v-html="generatedContent"></div>
        </div>

        <!-- INTERACTIVE QUIZ RESULT -->
        <div v-if="quizData" class="quiz-interface">
            <div class="quiz-header">
                <h3>Quiz de révision</h3>
                <span v-if="quizCompleted" class="score-badge" :class="currentQuizScore > 5 ? 'good' : 'bad'">
                    Note : {{ currentQuizScore }}/{{ quizData.length }}
                </span>
            </div>

            <div v-for="(q, qIdx) in quizData" :key="qIdx" class="quiz-question">
                <p class="q-text"><strong>{{ qIdx + 1 }}.</strong> {{ q.text }}</p>
                <div class="options-grid">
                    <button 
                        v-for="(opt, oIdx) in q.options" 
                        :key="oIdx"
                        class="option-btn"
                        :class="getOptionClass(qIdx, oIdx)"
                        @click="selectAnswer(qIdx, oIdx)"
                    >
                        {{ opt }}
                    </button>
                </div>
                <div v-if="quizCompleted" class="explanation">
                    💡 {{ q.explanation }}
                </div>
            </div>

            <button v-if="!quizCompleted" @click="submitQuiz" class="btn-submit-quiz">Valider mes réponses</button>
            <button v-else @click="generate" class="btn-retry"><RefreshCw size="16"/> Générer un nouveau quiz</button>
        </div>

        <!-- PLANNING RESULT -->
        <div v-if="planningData" class="planning-interface">
            <h3>📅 Ton Planning Suggéré</h3>
            <p class="planning-advice">"{{ planningData.advice }}"</p>
            
            <div class="schedule-list">
                <div v-for="(day, idx) in planningData.schedule" :key="idx" class="schedule-day">
                    <div class="day-header">
                        <span class="day-name">{{ day.day }}</span>
                        <span class="day-focus">{{ day.focus }}</span>
                    </div>
                    <ul class="day-tasks">
                        <li v-for="(t, tIdx) in day.tasks" :key="tIdx">
                            <CheckCircle size="14" class="bullet-icon"/> {{ t }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* PREMIUM GATE */
.premium-gate {
    background: linear-gradient(135deg, #1e1e2e 0%, #312e81 100%);
    color: white;
    padding: 3rem;
    border-radius: 20px;
    text-align: center;
    margin-bottom: 2rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    position: relative;
    z-index: 10;
}
.lock-icon { margin-bottom: 1rem; color: #F59E0B; }
.btn-upgrade {
    display: inline-block;
    background: #F59E0B;
    color: white;
    text-decoration: none;
    font-weight: bold;
    padding: 0.8rem 2rem;
    border-radius: 99px;
    margin-top: 1.5rem;
    transition: transform 0.2s;
}
.btn-upgrade:hover { transform: scale(1.05); }

.blurred {
    filter: blur(8px);
    opacity: 0.6;
    pointer-events: none;
    user-select: none;
}

/* MAIN LAYOUT */
.ai-grid {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 2rem;
    align-items: start;
    transition: filter 0.3s;
}
@media (max-width: 900px) { .ai-grid { grid-template-columns: 1fr; } }

/* CONTROLS */
.section-label {
    display: block;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #4B5563;
}
.select-wrapper {
    position: relative;
    margin-bottom: 1.5rem;
}
.mode-select {
    width: 100%;
    padding: 1rem;
    border-radius: 12px;
    border: 2px solid #E5E7EB;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    background: white;
    appearance: none; /* Custom arrow if needed */
}
.mode-select:focus { border-color: var(--primary); outline: none; }

.input-area label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 0.5rem;
    display: block;
}
textarea {
    width: 100%;
    padding: 1rem;
    border: 2px solid #E9D5FF;
    border-radius: 16px;
    resize: vertical;
    font-family: inherit;
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
    transition: all 0.2s;
    background: #FAFAFA;
}
textarea:focus {
    border-color: #A855F7;
    background: white;
    box-shadow: 0 0 0 4px #F3E8FF;
    outline: none;
}

.full-width {
    background: linear-gradient(135deg, #9333EA, #7E22CE);
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 12px;
    font-weight: 600;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
}
.full-width:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(126, 34, 206, 0.3);
}
.full-width:disabled { opacity: 0.7; cursor: not-allowed; }

/* RESULT CARD */
.result-card {
    min-height: 500px;
    border: 1px solid #E9D5FF;
    box-shadow: 0 10px 40px -10px rgba(91, 33, 182, 0.1); 
    background: white;
    border-radius: 16px;
    padding: 0;
    overflow: hidden;
}
.placeholder-result {
    padding: 4rem;
    text-align: center;
    color: #9CA3AF;
}
.loading-state {
    padding: 4rem;
    text-align: center;
    color: #7E22CE;
}
.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #F3E8FF;
    border-top: 3px solid #9333EA;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1.5rem;
}
@keyframes spin { 0% {transform:rotate(0deg)} 100%{transform:rotate(360deg)} }

/* TEXT CONTENT */
.result-header {
    background: #F9FAFB;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #E5E7EB;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.result-content { padding: 2rem; line-height: 1.7; color: #374151; }

/* QUIZ STYLES */
.quiz-interface { padding: 2rem; }
.quiz-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    border-bottom: 2px solid #F3F4F6;
    padding-bottom: 1rem;
}
.score-badge {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: bold;
    color: white;
}
.score-badge.good { background: #10B981; }
.score-badge.bad { background: #EF4444; }

.quiz-question { margin-bottom: 2.5rem; }
.q-text { font-size: 1.1rem; margin-bottom: 1rem; color: #111827; }
.options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}
@media (max-width: 600px) { .options-grid { grid-template-columns: 1fr; } }

.option-btn {
    padding: 1rem;
    border: 2px solid #E5E7EB;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
    font-size: 0.95rem;
}
.option-btn:hover:not(.correct):not(.wrong) { border-color: #9333EA; background: #FAF5FF; }

.option-btn.selected { border-color: #9333EA; background: #F3E8FF; color: #6B21A8; font-weight: 600; }
.option-btn.correct { border-color: #10B981; background: #D1FAE5; color: #065F46; }
.option-btn.wrong { border-color: #EF4444; background: #FEE2E2; opacity: 0.8; }
.option-btn.dimmed { opacity: 0.5; cursor: default; }

.explanation {
    margin-top: 1rem;
    padding: 1rem;
    background: #FEF3C7;
    border-radius: 8px;
    color: #92400E;
    font-size: 0.9rem;
}

.btn-submit-quiz {
    width: 100%;
    padding: 1rem;
    background: #111827;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
}
.btn-retry { margin-top: 1rem; background: transparent; border: 2px solid #E5E7EB; color: #374151; padding: 0.8rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; }

/* PLANNING STYLES */
.planning-interface { padding: 2rem; }
.planning-advice { 
    font-style: italic; 
    color: #4B5563; 
    background: #F3F4F6; 
    padding: 1rem; 
    border-radius: 8px; 
    margin-bottom: 2rem; 
    border-left: 4px solid #9333EA;
}
.schedule-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.schedule-day {
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    overflow: hidden;
}
.day-header {
    background: #F9FAFB;
    padding: 0.8rem 1.2rem;
    border-bottom: 1px solid #E5E7EB;
    display: flex;
    justify-content: space-between;
    font-weight: bold;
}
.day-focus { color: #9333EA; font-size: 0.9rem; background: #F3E8FF; padding: 2px 8px; border-radius: 100px; }
.day-tasks {
    list-style: none;
    padding: 1rem 1.2rem;
    margin: 0;
}
.day-tasks li { margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px; color: #374151; }
.bullet-icon { color: #10B981; }

/* Markdown Override */
:deep(.markdown-body h1), :deep(.markdown-body h2) { margin-top: 1rem; color: #111827; }
:deep(.markdown-body ul) { padding-left: 1.5rem; }
:deep(.markdown-body strong) { color: #7E22CE; }
</style>

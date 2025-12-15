<script setup>
import { ref, watch } from 'vue';
import { Sparkles, Copy, Check, BookOpen, Send, FileText, BrainCircuit, HelpCircle, Lock, Calendar, PlayCircle, RefreshCw, Repeat } from 'lucide-vue-next';
import { usePremium } from '../firebase/usePremium';
import { useAiAssistant } from '../composables/useAiAssistant';
import { auth } from '../firebase/firebase';

const { isPremium, isLoading: isPremiumLoading } = usePremium();
const { generatedContent, quizData, flashcardData, planningData, isLoading, generateAiResponse } = useAiAssistant(
    isPremium, 
    import.meta.env.VITE_GROQ_API_KEY
);

// UI State (View specific)
const selectedMode = ref('summary'); 
const inputText = ref('');
const questionCount = ref(10); 
const showCopyFeedback = ref(false);
const currentQuizScore = ref(0);
const quizCompleted = ref(false);
const userAnswers = ref({}); 

// Flashcard State
const flippedCards = ref({}); // { index: boolean }

// Computed check for access
const isAdmin = () => auth.currentUser?.email === 'admin@edunexo.com';
const hasAccess = () => isPremium.value || isAdmin();

/**
 * GENERATION HANDLER (Delegates to Composable)
 */
const generate = () => {
    // Reset States
    quizCompleted.value = false;
    currentQuizScore.value = 0;
    userAnswers.value = {};
    flippedCards.value = {};
    
    // Call Logic
    generateAiResponse(
        selectedMode.value, 
        inputText.value, 
        hasAccess(), 
        { questionCount: questionCount.value }
    );
};

/**
 * UI HELPERS
 */
const selectAnswer = (qIndex, oIndex) => {
    if (quizCompleted.value) return; 
    userAnswers.value[qIndex] = oIndex;
};

const submitQuiz = () => {
    if(!quizData.value) return;
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
    const q = quizData.value[qIndex];
    if (oIndex === q.correctIndex) return 'correct'; 
    if (userAnswers.value[qIndex] === oIndex && oIndex !== q.correctIndex) return 'wrong';
    return 'dimmed';
};

const flipCard = (index) => {
    flippedCards.value[index] = !flippedCards.value[index];
};

const copyToClipboard = async () => {
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
      <p style="color:var(--text-light);">Ton tuteur personnel débloqué (Quiz, Fiches, Explications, Flashcards).</p>
    </div>

    <!-- Premium Gate Banner -->
    <div v-if="!isPremiumLoading && !hasAccess()" class="premium-gate">
        <Lock size="48" class="lock-icon" />
        <h2>Fonctionnalité Premium</h2>
        <p>Débloquez l'IA illimitée : Quiz, Flashcards, Correction...</p>
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
                <option value="explain">💡 Explique-moi simplement</option>
                <option value="qa">🙋 Question / Réponse</option>
                <option value="quiz">❓ Quiz Interactif</option>
                <option value="flashcard">🃏 Flashcards (Mémoire)</option>
                <option value="improve">✍️ Améliorer mon texte</option>
                <option value="planning">📅 Planning de révision</option>
            </select>
        </div>

        <div class="input-area">
            <label v-if="selectedMode === 'planning'">Examens et Objectifs :</label>
            <label v-else-if="selectedMode === 'quiz' || selectedMode === 'flashcard'">Contenu source :</label>
            <label v-else-if="selectedMode === 'qa'">Ta question :</label>
            <label v-else-if="selectedMode === 'improve'">Texte à corriger :</label>
            <label v-else>Ton cours :</label>

            <!-- Quiz Options -->
            <div v-if="selectedMode === 'quiz'" class="quiz-options">
                <label>Nombre de questions :</label>
                <div class="input-with-icon">
                    <input type="number" v-model="questionCount" min="1" max="50" class="small-input" />
                </div>
            </div>

            <textarea 
                v-model="inputText" 
                :placeholder="selectedMode === 'qa' ? 'Pose ta question ici...' : (selectedMode === 'improve' ? 'Colle ton brouillon ici...' : 'Colle ton cours ici...')"
                rows="10">
            </textarea>
        </div>

        <button @click="generate" class="full-width" :disabled="isLoading || !inputText">
            <Sparkles size="18" style="margin-right:8px;"/> 
            {{ isLoading ? 'Génération...' : 'Lancer l\'IA' }}
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
        <div v-else-if="!generatedContent && !quizData && !planningData && !flashcardData" class="placeholder-result">
            <div class="placeholder-icon">
                <BrainCircuit size="48" opacity="0.2" />
            </div>
            <p>Le résultat s'affichera ici.</p>
        </div>

        <!-- TEXT RESULT (Summary, Sheet, Explain, QA, Improve) -->
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
                <span v-if="quizCompleted" class="score-badge" :style="{ background: currentQuizScore >= (quizData.length/2) ? '#10B981' : '#EF4444' }">
                    Note : {{ currentQuizScore }}/{{ quizData.length }}
                </span>
            </div>
            <div v-for="(q, qIdx) in quizData" :key="qIdx" class="quiz-question">
                <p class="q-text"><strong>{{ qIdx + 1 }}.</strong> {{ q.text }}</p>
                <div class="options-grid">
                    <button v-for="(opt, oIdx) in q.options" :key="oIdx" class="option-btn" :class="getOptionClass(qIdx, oIdx)" @click="selectAnswer(qIdx, oIdx)">
                        {{ opt }}
                    </button>
                </div>
                <div v-if="quizCompleted" class="explanation">💡 {{ q.explanation }}</div>
            </div>
            <button v-if="!quizCompleted" @click="submitQuiz" class="btn-submit-quiz">Valider mes réponses</button>
            <button v-else @click="generate" class="btn-retry"><RefreshCw size="16"/> Nouveau quiz</button>
        </div>
        
        <!-- FLASHCARDS INTERFACE -->
        <div v-if="flashcardData" class="flashcards-interface">
            <div class="quiz-header"><h3>Cartes Mémoire ({{ flashcardData.length }})</h3></div>
            <div class="cards-grid">
                <div v-for="(card, index) in flashcardData" :key="index" class="flashcard-container" @click="flipCard(index)">
                    <div class="flashcard-inner" :class="{ 'is-flipped': flippedCards[index] }">
                         <div class="flashcard-front">
                            <span class="card-label">Front</span>
                            <p>{{ card.front }}</p>
                            <Repeat size="16" class="flip-icon"/>
                         </div>
                         <div class="flashcard-back">
                            <span class="card-label">Back</span>
                            <p>{{ card.back }}</p>
                         </div>
                    </div>
                </div>
            </div>
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
                        <li v-for="(t, tIdx) in day.tasks" :key="tIdx"><Check size="14" class="bullet-icon"/> {{ t }}</li>
                    </ul>
                </div>
            </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Keeping previous styles + Flashcards */
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

.blurred { filter: blur(8px); opacity: 0.6; pointer-events: none; user-select: none; }
.ai-grid { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; align-items: start; transition: filter 0.3s; }
@media (max-width: 900px) { .ai-grid { grid-template-columns: 1fr; } }
.section-label { display: block; font-weight: 700; margin-bottom: 0.5rem; color: #4B5563; }
.select-wrapper { position: relative; margin-bottom: 1.5rem; }
.mode-select { width: 100%; padding: 1rem; border-radius: 12px; border: 2px solid #E5E7EB; font-size: 1rem; font-weight: 600; color: #374151; cursor: pointer; background: white; appearance: none; }
.mode-select:focus { border-color: var(--primary); outline: none; }
.quiz-options { margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem; }
.quiz-options label { margin-bottom: 0 !important; }
.small-input { width: 80px; padding: 0.5rem; border-radius: 8px; border: 2px solid #E5E7EB; text-align: center; }
.input-area label { font-size: 0.9rem; font-weight: 600; color: var(--text-dark); margin-bottom: 0.5rem; display: block; }
textarea { width: 100%; padding: 1rem; border: 2px solid #E9D5FF; border-radius: 16px; resize: vertical; font-family: inherit; margin-bottom: 1.5rem; font-size: 0.95rem; transition: all 0.2s; background: #FAFAFA; }
textarea:focus { border-color: #A855F7; background: white; box-shadow: 0 0 0 4px #F3E8FF; outline: none; }
.full-width { background: linear-gradient(135deg, #9333EA, #7E22CE); color: white; border: none; padding: 1rem; border-radius: 12px; font-weight: 600; width: 100%; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: all 0.2s; }
.full-width:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(126, 34, 206, 0.3); }
.full-width:disabled { opacity: 0.7; cursor: not-allowed; }
.result-card { min-height: 500px; border: 1px solid #E9D5FF; box-shadow: 0 10px 40px -10px rgba(91, 33, 182, 0.1); background: white; border-radius: 16px; padding: 0; overflow: hidden; }
.placeholder-result { padding: 4rem; text-align: center; color: #9CA3AF; }
.loading-state { padding: 4rem; text-align: center; color: #7E22CE; }
.spinner { width: 40px; height: 40px; border: 3px solid #F3E8FF; border-top: 3px solid #9333EA; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem; }
@keyframes spin { 0% {transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
.result-header { background: #F9FAFB; padding: 1rem 1.5rem; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center; }
.result-content { padding: 2rem; line-height: 1.7; color: #374151; }
.quiz-interface, .planning-interface, .flashcards-interface { padding: 2rem; }
.quiz-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 2px solid #F3F4F6; padding-bottom: 1rem; }
.score-badge { padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; color: white; }
.quiz-question { margin-bottom: 2.5rem; }
.q-text { font-size: 1.1rem; margin-bottom: 1rem; color: #111827; }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 600px) { .options-grid { grid-template-columns: 1fr; } }
.option-btn { padding: 1rem; border: 2px solid #E5E7EB; background: white; border-radius: 8px; cursor: pointer; text-align: left; transition: all 0.2s; font-size: 0.95rem; }
.option-btn:hover:not(.correct):not(.wrong) { border-color: #9333EA; background: #FAF5FF; }
.option-btn.selected { border-color: #9333EA; background: #F3E8FF; color: #6B21A8; font-weight: 600; }
.option-btn.correct { border-color: #10B981; background: #D1FAE5; color: #065F46; }
.option-btn.wrong { border-color: #EF4444; background: #FEE2E2; opacity: 0.8; }
.option-btn.dimmed { opacity: 0.5; cursor: default; }
.explanation { margin-top: 1rem; padding: 1rem; background: #FEF3C7; border-radius: 8px; color: #92400E; font-size: 0.9rem; }
.btn-submit-quiz { width: 100%; padding: 1rem; background: #111827; color: white; border: none; border-radius: 12px; font-size: 1.1rem; font-weight: bold; cursor: pointer; }
.btn-retry { margin-top: 1rem; background: transparent; border: 2px solid #E5E7EB; color: #374151; padding: 0.8rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; }

/* FLASHCARDS */
.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
}
.flashcard-container {
    perspective: 1000px;
    height: 200px;
    cursor: pointer;
}
.flashcard-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.6s;
    transform-style: preserve-3d;
}
.flashcard-inner.is-flipped {
    transform: rotateY(180deg);
}
.flashcard-front, .flashcard-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border: 1px solid #E9D5FF;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
}
.flashcard-front {
    background: white;
    color: var(--text-dark);
}
.flashcard-back {
    background: linear-gradient(135deg, #7E22CE, #9333EA);
    color: white;
    transform: rotateY(180deg);
}
.card-label {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.5;
}
.flip-icon {
    position: absolute;
    bottom: 15px;
    opacity: 0.3;
}

:deep(.markdown-body h1), :deep(.markdown-body h2) { margin-top: 1rem; color: #111827; }
:deep(.markdown-body ul) { padding-left: 1.5rem; }
:deep(.markdown-body strong) { color: #7E22CE; }
</style>

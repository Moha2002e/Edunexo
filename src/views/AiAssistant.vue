<script setup>
import { ref, onMounted } from 'vue';
import { Sparkles, Copy, BookOpen, Send, Download, History, Clock, Trash2, X, RefreshCw, Repeat, Check, Lock, BrainCircuit } from 'lucide-vue-next';
import { usePremium } from '../firebase/usePremium';
import { useAiAssistant } from '../composables/useAiAssistant';
import { auth, db } from '../firebase/firebase';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import MarkdownIt from 'markdown-it';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const { isPremium, isLoading: isPremiumLoading } = usePremium();
const { generatedContent, quizData, flashcardData, planningData, isLoading, generateAiResponse } = useAiAssistant(
    isPremium, 
    import.meta.env.VITE_GROQ_API_KEY
);

const md = new MarkdownIt();

// UI State
const selectedMode = ref('summary'); 
const inputText = ref('');
const questionCount = ref(10); 
const showCopyFeedback = ref(false);
const currentQuizScore = ref(0);
const quizCompleted = ref(false);
const userAnswers = ref({}); 
const flippedCards = ref({});
const history = ref([]);
const showHistory = ref(false);

const isAdmin = () => auth.currentUser?.email === 'admin@edunexo.com' || auth.currentUser?.email === 'mohammedelaouali1@gmail.com';
const hasAccess = () => isPremium.value || isAdmin();

// History Logic
const loadHistory = async () => {
    if (!auth.currentUser) return;
    try {
        const q = query(collection(db, 'users', auth.currentUser.uid, 'ai_history'), orderBy('createdAt', 'desc'), limit(10));
        const snap = await getDocs(q);
        history.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { console.error(e); }
};

const restoreFromHistory = (item) => {
    // Reset all
    generatedContent.value = '';
    quizData.value = null;
    flashcardData.value = null;
    planningData.value = null;
    inputText.value = item.fullInput || item.input;
    selectedMode.value = item.mode;
    showHistory.value = false;

    // Restore based on type
    if (item.type === 'json' || item.mode === 'quiz' || item.mode === 'flashcard') {
        try {
            const parsed = JSON.parse(item.result);
            if (item.mode === 'quiz') quizData.value = parsed.questions || parsed;
            if (item.mode === 'flashcard') flashcardData.value = parsed.cards || parsed;
            if (item.mode === 'planning') planningData.value = parsed;
        } catch(e) { console.error("Restore error", e); }
    } else {
        generatedContent.value = md.render(item.result);
    }
};

const deleteHistoryItem = async (id) => {
    try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'ai_history', id));
        history.value = history.value.filter(h => h.id !== id);
    } catch(e) {}
};

onMounted(() => {
    auth.onAuthStateChanged((user) => {
        if (user) loadHistory();
    });
});

const generate = async () => {
    quizCompleted.value = false;
    currentQuizScore.value = 0;
    userAnswers.value = {};
    flippedCards.value = {};
    
    await generateAiResponse(
        selectedMode.value, 
        inputText.value, 
        hasAccess(), 
        { questionCount: questionCount.value }
    );
    // Reload history after generation
    loadHistory();
};

const downloadPDF = () => {
    let elementId = 'ai-result-content';
    if (selectedMode.value === 'quiz') elementId = 'quiz-result-container';
    else if (selectedMode.value === 'planning') elementId = 'planning-result-container';
    else if (selectedMode.value === 'flashcard') return; 

    const element = document.getElementById(elementId);
    if (!element) return;
    
    html2pdf().set({
      margin: 0.5,
      filename: `Edunexo_${selectedMode.value}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(element).save();
};

// ... QUIZ & FLASHCARD HELPERS (kept same) ...
const selectAnswer = (qIndex, oIndex) => { if (!quizCompleted.value) userAnswers.value[qIndex] = oIndex; };
const submitQuiz = () => {
    if(!quizData.value) return;
    let score = 0;
    quizData.value.forEach((q, idx) => { if (userAnswers.value[idx] === q.correctIndex) score++; });
    currentQuizScore.value = score;
    quizCompleted.value = true;
};
const getOptionClass = (qIndex, oIndex) => {
    if (!quizCompleted.value) return userAnswers.value[qIndex] === oIndex ? 'selected' : '';
    const q = quizData.value[qIndex];
    if (oIndex === q.correctIndex) return 'correct';
    if (userAnswers.value[qIndex] === oIndex) return 'wrong';
    return 'dimmed';
};
const flipCard = (index) => { flippedCards.value[index] = !flippedCards.value[index]; };
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
  <div class="container relative">
    
    <!-- Header -->
    <div class="header-section">
      <div class="flex-between">
          <div>
            <h1><Sparkles size="28" style="color:#7E22CE; vertical-align: bottom; margin-right: 8px;"/> Assistant Intelligent</h1>
            <p style="color:var(--text-light);">Ton tuteur personnel débloqué.</p>
          </div>
          <button @click="showHistory = !showHistory" class="history-btn">
            <History size="20" /> Historique
          </button>
      </div>
    </div>

    <!-- History Drawer -->
    <div class="history-drawer" :class="{ 'open': showHistory }">
        <div class="drawer-header">
            <h3>🗂️ Mes Archives</h3>
            <button @click="showHistory = false" class="close-btn"><X size="20"/></button>
        </div>
        <div class="history-list">
            <div v-if="history.length === 0" class="empty-hist">Aucun historique</div>
            <div v-for="item in history" :key="item.id" class="history-item" @click="restoreFromHistory(item)">
                <div class="hist-icon">
                    <BrainCircuit v-if="item.mode === 'summary'" size="16"/>
                    <Sparkles v-else size="16"/>
                </div>
                <div class="hist-content">
                    <span class="hist-mode">{{ item.mode }}</span>
                    <span class="hist-preview">{{ item.input.substring(0, 30) }}...</span>
                </div>
                <button @click.stop="deleteHistoryItem(item.id)" class="del-btn"><Trash2 size="14"/></button>
            </div>
        </div>
    </div>

    <!-- Premium Banner (Small) -->
    <div v-if="!isPremiumLoading && !hasAccess()" class="premium-banner-small">
        <span>🚀 <strong>Mode gratuit actif</strong> : 3 essais/jour. Débloquez tout avec Premium.</span>
        <router-link to="/premium" class="btn-xs">Upgrade</router-link>
    </div>

    <div class="ai-grid">
      <!-- Controls -->
      <div class="card h-fit control-panel">
        
        <label class="section-label">Je veux générer :</label>
        <div class="select-wrapper">
            <select v-model="selectedMode" class="mode-select">
                <option value="summary">📝 Résumé de cours (Gratuit)</option>
                <option value="explain">💡 Explique-moi (Gratuit)</option>
                <option value="qa">🙋 Question / Réponse (Gratuit)</option>
                <option disabled>──────────────</option>
                <option value="sheet" :disabled="!hasAccess()">📄 Fiche de révision (Premium 🔒)</option>
                <option value="quiz" :disabled="!hasAccess()">❓ Quiz Interactif (Premium 🔒)</option>
                <option value="flashcard" :disabled="!hasAccess()">🃏 Flashcards (Premium 🔒)</option>
                <option value="improve" :disabled="!hasAccess()">✍️ Correction (Premium 🔒)</option>
                <option value="planning" :disabled="!hasAccess()">📅 Planning (Premium 🔒)</option>
            </select>
        </div>

        <div class="input-area">
            <textarea 
                v-model="inputText" 
                :placeholder="selectedMode === 'qa' ? 'Pose ta question...' : 'Colle ton cours ici...'"
                rows="10">
            </textarea>
             <!-- Quiz Options -->
            <div v-if="selectedMode === 'quiz'" class="quiz-options">
                <label>Nb Questions :</label>
                <input type="number" v-model="questionCount" min="1" max="50" class="small-input" />
            </div>
        </div>

        <button @click="generate" class="full-width" :disabled="isLoading || !inputText">
            <Sparkles size="18" style="margin-right:8px;"/> 
            {{ isLoading ? 'Génération...' : 'Lancer l\'IA' }}
        </button>
      </div>

      <!-- Result Area -->
      <div class="card result-card">
        
        <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div> <p>Analyse en cours...</p>
        </div>

        <div v-else-if="!generatedContent && !quizData && !planningData && !flashcardData" class="placeholder-result">
            <BrainCircuit size="48" opacity="0.2" />
            <p>Le résultat s'affichera ici.</p>
        </div>

        <!-- TEXT RESULT -->
        <div v-if="generatedContent" class="result-text-wrappeer">
             <div class="result-header">
                <h3>Résultat</h3>
                <div class="header-actions">
                    <button @click="downloadPDF" class="icon-btn" title="PDF"><Download size="16"/></button>
                    <button @click="copyToClipboard" class="icon-btn" title="Copier"><Copy size="16"/></button>
                </div>
            </div>
            <div id="ai-result-content" class="result-content markdown-body" v-html="generatedContent"></div>
        </div>

        <!-- QUIZ RESULT -->
        <div v-if="quizData" id="quiz-result-container" class="quiz-interface">
            <div class="quiz-header">
                <h3>Quiz de révision</h3>
                <button @click="downloadPDF" class="icon-btn"><Download size="16"/></button>
            </div>
            <div v-for="(q, qIdx) in quizData" :key="qIdx" class="quiz-question">
                <p class="q-text"><strong>{{ qIdx + 1 }}.</strong> {{ q.text }}</p>
                <div class="options-grid">
                    <button v-for="(opt, oIdx) in q.options" :key="oIdx" class="option-btn" :class="getOptionClass(qIdx, oIdx)" @click="selectAnswer(qIdx, oIdx)">
                        {{ opt }}
                    </button>
                </div>
            </div>
            <button v-if="!quizCompleted" @click="submitQuiz" class="btn-submit-quiz" data-html2canvas-ignore>Valider</button>
            <div v-else class="score-badge main-score">Note: {{currentQuizScore}}/{{quizData.length}}</div>
        </div>
        
        <!-- FLASHCARDS -->
        <div v-if="flashcardData" class="flashcards-interface">
             <h3>Flashcards</h3>
             <div class="cards-grid">
                <div v-for="(card, index) in flashcardData" :key="index" class="flashcard-container" @click="flipCard(index)">
                    <div class="flashcard-inner" :class="{ 'is-flipped': flippedCards[index] }">
                         <div class="flashcard-front"><p>{{ card.front }}</p></div>
                         <div class="flashcard-back"><p>{{ card.back }}</p></div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- PLANNING RESULT -->
        <div v-if="planningData" id="planning-result-container" class="planning-interface">
             <div class="result-header">
                <h3>📅 Planning Généré</h3>
                <button @click="downloadPDF" class="icon-btn" title="Télécharger PDF"><Download size="16"/></button>
            </div>
             
             <div v-if="planningData.advice" class="planning-advice">
                 <strong>💡 Conseil du coach :</strong> {{ planningData.advice }}
             </div>

             <div class="planning-grid">
                <div v-for="(day, idx) in planningData.schedule" :key="idx" class="planning-card">
                    <div class="day-header">{{ day.day }}</div>
                    <div class="day-focus" v-if="day.focus">🎯 Focus: {{ day.focus }}</div>
                    <ul class="task-list">
                        <li v-for="(task, tIdx) in day.tasks" :key="tIdx">
                            <Check size="14" class="check-icon"/> {{ task }}
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
/* Reusing previous styles + New History Drawer */
.container { position: relative; overflow-x: hidden; }
.flex-between { display: flex; justify-content: space-between; align-items: flex-end; }
.history-btn { background: var(--surface); border: 1px solid var(--border-color); color: var(--text-dark); padding: 0.5rem 1rem; border-radius: 99px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; box-shadow: var(--shadow-sm); }
.history-btn:hover { background: var(--bg-color); }

.history-drawer {
    position: fixed;
    top: 0; right: -320px;
    width: 320px;
    height: 100vh;
    background: var(--surface);
    border-left: 1px solid var(--border-color);
    box-shadow: -5px 0 20px rgba(0,0,0,0.1);
    z-index: 200;
    transition: right 0.3s ease;
    display: flex;
    flex-direction: column;
}
.history-drawer.open { right: 0; }
.drawer-header { padding: 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
.history-list { flex: 1; overflow-y: auto; padding: 1rem; }
.history-item { padding: 1rem; border-bottom: 1px solid var(--border-color); cursor: pointer; display: flex; gap: 10px; align-items: start; transition: background 0.2s; border-radius: 8px; }
.history-item:hover { background: var(--bg-color); }
.hist-content { flex: 1; display: flex; flex-direction: column; }
.hist-mode { font-size: 0.8rem; font-weight: 700; color: var(--primary); text-transform: uppercase; }
.hist-preview { font-size: 0.85rem; color: var(--text-light); }
.del-btn { color: #EF4444; background: none; border: none; cursor: pointer; opacity: 0; }
.history-item:hover .del-btn { opacity: 1; }

.premium-gate { background: linear-gradient(135deg, #1e1e2e 0%, #312e81 100%); color: white; padding: 3rem; border-radius: 20px; text-align: center; margin-bottom: 2rem; }
.btn-upgrade { display: inline-block; background: #F59E0B; color: white; padding: 0.8rem 2rem; border-radius: 99px; margin-top: 1.5rem; text-decoration: none; font-weight: bold; }
.blurred { filter: blur(8px); opacity: 0.6; pointer-events: none; }
.ai-grid { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; }
@media (max-width: 900px) { 
    .ai-grid { grid-template-columns: 1fr; } 
    .flex-between { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .history-btn { width: 100%; justify-content: center; }
    .result-content, .quiz-interface, .flashcards-interface { padding: 1rem; }
}
.full-width { background: var(--primary); color: white; border: none; padding: 1rem; border-radius: 12px; font-weight: 600; width: 100%; display: flex; justify-content: center; align-items: center; cursor: pointer; margin-top: 1rem; }
.loading-state, .placeholder-result { padding: 4rem; text-align: center; color: var(--text-light); }
.spinner { width: 40px; height: 40px; border: 3px solid #E2E8F0; border-top: 3px solid var(--primary); border-radius: 50%; animation: spin 1s infinite; margin: 0 auto 1rem; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.result-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; }
.result-content { padding: 2rem; line-height: 1.7; color: var(--text-dark); }
.quiz-interface, .flashcards-interface { padding: 2rem; }
.quiz-question { margin-bottom: 2rem; }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
.option-btn { padding: 1rem; border: 2px solid var(--border-color); background: var(--surface); border-radius: 8px; cursor: pointer; text-align: left; }
.option-btn.selected { border-color: var(--primary); background: #F3E8FF; }
.option-btn.correct { border-color: #10B981; background: #D1FAE5; }
.option-btn.wrong { border-color: #EF4444; background: #FEE2E2; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
.flashcard-container { height: 200px; perspective: 1000px; cursor: pointer; }
.flashcard-inner { position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.6s; transform-style: preserve-3d; }
.flashcard-inner.is-flipped { transform: rotateY(180deg); }
.flashcard-front, .flashcard-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border: 1px solid var(--border-color); border-radius: 16px; display: flex; align-items: center; justify-content: center; padding: 1rem; background: var(--surface); box-shadow: var(--shadow-sm); }
.flashcard-back { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; transform: rotateY(180deg); }
.mode-select, textarea, .small-input { width: 100%; padding: 0.8rem; border-radius: 12px; border: 1px solid var(--border-color); background: var(--surface); color: var(--text-dark); font-family: inherit; }
textarea { background: var(--bg-color); }

/* PLANNING STYLES */
.planning-interface { padding: 2rem; }
.planning-advice { background: #eff6ff; color: #1e40af; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; border-left: 4px solid #3b82f6; }
.planning-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
.planning-card { background: var(--surface); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-sm); }
.day-header { background: var(--bg-color); padding: 0.8rem; font-weight: 700; border-bottom: 1px solid var(--border-color); text-align: center; color: var(--primary); }
.day-focus { font-size: 0.85rem; padding: 0.5rem 1rem; color: #d97706; background: #fffbeb; border-bottom: 1px solid #fef3c7; font-weight: 600; }
.task-list { list-style: none; padding: 1rem; margin: 0; }
.task-list li { display: flex; gap: 8px; align-items: start; margin-bottom: 0.8rem; font-size: 0.95rem; color: var(--text-dark); }
.check-icon { min-width: 14px; margin-top: 3px; color: #10B981; }

.premium-banner-small {
    background: linear-gradient(90deg, #4F46E5, #EC4899);
    color: white;
    padding: 0.8rem 1.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
}
.btn-xs {
    background: white;
    color: var(--primary);
    padding: 0.4rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 700;
    font-size: 0.85rem;
}
</style>

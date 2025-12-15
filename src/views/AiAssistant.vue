<script setup>
import { ref } from 'vue';
import { Sparkles, Copy, Check, BookOpen, Send, FileText, BrainCircuit, HelpCircle } from 'lucide-vue-next';
import Groq from 'groq-sdk';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

// ⚠️ IMPORTANT : En production, ne mettez jamais de clé API côté client (Vue.js).
// Idéalement, passez par votre backend (server.js).
// Pour ce prototype, nous l'utilisons ici avec "dangerouslyAllowBrowser: true".
const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true
});

const inputText = ref('');
const generatedContent = ref('');
const isLoading = ref(false);
const showCopyFeedback = ref(false);
const activeTab = ref('summary'); // Keep activeTab for UI logic

const generateSummary = async () => {
  if (!inputText.value) return;

  isLoading.value = true;
  generatedContent.value = '';

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Tu es un expert pédagogique. Ton but est d'aider les étudiants à réviser. Formate tes réponses en Markdown propre (titres, listes à puces)."
        },
        {
          role: "user",
          content: `Fais-moi un résumé structuré et clair de ce cours, avec les points clés à retenir :\n\n${inputText.value}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 1024,
    });

    const text = chatCompletion.choices[0]?.message?.content || "Aucun contenu généré.";
    generatedContent.value = md.render(text);
  } catch (error) {
    console.error("Erreur Groq:", error);
    generatedContent.value = "Une erreur est survenue lors de la génération. Vérifiez votre clé API.";
  } finally {
    isLoading.value = false;
  }
};

const generateQuiz = async () => {
  if (!inputText.value) return;

  isLoading.value = true;
  generatedContent.value = '';

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Tu es un professeur. Crée un quiz de 5 questions (QCM) basées sur le texte fourni. Indique la bonne réponse à la fin."
        },
        {
          role: "user",
          content: `Génère un quiz pour ce contenu :\n\n${inputText.value}`
        }
      ],
      model: "llama-3.3-70b-versatile",
    });

    const text = chatCompletion.choices[0]?.message?.content || "Aucun contenu généré.";
    generatedContent.value = md.render(text);
  } catch (error) {
    console.error("Erreur Groq:", error);
    generatedContent.value = "Erreur lors de la génération.";
  } finally {
    isLoading.value = false;
  }
};

// Unified generate function to call the specific ones based on activeTab
const generate = async () => {
  if (activeTab.value === 'summary') {
    await generateSummary();
  } else if (activeTab.value === 'quiz') {
    await generateQuiz();
  }
  // Add other tabs if needed
};

// Function to copy content (new functionality)
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(generatedContent.value.replace(/<[^>]*>?/gm, '')); // Remove HTML tags for plain text copy
    showCopyFeedback.value = true;
    setTimeout(() => {
      showCopyFeedback.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
};
</script>

<template>
  <div class="container">
    <div class="header-section">
      <h1><Sparkles size="28" style="color:#7E22CE; vertical-align: bottom; margin-right: 8px;"/> Assistant Intelligent</h1>
      <p style="color:var(--text-light);">Utilise l'IA pour booster tes révisions en quelques secondes.</p>
    </div>

    <div class="ai-grid">
      <!-- Controls -->
      <div class="card h-fit">
        <div class="tabs">
            <button :class="{ active: activeTab === 'summary' }" @click="activeTab = 'summary'">
                <FileText size="18" /> Résumer
            </button>
            <button :class="{ active: activeTab === 'sheet' }" @click="activeTab = 'sheet'">
                <BrainCircuit size="18" /> Fiche
            </button>
            <button :class="{ active: activeTab === 'quiz' }" @click="activeTab = 'quiz'">
                <HelpCircle size="18" /> Quiz
            </button>
        </div>

        <div class="input-area">
            <label>Ton contenu de cours</label>
            <textarea v-model="inputText" placeholder="Colle ton chapitre ici pour que l'IA l'analyse..." rows="12"></textarea>
        </div>

        <button @click="generate" class="full-width" :disabled="isLoading || !inputText">
            <Sparkles size="18" style="margin-right:8px;"/> 
            {{ isLoading ? 'Magie en cours...' : 'Générer avec l\'IA' }}
        </button>
      </div>

      <!-- Result -->
      <div class="card result-card">
        <div class="result-header">
             <h2>Résultat</h2>
             <button v-if="generatedContent" @click="copyToClipboard" class="icon-btn" title="Copier">
                 <Check v-if="showCopyFeedback" size="18" color="green" />
                 <Copy v-else size="18" />
             </button>
        </div>
       
        <div v-if="!generatedContent && !isLoading" class="placeholder-result">
            <div class="placeholder-icon">
                <Sparkles size="48" opacity="0.2" />
            </div>
            <p>Le résultat de l'IA s'affichera ici.</p>
            <p class="sub">Sélectionne une option à gauche et lance la génération.</p>
        </div>
        
        <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Analyse de ton texte...</p>
        </div>
        
        <div v-if="generatedContent" class="result-content markdown-body" v-html="generatedContent"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Modern AI Styles */
.header-section {
  text-align: center;
  margin-bottom: 2.5rem;
}

.header-section h1 {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
  color: #5B21B6; /* Deep Purple */
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-grid {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 2rem;
    align-items: start;
}

@media (max-width: 900px) {
    .ai-grid {
        grid-template-columns: 1fr;
    }
}

.card {
    border: 1px solid var(--border-color);
}

.tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    background: #F3E8FF; /* Light Purple bg */
    padding: 0.5rem;
    border-radius: 14px;
}

.tabs button {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0.8rem;
    border-radius: 10px;
    font-weight: 600;
    color: #7E22CE;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    transition: all 0.2s;
}

.tabs button:hover {
    background: rgba(255,255,255,0.6);
}

.tabs button.active {
    background: white;
    color: #5B21B6;
    box-shadow: 0 2px 8px rgba(91, 33, 182, 0.08);
    font-weight: 700;
}

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
    outline: none;
    border-color: #A855F7;
    background: white;
    box-shadow: 0 0 0 4px #F3E8FF;
}

.result-card {
    min-height: 500px;
    display: flex;
    flex-direction: column;
    border: 1px solid #E9D5FF;
    box-shadow: 0 10px 40px -10px rgba(91, 33, 182, 0.1); 
    background: white;
    padding: 0;
    overflow: hidden;
}

.result-header {
    padding: 1.5rem;
    border-bottom: 1px solid #F3F4F6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #FAFAFA;
}

.result-header h2 {
    font-size: 1.1rem;
    margin: 0;
    color: var(--text-dark);
}

.icon-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    color: var(--text-light);
    transition: all 0.2s;
}
.icon-btn:hover {
    background: #e2e8f0;
    color: var(--text-dark);
}

.placeholder-result {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #94A3B8;
    gap: 0.5rem;
    text-align: center;
    padding: 3rem;
}
.placeholder-icon {
    margin-bottom: 1rem;
    color: #E2E8F0;
}
.placeholder-result p { margin: 0; font-size: 1rem; font-weight: 500;}
.placeholder-result .sub { font-size: 0.85rem; font-weight: 400; opacity: 0.8;}

.result-content {
    background: #FFFFFF;
    padding: 2rem;
    line-height: 1.7;
    color: #334155;
    font-size: 1rem;
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

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #7E22CE;
    font-weight: 500;
}

/* Markdown Override */
:deep(.markdown-body h1), :deep(.markdown-body h2) {
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    color: #1E293B;
    font-weight: 700;
    line-height: 1.3;
}
:deep(.markdown-body ul) {
    padding-left: 1.25rem;
    margin-bottom: 1rem;
}
:deep(.markdown-body li) {
    margin-bottom: 0.5rem;
}
:deep(.markdown-body strong) {
    color: #7E22CE;
    font-weight: 600;
}
:deep(.markdown-body p) {
    margin-bottom: 1rem;
}

.full-width {
    background: linear-gradient(135deg, #9333EA, #7E22CE);
    color: white;
    border: none;
    box-shadow: 0 4px 6px -1px rgba(126, 34, 206, 0.3);
    padding: 1rem;
    border-radius: 12px;
    font-weight: 600;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
}
.full-width:hover:not(:disabled) {
    background: linear-gradient(135deg, #7E22CE, #6B21A8);
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(126, 34, 206, 0.4);
}
.full-width:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
}
</style>

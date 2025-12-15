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
    apiKey: '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',
    dangerouslyAllowBrowser: true
});

const inputText = ref('');
const generatedContent = ref('');
const isLoading = ref(false);
const showCopyFeedback = ref(false);
const activeTab = ref('summary'); // Keep activeTab for UI logic

const generateSummary = async () => {
    // ... (function remains same, implicit via context of replace)
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
    // ...
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
      <h1><Sparkles size="28" style="color:#8e44ad; vertical-align: bottom; margin-right: 8px;"/> Assistant Intelligent</h1>
      <p style="color:var(--text-light);">Utilise l'IA pour booster tes révisions en quelques secondes.</p>
    </div>

    <!-- ... (template same as before, but with v-html for result) ... -->
    <div class="ai-grid">
      <!-- Controls -->
      <div class="card h-fit">
        <div class="tabs">
            <button :class="{ active: activeTab === 'summary' }" @click="activeTab = 'summary'">
                <FileText size="16" /> Résumer
            </button>
            <button :class="{ active: activeTab === 'sheet' }" @click="activeTab = 'sheet'">
                <BrainCircuit size="16" /> Fiche
            </button>
            <button :class="{ active: activeTab === 'quiz' }" @click="activeTab = 'quiz'">
                <HelpCircle size="16" /> Quiz
            </button>
        </div>

        <div class="input-area">
            <label>Ton contenu de cours</label>
            <textarea v-model="inputText" placeholder="Colle ton chapitre ici..." rows="10"></textarea>
        </div>

        <button @click="generate" class="primary full-width" :disabled="isLoading || !inputText">
            <Sparkles size="16" style="margin-right:5px;"/> 
            {{ isLoading ? 'Génération en cours...' : 'Générer avec l\'IA' }}
        </button>
      </div>

      <!-- Result -->
      <div class="card result-card">
        <h2>Résultat</h2>
        <div v-if="!generatedContent && !isLoading" class="placeholder-result">
            Le résultat de l'IA s'affichera ici.
        </div>
        <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            Analyse de ton texte...
        </div>
        <div v-if="generatedContent" class="result-content markdown-body" v-html="generatedContent"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ... previous styles ... */
.ai-grid {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 2rem;
}
@media (max-width: 900px) {
    .ai-grid {
        grid-template-columns: 1fr;
    }
}
.tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    background: #f5f7fa;
    padding: 0.5rem;
    border-radius: 12px;
}
.tabs button {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0.8rem;
    border-radius: 8px;
    font-weight: 600;
    color: var(--text-light);
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
}
.tabs button.active {
    background: white;
    color: #8e44ad;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
textarea {
    width: 100%;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    resize: vertical;
    font-family: inherit;
    margin-bottom: 1rem;
}
.result-card {
    min-height: 400px;
    display: flex;
    flex-direction: column;
}
.placeholder-result {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #bdc3c7;
    font-style: italic;
}
.result-content {
    background: #f9f9f9;
    padding: 1.5rem;
    border-radius: 8px;
    line-height: 1.6;
}
.spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #8e44ad;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
.loading-state {
    text-align: center;
    margin-top: 4rem;
    color: var(--text-light);
}

/* Markdown Styles (Simple subset) */
:deep(.markdown-body h1), :deep(.markdown-body h2) {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: #2c3e50;
}
:deep(.markdown-body ul) {
    padding-left: 1.5rem;
}
:deep(.markdown-body strong) {
    color: #3A7AFE;
}
</style>

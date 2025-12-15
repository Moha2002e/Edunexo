<script setup>
import { ref } from 'vue';
import { Sparkles, FileText, HelpCircle, BrainCircuit } from 'lucide-vue-next';
import { GoogleGenerativeAI } from "@google/generative-ai";
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

// ⚠️ KEY DIRECTLY INTEGRATED
const API_KEY = "AIzaSyBkIT1-te57Q_Qw_lkK2eZKckNyUCXztB4"; 
const genAI = new GoogleGenerativeAI(API_KEY);

// ... (rest of script as before)
const activeTab = ref('summary'); 
const inputText = ref('');
const result = ref('');
const isLoading = ref(false);

const generate = async () => {
  if (!inputText.value) return;
  
  isLoading.value = true;
  result.value = '';

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
    
    let prompt = "";
    if (activeTab.value === 'summary') {
        prompt = `Fais un résumé structuré et clair du texte suivant pour un étudiant. Utilise du Markdown :\n\n${inputText.value}`;
    } else if (activeTab.value === 'sheet') {
        prompt = `Génère une fiche de révision efficace à partir de ce cours. Inclus : Définitions clés, Concepts à retenir, et Exemples. Utilise du Markdown bien formaté (h2, gras, listes) :\n\n${inputText.value}`;
    } else if (activeTab.value === 'quiz') {
        prompt = `Génère un Quiz QCM de 3 questions basées sur ce texte pour tester mes connaissances. Affiche la question, les choix, et la réponse correcte à la fin. Format Markdown :\n\n${inputText.value}`;
    }

    const resultAI = await model.generateContent(prompt);
    const response = await resultAI.response;
    const text = response.text();
    
    result.value = md.render(text); // Render Markdown
  } catch (error) {
      console.error(error);
      result.value = "Une erreur est survenue avec l'IA. Vérifiez votre connexion ou la clé API.";
  } finally {
      isLoading.value = false;
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
        <div v-if="!result && !isLoading" class="placeholder-result">
            Le résultat de l'IA s'affichera ici.
        </div>
        <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            Analyse de ton texte...
        </div>
        <div v-if="result" class="result-content markdown-body" v-html="result"></div>
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

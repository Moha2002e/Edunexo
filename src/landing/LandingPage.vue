<script setup>
import { ArrowRight, BookOpen, Calendar, ShieldCheck } from 'lucide-vue-next';
</script>

<template>
  <div class="landing-page">
    <nav class="lp-nav">
        <div class="logo">✨ Edunexo</div>
        <div class="lp-links">
            <router-link to="/login">Se connecter</router-link>
            <router-link to="/register" class="cta-btn">S'inscrire</router-link>
        </div>
    </nav>

    <header class="hero">
        <div class="hero-content">
            <h1>Organise tes études intelligemment.</h1>
            <p>Cours, plannings automatiques & Assistant IA dans une seule plateforme conçue pour ta réussite.</p>
            <router-link to="/register" class="cta-btn big">
                Commencer gratuitement <ArrowRight size="20" style="margin-left:5px;" />
            </router-link>
            <p class="sub-cta">Pas de carte bancaire requise.</p>
        </div>
        <div class="hero-image">
            <!-- Placeholder for Screenshot -->
            <div class="mockup">
                <div class="screen"></div>
            </div>
        </div>
    </header>

    <section class="features">
        <div class="feature-item">
            <BookOpen size="32" class="feature-icon" />
            <h3>Gestion des Cours</h3>
            <p>Centralise tous tes cours et suis ta progression chapitre par chapitre.</p>
        </div>
        <div class="feature-item">
            <Calendar size="32" class="feature-icon" />
            <h3>Planning Automatique</h3>
            <p>Laisse notre algorithme créer ton programme de révision idéal.</p>
        </div>
        <div class="feature-item">
            <ShieldCheck size="32" class="feature-icon" />
            <h3>Assistant IA</h3>
            <p>Génère des fiches et des quiz instantanément pour tester tes connaissances.</p>
        </div>
    </section>
  </div>
</template>

<style scoped>
.landing-page {
    font-family: 'Inter', sans-serif;
    background: white;
    min-height: 100vh;
}
.lp-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
}
.logo {
    font-size: 1.5rem;
    font-weight: 800;
    color: #2C3E50;
}
.lp-links a {
    text-decoration: none;
    color: #666;
    margin-left: 2rem;
    font-weight: 600;
}
.cta-btn {
    background: #3A7AFE;
    color: white !important;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    transition: background 0.2s;
}
.cta-btn:hover {
    background: #2563EB;
}
.hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    gap: 4rem;
}
.hero-content {
    flex: 1;
    max-width: 600px;
}
.hero h1 {
    font-size: 3.5rem;
    line-height: 1.1;
    margin-bottom: 1.5rem;
    background: -webkit-linear-gradient(45deg, #3A7AFE, #6A5EF7);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}
.hero p {
    font-size: 1.2rem;
    color: #666;
    line-height: 1.6;
    margin-bottom: 2rem;
}
.cta-btn.big {
    display: inline-flex;
    align-items: center;
    padding: 1rem 2rem;
    font-size: 1.1rem;
}
.sub-cta {
    font-size: 0.9rem !important;
    margin-top: 1rem;
    color: #999 !important;
}
.hero-image {
    flex: 1;
}
.mockup {
    background: #F4F7FC;
    border-radius: 20px;
    padding: 20px;
    height: 400px;
}
.features {
    display: flex;
    justify-content: center;
    gap: 2rem;
    padding: 4rem 2rem;
    background: #F9FAFB;
}
.feature-item {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    width: 300px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.feature-icon {
    color: #3A7AFE;
    margin-bottom: 1rem;
}
@media (max-width: 768px) {
    .hero {
        flex-direction: column;
        text-align: center;
        padding-top: 2rem;
    }
    .hero h1 {
        font-size: 2.5rem;
    }
    .features {
        flex-direction: column;
        align-items: center;
    }
}
</style>

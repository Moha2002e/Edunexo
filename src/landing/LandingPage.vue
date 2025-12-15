<script setup>
import { ArrowRight, BookOpen, Calendar, ShieldCheck, CheckCircle, Star, Zap, Layout, GraduationCap } from 'lucide-vue-next';
import HeroImage from '../assets/hero-image.png';
</script>

<template>
  <div class="landing-page">
    <!-- Navbar -->
    <nav class="lp-nav">
        <div class="logo">
            <span class="logo-icon">✨</span> Edunexo
        </div>
        <div class="lp-links">
            <a href="#features" class="nav-link">Fonctionnalités</a>
            <router-link to="/login" class="nav-link">Connexion</router-link>
            <router-link to="/register" class="cta-btn">S'inscrire gratuitement</router-link>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="hero">
        <div class="hero-bg-glow"></div>
        <div class="hero-content">
            <div class="badge-new">🚀 Nouvelle version disponible</div>
            <h1>TA réussite scolaire, <br><span class="gradient-text">pilotée par l'IA.</span></h1>
            <p class="hero-sub">
                Ne perds plus de temps à organiser tes révisions. Edunexo génère ton planning, teste tes connaissances et t'aide à valider ton année.
            </p>
            <div class="cta-group">
                <router-link to="/register" class="cta-btn big">
                    Commencer maintenant <ArrowRight size="20" />
                </router-link>
                <div class="trust-pill">
                    <div class="avatars">
                        <span class="avatar" style="background:#FF6B6B">T</span>
                        <span class="avatar" style="background:#4ECDC4">L</span>
                        <span class="avatar" style="background:#FFE66D">A</span>
                    </div>
                    <span>Rejoins +1000 étudiants</span>
                </div>
            </div>
            
            <div class="checklist">
                <span><CheckCircle size="16" class="check" /> Planning auto</span>
                <span><CheckCircle size="16" class="check" /> Quiz illimités</span>
                <span><CheckCircle size="16" class="check" /> 100% Gratuit au démarrage</span>
            </div>
        </div>
        <div class="hero-image-container">
            <img :src="HeroImage" alt="Interface Edunexo" class="hero-img" />
            
            <!-- Floating Cards Elements -->
            <div class="float-card card-1">
                <Calendar size="20" color="#3A7AFE" />
                <div>
                    <span class="fc-title">Planning généré</span>
                    <span class="fc-sub">Semaine validée ✅</span>
                </div>
            </div>
            <div class="float-card card-2">
                <ShieldCheck size="20" color="#10B981" />
                <div>
                    <span class="fc-title">Note IA</span>
                    <span class="fc-sub">18/20 Excellent !</span>
                </div>
            </div>
        </div>
    </header>

    <!-- Features Section -->
    <section id="features" class="features-section">
        <div class="section-header">
            <h2>Tout ce dont tu as besoin pour réussir</h2>
            <p>Une suite d'outils complète pour remplacer tes fichiers Excel et tes notes éparpillées.</p>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="icon-box blue">
                    <Layout size="24" color="white" />
                </div>
                <h3>Tableau de bord centralisé</h3>
                <p>Visualise ta progression en un coup d'œil. Tes cours, tes tâches et tes échéances au même endroit.</p>
            </div>
            <div class="feature-card purple">
                <div class="icon-box purple">
                    <Zap size="24" color="white" />
                </div>
                <h3>Planning Intelligent</h3>
                <p>Notre algorithme adapte ton emploi du temps en fonction de tes dispos et de tes dates d'examen.</p>
            </div>
            <div class="feature-card green">
                <div class="icon-box green">
                    <GraduationCap size="24" color="white" />
                </div>
                <h3>Tuteur IA personnel</h3>
                <p>Pose des questions, génère des résumés de cours et des quiz d'entraînement à la demande.</p>
            </div>
        </div>
    </section>

    <!-- How it works -->
    <section class="steps-section">
        <div class="section-header">
            <h2>Comment ça marche ?</h2>
            <p>3 étapes simples pour reprendre le contrôle.</p>
        </div>
        
        <div class="steps-container">
            <div class="step">
                <div class="step-num">1</div>
                <h3>Ajoute tes cours</h3>
                <p>Rentre tes matières et le nombre de chapitres à réviser.</p>
            </div>
            <div class="step-line"></div>
            <div class="step">
                <div class="step-num">2</div>
                <h3>Définis tes dispos</h3>
                <p>Indique tes jours libres et tes objectifs de travail.</p>
            </div>
            <div class="step-line"></div>
            <div class="step">
                <div class="step-num">3</div>
                <h3>Suis le guide</h3>
                <p>L'IA génère ton planning. Tu n'as plus qu'à valider !</p>
            </div>
        </div>
    </section>

    <!-- CTA Bottom -->
    <section class="bottom-cta">
        <div class="cta-content">
            <h2>Prêt à booster tes moyennes ?</h2>
            <p>Rejoins la communauté Edunexo aujourd'hui. C'est gratuit.</p>
            <router-link to="/register" class="cta-btn white">
                Créer mon compte gratuit
            </router-link>
        </div>
    </section>

    <!-- Footer -->
    <footer class="lp-footer">
        <div class="footer-content">
            <div class="footer-col">
                <span class="logo">✨ Edunexo</span>
                <p>&copy; 2024 Edunexo. Tous droits réservés.</p>
            </div>
            <div class="footer-links">
                <a href="#">Mentions légales</a>
                <a href="#">Contact</a>
                <a href="#">Twitter</a>
            </div>
        </div>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
    font-family: 'Outfit', 'Inter', sans-serif;
    background: #F8FAFC;
    min-height: 100vh;
    overflow-x: hidden;
}

/* Navbar */
.lp-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 100;
}
.logo {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-dark);
    display: flex;
    align-items: center;
    gap: 8px;
}
.logo-icon {
    font-size: 1.2rem;
}
.lp-links {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}
.nav-link {
    text-decoration: none;
    color: var(--text-light);
    font-weight: 500;
    transition: color 0.2s;
}
.nav-link:hover {
    color: var(--primary);
}
.cta-btn {
    background: var(--primary);
    color: white !important;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}
.cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
}

/* Hero */
.hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    gap: 4rem;
    position: relative;
    overflow: visible;
}
.hero-content {
    flex: 1;
    max-width: 600px;
    z-index: 10;
}
.badge-new {
    display: inline-block;
    background: #EFF6FF;
    color: var(--primary);
    padding: 0.4rem 0.8rem;
    border-radius: 100px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    border: 1px solid #DBEAFE;
}
.hero h1 {
    font-size: 3.5rem;
    line-height: 1.1;
    margin-bottom: 1.5rem;
    color: var(--text-dark);
}
.gradient-text {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.hero-sub {
    font-size: 1.25rem;
    color: var(--text-light);
    line-height: 1.6;
    margin-bottom: 2.5rem;
}
.cta-group {
    display: flex;
    align-items: center;
    gap: 2rem;
    margin-bottom: 2rem;
}
.cta-btn.big {
    font-size: 1.1rem;
    padding: 1rem 2rem;
}
.trust-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.9rem;
    color: var(--text-dark);
    font-weight: 500;
}
.avatars {
    display: flex;
}
.avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.8rem;
    font-weight: bold;
    margin-left: -10px;
}
.avatar:first-child { margin-left: 0; }
.checklist {
    display: flex;
    gap: 1.5rem;
    color: var(--text-light);
    font-size: 0.95rem;
    font-weight: 500;
}
.checklist span {
    display: flex;
    align-items: center;
    gap: 6px;
}
.check { color: var(--accent); }

/* Hero Image & Float Cards */
.hero-image-container {
    flex: 1;
    position: relative;
    display: flex;
    justify-content: center;
}
.hero-img {
    max-width: 100%;
    height: auto;
    filter: drop-shadow(0 20px 40px rgba(58, 122, 254, 0.15));
    border-radius: 20px;
    transform: perspective(1000px) rotateY(-5deg);
    transition: transform 0.5s ease;
}
.hero-image-container:hover .hero-img {
    transform: perspective(1000px) rotateY(0deg);
}
.float-card {
    position: absolute;
    background: white;
    padding: 0.8rem 1.2rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 12px;
    animation: float 4s ease-in-out infinite;
    z-index: 20;
}
.card-1 { top: 10%; left: -20px; animation-delay: 0s; }
.card-2 { bottom: 15%; right: -20px; animation-delay: 2s; }
.fc-title { display: block; font-weight: 700; font-size: 0.9rem; }
.fc-sub { display: block; font-size: 0.8rem; color: var(--text-light); }

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

/* Hero Glow Effect */
.hero-bg-glow {
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(58,122,254,0.15) 0%, rgba(255,255,255,0) 70%);
    top: -50%;
    left: -20%;
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;
    animation: pulseGlow 10s ease-in-out infinite alternate;
}

@keyframes pulseGlow {
    0% { transform: scale(1); opacity: 0.5; }
    100% { transform: scale(1.2); opacity: 0.8; }
}

/* Features */
.features-section {
    padding: 5rem 2rem;
    background: white;
    position: relative;
    z-index: 1;
}
.section-header {
    text-align: center;
    max-width: 600px;
    margin: 0 auto 4rem auto;
}
.section-header h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}
.section-header p {
    color: var(--text-light);
    font-size: 1.2rem;
}
.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}
.feature-card {
    background: #F8FAFC;
    padding: 2.5rem;
    border-radius: 24px;
    transition: transform 0.2s;
}
.feature-card:hover {
    transform: translateY(-5px);
}
.icon-box {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
}
.icon-box.blue { background: var(--primary); }
.icon-box.purple { background: var(--secondary); }
.icon-box.green { background: var(--accent); }

.feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
}
.feature-card p {
    color: var(--text-light);
    line-height: 1.6;
}

/* Steps */
.steps-section {
    padding: 5rem 2rem;
    background: #F8FAFC;
}
.steps-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    max-width: 1000px;
    margin: 0 auto;
}
.step {
    flex: 1;
    text-align: center;
    padding: 1rem;
}
.step-num {
    width: 40px;
    height: 40px;
    background: var(--text-dark);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin: 0 auto 1.5rem auto;
}
.step-line {
    flex: 1;
    height: 2px;
    background: #E2E8F0;
    margin-top: 20px;
    display: block;
}
.step h3 { margin-bottom: 0.5rem; font-size: 1.2rem; }
.step p { font-size: 0.95rem; color: var(--text-light); }

/* CTA Bottom */
.bottom-cta {
    padding: 5rem 2rem;
    background: var(--primary);
    text-align: center;
    color: white;
}
.cta-content h2 { color: white; margin-bottom: 1rem; font-size: 2.5rem; }
.cta-content p { margin-bottom: 2.5rem; font-size: 1.2rem; opacity: 0.9; }
.cta-btn.white {
    background: white;
    color: var(--primary) !important;
}
.cta-btn.white:hover {
    background: #F8FAFC;
}

/* Footer */
.lp-footer {
    padding: 2rem;
    background: white;
    border-top: 1px solid var(--border-color);
}
.footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--text-light);
    font-size: 0.9rem;
}
.footer-links {
    display: flex;
    gap: 2rem;
}
.footer-links a {
    color: var(--text-light);
    text-decoration: none;
}
.footer-links a:hover { color: var(--primary); }

/* Responsive */
@media (max-width: 900px) {
    .lp-nav { padding: 1rem; }
    .hero {
        flex-direction: column-reverse;
        text-align: center;
        padding: 3rem 1rem;
        gap: 3rem;
    }
    .hero h1 { font-size: 2.5rem; }
    .hero-content { margin: 0 auto; }
    .cta-group { justify-content: center; flex-direction: column; gap: 1rem;}
    .checklist { justify-content: center; flex-wrap: wrap; }
    
    .steps-container { flex-direction: column; gap: 2rem; align-items: center; } /* Center steps */
    .step-line { display: none; }
    .step { width: 100%; } /* Ensure full width */

    .lp-nav .nav-link { display: none; } /* Keeping simple for now */
    
    .card-1 { left: 0; top: 0; }
    .card-2 { right: 0; bottom: 0; }
    
    .footer-content { flex-direction: column; gap: 2rem; text-align: center; }
    .footer-links { flex-direction: column; gap: 1rem; }
}

@media (max-width: 600px) {
    .hero h1 { font-size: 2rem; }
    .hero-bg-glow { width: 100%; left: 0; }
    .feature-card { padding: 1.5rem; }
    .features-grid { grid-template-columns: 1fr; } /* Force single column on phones */
    
    .badge-new { font-size: 0.75rem; }
    .trust-pill { justify-content: center; }
}
</style>

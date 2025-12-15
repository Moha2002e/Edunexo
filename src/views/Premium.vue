<script setup>
import { ref, onMounted } from 'vue';
import { Crown, Check, Star, Sparkles, X, Shield, Zap } from 'lucide-vue-next';
import { auth } from '../firebase/firebase';
import { listenToSubscription, createCheckoutSession } from '../firebase/premium';

const currentPlan = ref(null);
const isLoading = ref(true);

onMounted(() => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            listenToSubscription(user.uid, (data) => {
                currentPlan.value = data?.status || 'free';
                isLoading.value = false;
            });
        }
    });
});

const subscribe = (planId) => {
    if (!auth.currentUser) return;
    createCheckoutSession(auth.currentUser.uid, planId);
};
</script>

<template>
  <div class="container">
    <div class="header-section text-center">
        <h1><Crown size="32" style="color:#F59E0B; vertical-align:bottom; margin-right:8px;"/> Passez au niveau supérieur</h1>
        <p>Débloquez toutes les fonctionnalités pour réussir vos études.</p>
    </div>

    <div v-if="currentPlan === 'active'" class="active-sub-banner">
        <Sparkles size="20" />
        <span>Vous êtes membre <strong>Premium</strong> ! Merci de votre confiance.</span>
    </div>

    <div class="pricing-grid">
        <!-- Basic Plan -->
        <div class="card pricing-card">
            <div class="plan-header">
                <h3>Edunexo Basic</h3>
                <div class="price">Gratuit</div>
                <p class="plan-desc">Pour découvrir la plateforme.</p>
            </div>
            <ul class="features">
                <li><Check size="18" class="check" /> Gestion de 3 cours</li>
                <li><Check size="18" class="check" /> Planning basique</li>
                <li><Check size="18" class="check" /> Accès Dashboard</li>
                <li class="disabled"><X size="18" /> Assistant IA</li>
            </ul>
            <div class="spacer"></div>
            <button class="outline full-width" disabled>Inclus</button>
        </div>

        <!-- Premium Plan -->
        <div class="card pricing-card featured">
            <div class="badge">LE POPULAIRE</div>
            <div class="plan-header">
                <h3>Edunexo Premium</h3>
                <div class="price">5€ <span class="period">/ mois</span></div>
                <p class="plan-desc">Tout pour exceller, sans limite.</p>
            </div>
            <ul class="features">
                <li><Check size="18" class="check" /> <strong>Cours illimités</strong></li>
                <li><Check size="18" class="check" /> Planning prioritaire</li>
                <li><Check size="18" class="check" /> <Sparkles size="16" style="color:#8B5CF6;"/> <strong>Assistant IA illimité</strong></li>
                <li><Check size="18" class="check" /> Support dédié</li>
            </ul>
             <div class="spacer"></div>
            <button 
                v-if="currentPlan !== 'active'"
                @click="subscribe('price_1SeeflCXSUVwiHkpIZE3DfvB')" 
                class="primary full-width shimmer-btn"
            >
                Devenir Premium
            </button>
             <button v-else class="primary full-width" disabled>
                Actif
            </button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.text-center { text-align: center; }

.header-section {
    margin-bottom: 3rem;
}
.header-section h1 { font-size: 2.2rem; margin-bottom: 0.5rem; }
.header-section p { color: var(--text-light); font-size: 1.1rem; }

.pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    max-width: 900px;
    margin: 0 auto;
}

.pricing-card {
    position: relative;
    padding: 2.5rem;
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    border-radius: 24px;
    transition: transform 0.3s;
}

.pricing-card.featured {
    border: 2px solid var(--primary);
    background: var(--surface);
    transform: scale(1.02);
    box-shadow: 0 20px 40px -10px rgba(37, 99, 235, 0.15);
    z-index: 10;
}

.badge {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--primary);
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
}

.plan-header {
    text-align: center;
    margin-bottom: 2rem;
}
.plan-header h3 { font-size: 1.25rem; color: var(--text-dark); margin-bottom: 0.5rem; }
.plan-desc { color: var(--text-light); font-size: 0.95rem; }

.price {
    font-size: 3rem;
    font-weight: 800;
    color: var(--text-dark);
    margin: 0.5rem 0;
    letter-spacing: -0.05em;
}
.period {
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-light);
    letter-spacing: normal;
}

.features {
    list-style: none;
    padding: 0;
    margin-bottom: 2rem;
    flex: 1;
}
.features li {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1rem;
    color: var(--text-dark);
}

.check {
    color: #10B981; /* Green */
    flex-shrink: 0;
}

.disabled {
    color: #CBD5E1;
    text-decoration: line-through;
}
.disabled svg { color: #CBD5E1; }

.spacer { flex: 1; min-height: 20px;}

.active-sub-banner {
    background: #ECFDF5;
    color: #065F46;
    padding: 1rem 2rem;
    border-radius: 12px;
    text-align: center;
    margin: 0 auto 3rem auto;
    font-weight: 600;
    max-width: 600px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border: 1px solid #A7F3D0;
}

.shimmer-btn {
    position: relative;
    overflow: hidden;
}
.shimmer-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 200%;
    height: 100%;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
    animation: shimmer 3s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(0); }
    100% { transform: translateX(100%); }
}

@media (max-width: 768px) {
    .pricing-card.featured {
        transform: none;
    }
}
</style>

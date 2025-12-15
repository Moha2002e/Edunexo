<script setup>
import { ref, onMounted } from 'vue';
import { Crown, Check, Star } from 'lucide-vue-next';
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
        <h1><Crown size="32" style="color:#f1c40f; vertical-align:bottom; margin-right:5px;"/> Passez au niveau supérieur</h1>
        <p>Débloquez toutes les fonctionnalités pour réussir vos études.</p>
    </div>

    <div v-if="currentPlan === 'active'" class="active-sub-banner">
        🎉 Vous êtes Membre Premium ! Profitez de tous vos avantages.
    </div>

    <div class="pricing-grid">
        <!-- Basic Plan -->
        <div class="card pricing-card">
            <div class="plan-header">
                <h3>Edunexo Basic</h3>
                <div class="price">Gratuit</div>
            </div>
            <ul class="features">
                <li><Check size="16" class="check" /> Gestion de 3 cours</li>
                <li><Check size="16" class="check" /> Planning basique</li>
                <li><Check size="16" class="check" /> Accès Dashboard</li>
                <li class="disabled"><X size="16" /> Assistant IA</li>
            </ul>
            <button class="outline full-width" disabled>Inclus</button>
        </div>

        <!-- Premium Plan -->
        <div class="card pricing-card featured" :class="{ 'subscribed': currentPlan === 'active' }">
            <div class="badge">Recommandé</div>
            <div class="plan-header">
                <h3>Edunexo Premium</h3>
                <div class="price">5€ <span class="period">/ mois</span></div>
            </div>
            <ul class="features">
                <li><Check size="16" class="check" /> <strong>Cours illimités</strong></li>
                <li><Check size="16" class="check" /> Planning avancé</li>
                <li><Check size="16" class="check" /> <Sparkles size="16" style="vertical-align:text-bottom; color:#8e44ad;" /> <strong>Assistant IA illimité</strong></li>
                <li><Check size="16" class="check" /> Support prioritaire</li>
            </ul>
            <button 
                v-if="currentPlan !== 'active'"
                @click="subscribe('price_premium_monthly')" 
                class="primary full-width"
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
.pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    max-width: 900px;
    margin: 3rem auto;
}
.pricing-card {
    position: relative;
    padding: 2rem;
    border: 1px solid #eee;
    display: flex;
    flex-direction: column;
}
.pricing-card.featured {
    border: 2px solid var(--primary);
    transform: scale(1.05);
    box-shadow: 0 10px 40px rgba(58, 122, 254, 0.15);
}
.badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--primary);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 700;
}
.plan-header {
    text-align: center;
    margin-bottom: 2rem;
}
.price {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--text-dark);
    margin-top: 0.5rem;
}
.period {
    font-size: 1rem;
    font-weight: 400;
    color: var(--text-light);
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
    gap: 10px;
}
.check {
    color: #2ecc71;
}
.disabled {
    color: #bdc3c7;
    text-decoration: line-through;
}
.active-sub-banner {
    background: #d4edda;
    color: #155724;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    margin-bottom: 2rem;
    font-weight: 600;
}

@media (max-width: 768px) {
    .pricing-card.featured {
        transform: none;
        box-shadow: 0 4px 20px rgba(58, 122, 254, 0.1);
    }
}
</style>

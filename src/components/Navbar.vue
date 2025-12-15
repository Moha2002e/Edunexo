<script setup>
import { LayoutDashboard, BookOpen, Calendar, Menu, X, LogOut, Sparkles, Crown } from 'lucide-vue-next';
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { auth } from '../firebase/firebase'; 
import { signOut } from 'firebase/auth';

const router = useRouter();
const route = useRoute();
const isMenuOpen = ref(false);
const user = ref(null);

const toggleMenu = () => isMenuOpen.value = !isMenuOpen.value;

onMounted(() => {
  auth.onAuthStateChanged((u) => {
    user.value = u;
  });
});

const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
    isMenuOpen.value = false;
};

// Don't show navbar on login/register pages or landing page
const showNavbar = computed(() => {
    const isAuthPage = route.path === '/login' || route.path === '/register';
    const isLanding = route.path === '/welcome';
    return !isAuthPage && !isLanding;
});
</script>

<template>
  <nav class="navbar" v-if="showNavbar">
    <div class="nav-container">
      <div class="logo">
        <span class="logo-icon">✨</span> Edunexo
      </div>
      
      <!-- Mobile Toggle -->
      <button class="menu-toggle" @click="toggleMenu">
        <component :is="isMenuOpen ? X : Menu" color="#2C3E50" />
      </button>

      <!-- Desktop & Mobile Links -->
      <div class="nav-links" :class="{ 'open': isMenuOpen }">
        <div class="user-greeting mobile-only" v-if="user">
            Bonjour, {{ user.displayName?.split(' ')[0] }}
        </div>

        <router-link to="/" @click="isMenuOpen = false">
          <LayoutDashboard size="18" /> <span class="link-text">Tableau de bord</span>
        </router-link>
        <router-link to="/courses" @click="isMenuOpen = false">
          <BookOpen size="18" /> <span class="link-text">Mes Cours</span>
        </router-link>
        <router-link to="/planning" @click="isMenuOpen = false">
          <Calendar size="18" /> <span class="link-text">Planning</span>
        </router-link>
        <router-link to="/ai-assistant" @click="isMenuOpen = false" class="ai-link">
          <Sparkles size="18" /> <span class="link-text">Assistant IA</span>
        </router-link>
        <router-link to="/premium" @click="isMenuOpen = false" class="premium-link">
          <Crown size="18" /> <span class="link-text">Premium</span>
        </router-link>
        
        <div class="divider mobile-only"></div>

        <button @click="handleLogout" class="logout-btn">
            <LogOut size="18" /> <span class="mobile-only">Déconnexion</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Updated Navbar Styles */
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0.75rem 0;
}
.nav-container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}
.logo {
  font-weight: 800;
  font-size: 1.5rem;
  color: var(--text-dark); /* Solid slate color */
  display: flex;
  align-items: center;
  gap: 1.5rem; /* Increased spacing for logo */
  letter-spacing: -0.03em;
  margin-right: 2rem; /* Add specific margin to separate from links/button */
}
.nav-links {
  display: flex;
  gap: 0.5rem; /* Tighter gap for better grouping */
  align-items: center;
}
.nav-links a {
  text-decoration: none;
  color: var(--text-light);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  padding: 0.6rem 1rem;
  border-radius: 99px; /* Pill shape for modern feel */
  font-size: 0.95rem;
}
.nav-links a:hover {
  color: var(--text-dark);
  background: #F1F5F9;
}
.nav-links a.router-link-active {
  color: var(--primary);
  background: #EFF6FF; /* Very subtle blue bg */
  font-weight: 600;
}

/* Specific Feature Colors (Subtle) */
.ai-link.router-link-active {
    color: #9333ea !important; /* Proper Purple */
    background: #faf5ff !important;
}
.premium-link.router-link-active {
    color: #ca8a04 !important; /* Darker Gold */
    background: #fefce8 !important;
}

.logout-btn {
  background: transparent;
  border: none;
  padding: 0.6rem;
  color: var(--text-light);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  cursor: pointer;
  margin-left: 0.5rem;
}
.logout-btn:hover {
  background: #fee2e2;
  color: #ef4444;
  border-radius: 99px;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
}

@media (max-width: 768px) {
  .nav-container {
      padding: 0 1rem;
  }
  .menu-toggle {
    display: block;
  }
  .nav-links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: white;
    flex-direction: column;
    padding: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    align-items: stretch;
    border-bottom: 1px solid var(--border-color);
  }
  .nav-links.open {
    display: flex;
  }
  .nav-links a {
      width: 100%;
      border-radius: 12px;
      justify-content: flex-start;
  }
  .mobile-only {
      display: inline;
  }
  .user-greeting {
      padding: 0.5rem 1rem;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 0.5rem;
  }
  .divider {
      height: 1px;
      background: var(--border-color);
      width: 100%;
      margin: 0.5rem 0;
  }
  .logout-btn {
      width: 100%;
      justify-content: flex-start;
      margin-left: 0;
      border-radius: 12px;
      padding: 0.6rem 1rem;
  }
}
</style>

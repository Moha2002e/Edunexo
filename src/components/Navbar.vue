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
  background: white;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0.8rem 0;
}
.nav-container {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
}
.logo {
  font-weight: 800;
  font-size: 1.4rem;
  color: var(--text-dark);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}
.nav-links a {
  text-decoration: none;
  color: var(--text-light);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
}
.nav-links a:hover, .nav-links a.router-link-active {
  color: var(--primary);
  background: #EFF6FF;
}
.ai-link {
    color: #8e44ad !important;
}
.ai-link:hover, .ai-link.router-link-active {
    background: #f3e5f5 !important;
    color: #8e44ad !important;
}
.premium-link {
    color: #f1c40f !important;
}
.premium-link:hover, .premium-link.router-link-active {
    background: #fff9c4 !important;
    color: #fbc02d !important;
}

.logout-btn {
  background: transparent;
  border: none;
  padding: 0.5rem;
  color: #e74c3c;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  cursor: pointer;
}
.logout-btn:hover {
  background: #fff5f5;
  border-radius: 8px;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
}

@media (max-width: 768px) {
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
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    align-items: flex-start;
  }
  .nav-links.open {
    display: flex;
  }
  .nav-links a {
      width: 100%;
  }
  .mobile-only {
      display: inline;
  }
  .user-greeting {
      padding: 0.5rem 0.8rem;
      font-weight: bold;
      color: var(--text-dark);
      margin-bottom: 0.5rem;
  }
  .divider {
      height: 1px;
      background: #eee;
      width: 100%;
      margin: 0.5rem 0;
  }
}
</style>

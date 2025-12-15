<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { Mail, Lock, LogIn } from 'lucide-vue-next';

const router = useRouter();
const email = ref('');
const password = ref('');
const errorMsg = ref('');
const isLoading = ref(false);

const login = async () => {
  errorMsg.value = '';
  isLoading.value = true;
  
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    router.push('/');
  } catch (error) {
    console.error(error);
    errorMsg.value = "Email ou mot de passe incorrect.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>Bon retour ! 👋</h1>
        <p>Connecte-toi pour accéder à ton planning</p>
      </div>

      <form @submit.prevent="login">
        <label>Email</label>
        <div class="input-with-icon">
            <Mail size="18" class="input-icon" />
            <input type="email" v-model="email" placeholder="etudiant@ecole.com" required />
        </div>
        
        <label>Mot de passe</label>
        <div class="input-with-icon">
            <Lock size="18" class="input-icon" />
            <input type="password" v-model="password" placeholder="••••••••" required />
        </div>

        <div v-if="errorMsg" class="error-box">
            {{ errorMsg }}
        </div>

        <button type="submit" class="primary full-width" :disabled="isLoading">
            {{ isLoading ? 'Connexion...' : 'Se connecter' }} <LogIn size="18" style="margin-left:5px; vertical-align:text-bottom;" />
        </button>
      </form>

      <div class="auth-footer">
        Pas encore de compte ? <router-link to="/register">Créer un compte</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 1rem;
}
.auth-card {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
  width: 100%;
  max-width: 400px;
}
.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}
.auth-header h1 {
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
}
.auth-header p {
  color: var(--text-light);
  margin: 0;
}
.input-with-icon {
  position: relative;
  margin-bottom: 1.2rem;
}
.input-icon {
  position: absolute;
  left: 14px;
  top: 13px;
  color: #95a5a6;
}
.input-with-icon input {
  padding-left: 42px;
  margin-bottom: 0; 
}
.full-width {
  width: 100%;
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
.error-box {
    background: #fff5f5;
    color: #e74c3c;
    padding: 0.8rem;
    border-radius: 8px;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    text-align: center;
}
.auth-footer {
    text-align: center;
    margin-top: 1.5rem;
    font-size: 0.95rem;
    color: var(--text-light);
}
.auth-footer a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
}
</style>

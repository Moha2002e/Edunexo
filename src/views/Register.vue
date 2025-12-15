<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { User, Mail, Lock, ArrowRight } from 'lucide-vue-next';

const router = useRouter();
const name = ref('');
const email = ref('');
const password = ref('');
const errorMsg = ref('');
const isLoading = ref(false);

const register = async () => {
  errorMsg.value = '';
  isLoading.value = true;
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    // Add Display Name
    await updateProfile(userCredential.user, {
        displayName: name.value
    });
    router.push('/');
  } catch (error) {
    console.error(error);
    switch(error.code) {
        case 'auth/email-already-in-use':
            errorMsg.value = "Cet email est déjà utilisé.";
            break;
        case 'auth/weak-password':
            errorMsg.value = "Le mot de passe doit faire au moins 6 caractères.";
            break;
        default:
            errorMsg.value = "Une erreur est survenue lors de l'inscription.";
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>Créer un compte</h1>
        <p>Rejoins Edunexo pour booster tes révisions</p>
      </div>

      <form @submit.prevent="register">
        <label>Ton Prénom</label>
        <div class="input-with-icon">
            <User size="18" class="input-icon" />
            <input type="text" v-model="name" placeholder="Ex: Thomas" required />
        </div>

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
            {{ isLoading ? 'Création...' : 'S\'inscrire gratuitement' }} <ArrowRight size="18" style="margin-left:5px; vertical-align:text-bottom;" />
        </button>
      </form>

      <div class="auth-footer">
        Déjà un compte ? <router-link to="/login">Se connecter</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Modern Auth Styles - Consistent with Login */
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 1rem;
}

.auth-card {
  background: var(--surface);
  padding: 3rem;
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 420px;
  border: 1px solid var(--border-color);
}

.auth-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.auth-header h1 {
  margin-bottom: 0.75rem;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--text-dark);
}

.auth-header p {
  color: var(--text-light);
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.5;
}

.input-with-icon {
  position: relative;
  margin-bottom: 1.25rem;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  transition: color 0.2s;
}

.input-with-icon input:focus + .input-icon,
.input-with-icon:focus-within .input-icon {
    color: var(--primary);
}

.input-with-icon input {
  padding-left: 48px;
  margin-bottom: 0; 
  height: 52px;
  border-radius: 12px;
}

.full-width {
  width: 100%;
  margin-top: 1.5rem;
  height: 52px;
  font-size: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-box {
    background: #FEF2F2;
    color: #DC2626;
    padding: 1rem;
    border-radius: 12px;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
    text-align: center;
    border: 1px solid #FECACA;
}

.auth-footer {
    text-align: center;
    margin-top: 2rem;
    font-size: 0.95rem;
    color: var(--text-light);
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
}

.auth-footer a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
    margin-left: 4px;
}

.auth-footer a:hover {
    text-decoration: underline;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1.5rem;
    box-shadow: none;
    border: none;
    background: transparent;
  }
  .auth-header h1 {
    font-size: 1.75rem;
  }
}
</style>

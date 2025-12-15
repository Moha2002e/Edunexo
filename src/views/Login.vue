<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { Mail, Lock, LogIn } from 'lucide-vue-next';

const router = useRouter();
const email = ref('');
const password = ref('');
const errorMsg = ref('');
const infoMsg = ref('');
const isLoading = ref(false);
const isResetting = ref(false);

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

const resetPassword = async () => {
    errorMsg.value = '';
    infoMsg.value = '';
    if(!email.value) {
        errorMsg.value = "Veuillez entrer votre email.";
        return;
    }
    
    isLoading.value = true;
    try {
        await sendPasswordResetEmail(auth, email.value);
        infoMsg.value = "Un email de réinitialisation a été envoyé !";
    } catch (error) {
        console.error(error);
        if(error.code === 'auth/user-not-found') {
             errorMsg.value = "Aucun compte trouvé avec cet email.";
        } else {
             errorMsg.value = "Erreur lors de l'envoi de l'email.";
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
        <h1>Bon retour ! 👋</h1>
        <p>Connecte-toi pour accéder à ton planning</p>
      </div>

      <form v-if="!isResetting" @submit.prevent="login">
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

        <div class="forgot-password">
            <a href="#" @click.prevent="isResetting = true">Mot de passe oublié ?</a>
        </div>

        <div v-if="errorMsg" class="error-box">
            {{ errorMsg }}
        </div>

        <button type="submit" class="primary full-width" :disabled="isLoading">
            {{ isLoading ? 'Connexion...' : 'Se connecter' }} <LogIn size="18" style="margin-left:5px; vertical-align:text-bottom;" />
        </button>
      </form>

      <form v-else @submit.prevent="resetPassword">
        <p style="text-align:center; color:var(--text-light); margin-bottom:1.5rem;">
            Entrez votre email pour recevoir un lien de réinitialisation.
        </p>
        
        <label>Email</label>
        <div class="input-with-icon">
            <Mail size="18" class="input-icon" />
            <input type="email" v-model="email" placeholder="etudiant@ecole.com" required />
        </div>

        <div v-if="infoMsg" class="success-box">
            {{ infoMsg }}
        </div>
        <div v-if="errorMsg" class="error-box">
            {{ errorMsg }}
        </div>

        <button type="submit" class="primary full-width" :disabled="isLoading">
            {{ isLoading ? 'Envoi...' : 'Envoyer le lien' }}
        </button>
        
        <button type="button" class="link-btn full-width" @click="isResetting = false" style="margin-top:0.5rem;">
            Retour à la connexion
        </button>
      </form>

      <div class="auth-footer" v-if="!isResetting">
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
    margin-bottom: 1rem;
    text-align: center;
}
.success-box {
    background: #d4edda;
    color: #155724;
    padding: 0.8rem;
    border-radius: 8px;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    text-align: center;
}
.forgot-password {
    text-align: right;
    margin-bottom: 1rem;
    font-size: 0.9rem;
}
.forgot-password a {
    color: var(--text-light);
    text-decoration: none;
}
.forgot-password a:hover {
    color: var(--primary);
    text-decoration: underline;
}
.link-btn {
    background: none;
    border: none;
    color: var(--text-light);
    cursor: pointer;
    text-decoration: underline;
}
.link-btn:hover {
    color: var(--text-dark);
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

@media (max-width: 480px) {
  .auth-card {
    padding: 1.5rem;
  }
  .auth-header h1 {
    font-size: 1.5rem;
  }
}
</style>

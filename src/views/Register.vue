<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from 'firebase/auth'; // Import signOut
import { auth } from '../firebase/firebase';
import { User, Mail, Lock, ArrowRight, CheckCircle, Send } from 'lucide-vue-next'; // New Icons

const router = useRouter();
const name = ref('');
const email = ref('');
const password = ref('');
const errorMsg = ref('');
const isLoading = ref(false);
const verificationSent = ref(false); // New state

const register = async () => {
  errorMsg.value = '';
  isLoading.value = true;
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    
    // Add Display Name
    await updateProfile(userCredential.user, {
        displayName: name.value
    });

    // Send Verification Email
    await sendEmailVerification(userCredential.user);
    
    // Sign out immediately so they have to login again after verifying
    await signOut(auth);
    
    // Show success message
    verificationSent.value = true;
    
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
      
      <!-- Verification Success Mode -->
      <div v-if="verificationSent" class="auth-success">
          <div class="success-icon">
              <CheckCircle size="48" color="#10B981" />
          </div>
          <h1>Vérifie ta boîte mail !</h1>
          <p>Un lien de confirmation vient d'être envoyé à <strong>{{ email }}</strong>.</p>
          <p class="sub-text">Clique sur ce lien pour activer ton compte, puis connecte-toi.</p>
          
          <router-link to="/login" class="primary full-width btn-login">
              Retour à la connexion
          </router-link>
      </div>

      <!-- Registration Form Mode -->
      <div v-else>
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
                {{ isLoading ? 'Envoi en cours...' : 'S\'inscrire gratuitement' }} <ArrowRight size="18" style="margin-left:5px; vertical-align:text-bottom;" />
            </button>
        </form>

        <div class="auth-footer">
            Déjà un compte ? <router-link to="/login">Se connecter</router-link>
        </div>
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

.auth-success {
    text-align: center;
    padding: 1rem;
    animation: fadeIn 0.5s ease;
}
.success-icon {
    background: #D1FAE5;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem auto;
}
.auth-success h1 { font-size: 1.8rem; margin-bottom: 1rem; }
.sub-text { color: var(--text-light); margin-bottom: 2rem; }
.btn-login { text-decoration: none; margin-top: 1rem; background: var(--text-dark); }
.btn-login:hover { background: black; }

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>

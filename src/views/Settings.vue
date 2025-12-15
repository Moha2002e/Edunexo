import { ref, watch, onMounted } from 'vue';
import { User, Mail, Bell, Moon, Save, LogOut } from 'lucide-vue-next';
import { auth } from '../firebase/firebase';
import { updateProfile, signOut } from 'firebase/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref(auth.currentUser);
const displayName = ref(user.value?.displayName || '');
const email = ref(user.value?.email || '');
const msg = ref('');
const msgType = ref('success');

// Preferences
const emailNotif = ref(true);
const darkMode = ref(false);

onMounted(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        darkMode.value = true;
    }
});

watch(darkMode, (newVal) => {
    if (newVal) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
});

const updateName = async () => {
    try {
        await updateProfile(user.value, { displayName: displayName.value });
        showMsg('Profil mis à jour avec succès !', 'success');
    } catch (e) {
        showMsg('Erreur lors de la mise à jour.', 'error');
    }
};

const showMsg = (text, type) => {
    msg.value = text;
    msgType.value = type;
    setTimeout(() => msg.value = '', 3000);
};

const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
};

const getInitials = () => {
    if (!displayName.value) return 'E';
    return displayName.value.substring(0, 2).toUpperCase();
};
</script>

<template>
  <div class="container">
    <div class="header-section">
      <h1>Paramètres</h1>
      <p style="color:var(--text-light)">Gérez votre compte et vos préférences.</p>
    </div>

    <div class="settings-grid">
        
        <!-- Profile Card -->
        <div class="card">
            <div class="profile-header">
                <div class="avatar-large">{{ getInitials() }}</div>
                <div class="profile-info">
                   <h2>{{ displayName || 'Étudiant' }}</h2>
                   <p class="email-text">{{ email }}</p>
                   <span class="badge">Compte &bull; Actif</span>
                </div>
            </div>

            <form @submit.prevent="updateName" class="profile-form">
                <div class="form-group">
                    <label>Nom d'affichage</label>
                     <div class="input-with-icon">
                        <User size="18" class="input-icon" />
                        <input v-model="displayName" placeholder="Votre Prénom" />
                    </div>
                </div>
                <!-- Email Readonly -->
                <div class="form-group">
                    <label>Adresse Email</label>
                     <div class="input-with-icon">
                        <Mail size="18" class="input-icon" />
                        <input v-model="email" disabled style="background:#F1F5F9; cursor:not-allowed;" />
                    </div>
                </div>

                <button class="primary full-width" type="submit">
                    <Save size="18" style="margin-right:8px;"/> Enregistrer
                </button>
                
                <p v-if="msg" class="msg" :class="msgType">{{ msg }}</p>
            </form>
        </div>

        <!-- Preferences Card -->
        <div class="card h-fit">
            <h2>Préférences</h2>
            <div class="pref-list">
                <div class="pref-item">
                    <div class="pref-info">
                        <span class="pref-title"><Bell size="18" /> Notifications Email</span>
                        <p class="pref-desc">Recevoir un résumé hebdomadaire.</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" v-model="emailNotif">
                        <span class="slider round"></span>
                    </label>
                </div>
                
                <div class="pref-item">
                     <div class="pref-info">
                        <span class="pref-title"><Moon size="18" /> Mode Sombre</span>
                        <p class="pref-desc">Thème sombre pour moins de fatigue (Bientôt).</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" v-model="darkMode">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>

            <hr class="divider"/>

            <button @click="handleLogout" class="btn-danger full-width">
                <LogOut size="18" style="margin-right:8px;"/> Se déconnecter
            </button>
        </div>

    </div>
  </div>
</template>

<style scoped>
.header-section { margin-bottom: 2rem; }

.settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}
@media (max-width: 800px) { .settings-grid { grid-template-columns: 1fr; } }

/* Profile Styles */
.profile-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 1.5rem;
}
.avatar-large {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    font-size: 2rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    box-shadow: var(--shadow-md);
}
.email-text { color: var(--text-light); margin: 0.2rem 0 0.5rem; }
.badge {
    background: #DCFCE7;
    color: #166534;
    padding: 0.3rem 0.8rem;
    border-radius: 99px;
    font-size: 0.8rem;
    font-weight: 600;
}

.profile-form { display: flex; flex-direction: column; gap: 1rem; }
.full-width { width: 100%; justify-content: center; }

.msg { padding: 0.8rem; border-radius: 8px; text-align: center; font-weight: 600; }
.msg.success { background: #ECFDF5; color: #047857; }
.msg.error { background: #FEF2F2; color: #DC2626; }

/* Preferences Styles */
.pref-list { display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1rem; }
.pref-item { display: flex; justify-content: space-between; align-items: center; }
.pref-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: var(--text-dark); }
.pref-desc { font-size: 0.85rem; color: var(--text-light); margin: 0; margin-left: 26px; }

.divider { border: 0; border-top: 1px solid var(--border-color); margin: 2rem 0; }

.btn-danger {
    background: #FEF2F2;
    color: #DC2626;
    border: 1px solid #FECACA;
    padding: 0.8rem;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}
.btn-danger:hover { background: #FEE2E2; }

/* TOGGLE SWITCH */
.switch { position: relative; display: inline-block; width: 50px; height: 26px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #CBD5E1; transition: .4s; border-radius: 34px; }
.slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
input:checked + .slider { background-color: var(--primary); }
input:checked + .slider:before { transform: translateX(24px); }
</style>

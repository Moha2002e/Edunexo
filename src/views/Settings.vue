<script setup>
import { ref } from 'vue';
import { User } from 'lucide-vue-next';
import { auth } from '../firebase/firebase';
import { updateProfile } from 'firebase/auth';

const user = ref(auth.currentUser);
const displayName = ref(user.value?.displayName || '');
const msg = ref('');

const updateName = async () => {
    try {
        await updateProfile(user.value, { displayName: displayName.value });
        msg.value = 'Profil mis à jour !';
        setTimeout(() => msg.value = '', 3000);
    } catch (e) {
        msg.value = 'Erreur lors de la mise à jour.';
    }
};
</script>

<template>
  <div class="container">
    <h1>Paramètres</h1>
    <div class="card h-fit">
        <h2>Mon Profil</h2>
        <form @submit.prevent="updateName">
            <label>Prénom</label>
            <div class="input-with-icon">
                <User size="16" class="input-icon" />
                <input v-model="displayName" />
            </div>
            <button class="primary" type="submit">Enregistrer</button>
            <p v-if="msg" class="msg">{{ msg }}</p>
        </form>
    </div>
  </div>
</template>

<style scoped>
.msg { color: green; margin-top: 10px; }
</style>

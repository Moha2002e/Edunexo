import { ref, onMounted, onUnmounted } from 'vue';
import { auth, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function usePremium() {
    const isPremium = ref(false);
    const isLoading = ref(true);
    let unsubscribe = null;

    onMounted(() => {
        const user = auth.currentUser;
        if (!user) {
            isLoading.value = false;
            return;
        }

        // 1. Check if user is the specific admin (hardcoded for simplicity as requested, or can be in DB)
        // Adjust this logic if you want a real "Admin" role in Firestore
        // For now, we rely on subscription status
        const subRef = doc(db, 'users', user.uid, 'subscription', 'status');

        unsubscribe = onSnapshot(subRef, (docSnap) => {
            const data = docSnap.data();
            // is premium if status is active OR if explicit override exist
            isPremium.value = data?.status === 'active';
            isLoading.value = false;
        }, (error) => {
            console.error("Premium check error:", error);
            isLoading.value = false;
        });
    });

    onUnmounted(() => {
        if (unsubscribe) unsubscribe();
    });

    return { isPremium, isLoading };
}

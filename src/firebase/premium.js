import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export const listenToSubscription = (uid, callback) => {
    const subRef = doc(db, 'users', uid, 'subscription', 'status');
    return onSnapshot(subRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        } else {
            callback(null);
        }
    });
};

// This function calls your backend to create a Checkout Session
export const createCheckoutSession = async (uid, planId) => {
    // Use localhost for dev, but relative path for prod (assuming same domain)
    const apiUrl = import.meta.env.DEV
        ? 'http://localhost:4242/create-checkout-session'
        : '/create-checkout-session';

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, planId })
    });

    const session = await response.json();
    if (session.url) {
        window.location.href = session.url;
    } else {
        console.error("No checkout URL returned");
    }
};

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
    // Call your local NodeJS server or Cloud Function
    const response = await fetch('http://localhost:4242/create-checkout-session', {
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

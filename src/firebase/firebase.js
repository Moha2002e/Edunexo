import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAHiR2dADIeuozuVzEBSzdR5scmIgFCpts",
    authDomain: "edunexo-71f55.firebaseapp.com",
    projectId: "edunexo-71f55",
    storageBucket: "edunexo-71f55.firebasestorage.app",
    messagingSenderId: "715516929228",
    appId: "1:715516929228:web:48c69cbc82dc8f3cc78e69",
    measurementId: "G-0JT6LDXVLM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exports
export const auth = getAuth(app);
export const db = getFirestore(app);
import { GoogleAuthProvider } from "firebase/auth";
export const googleProvider = new GoogleAuthProvider();

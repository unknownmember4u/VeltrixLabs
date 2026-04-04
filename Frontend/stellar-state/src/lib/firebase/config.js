import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAO4siAfY9drcv7j8HwA5fbI7IJhtz7Jvs",
  authDomain: "stellar-state.firebaseapp.com",
  projectId: "stellar-state",
  storageBucket: "stellar-state.firebasestorage.app",
  messagingSenderId: "319400708957",
  appId: "1:319400708957:web:9de6149513e3a6afa636b4"
};

// Initialize Firebase securely to avoid duplicate instance errors during Hot Reloads (Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

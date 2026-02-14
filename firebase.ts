// Firebase v9+ Modular SDK configuration
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Re-exporting Firebase functions to centralize module resolution and resolve "no exported member" errors
// Using direct export from syntax to ensure named exports are correctly identified by the compiler
export { onSnapshot, addDoc, deleteDoc } from "firebase/firestore";
export { onAuthStateChanged, signInAnonymously } from "firebase/auth";

// Firebase configuration for the SMAMI Digital Koko system
const firebaseConfig = {
  apiKey: "AIzaSyDxpft3kJkjTiBNLujEeDAYuE6qRBwIfgM",
  authDomain: "smami-koko-digital.firebaseapp.com",
  projectId: "smami-koko-digital",
  storageBucket: "smami-koko-digital.firebasestorage.app",
  messagingSenderId: "467380768572",
  appId: "1:467380768572:web:49d832f6b1f1235a629839",
  measurementId: "G-D80XKLVNN2"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const appId = 'smami-digital-koko-v1';

// Collection helper for co-curricular reports
export const getReportsCollection = () => 
  collection(db, 'artifacts', appId, 'public', 'data', 'reports');

// Document helper for a specific report instance
export const getReportDoc = (id: string) => 
  doc(db, 'artifacts', appId, 'public', 'data', 'reports', id);

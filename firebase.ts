
// Correct import paths for Firebase v9+ Modular SDK
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, onSnapshot, addDoc, deleteDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";

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

// Re-exporting Firebase functions to centralize module resolution and resolve "no exported member" errors
export { 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  onAuthStateChanged, 
  signInAnonymously 
};

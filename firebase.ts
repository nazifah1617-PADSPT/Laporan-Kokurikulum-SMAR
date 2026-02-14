
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDxpft3kJkjTiBNLujEeDAYuE6qRBwIfgM",
  authDomain: "smami-koko-digital.firebaseapp.com",
  projectId: "smami-koko-digital",
  storageBucket: "smami-koko-digital.firebasestorage.app",
  messagingSenderId: "467380768572",
  appId: "1:467380768572:web:49d832f6b1f1235a629839",
  measurementId: "G-D80XKLVNN2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const appId = 'smami-digital-koko-v1';

export const getReportsCollection = () => 
  collection(db, 'artifacts', appId, 'public', 'data', 'reports');

export const getReportDoc = (id: string) => 
  doc(db, 'artifacts', appId, 'public', 'data', 'reports', id);

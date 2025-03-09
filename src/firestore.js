import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  addDoc, 
  getDoc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  arrayRemove, 
  deleteDoc,
  where,
  query
} from "firebase/firestore"; 
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

// Your Firebase config here...
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { 
  db, 
  auth, 
  provider, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  addDoc, 
  getDoc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  arrayRemove, 
  signInWithPopup, 
  onAuthStateChanged, 
  deleteDoc,
  where,
  query 
};

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
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, browserSessionPersistence, setPersistence } from "firebase/auth";
import { getAnalytics, logEvent } from "firebase/analytics";

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

// iOS Safari has unreliable IndexedDB (Firebase's default storage).
// Only override persistence for Safari — Chrome/Firefox must keep the default
// (IndexedDB) so getRedirectResult can find the pending redirect state after OAuth.
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
if (isSafari) {
  setPersistence(auth, browserSessionPersistence).catch(() => {});
}

const provider = new GoogleAuthProvider();
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export {
  app,
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
  query,
  analytics,
  logEvent
};

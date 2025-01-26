import { initializeApp } from "firebase/app"; // Import initializeApp
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// 🔹 Your Firebase config (Replace with your actual Firebase config values)
const firebaseConfig = {
  apiKey: "AIzaSyDnqK-Vg7IIYiRaVChp5SKok67ivWicWm4",
  authDomain: "bg-jojo.firebaseapp.com",
  projectId: "bg-jojo",
  storageBucket: "bg-jojo.firebasestorage.app",
  messagingSenderId: "54933048786",
  appId: "1:54933048786:web:5ac5ce26988b539b860c0b",
  measurementId: "G-CYD44ZLF28"
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);  // Now the app is initialized with the config
const auth = getAuth(app);  // Initialize the authentication service

const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);  // Use the popup flow for sign-in
    const user = result.user;
    console.log("User signed in: ", user);
  } catch (error) {
    console.error("Error during sign-in: ", error.message);
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    console.log('User logged out');
  } catch (error) {
    console.error('Error logging out:', error.message);
  }
};

export { signInWithGoogle, auth };  // Export necessary methods and variables

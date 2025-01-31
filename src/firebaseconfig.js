import { initializeApp } from "firebase/app"; // Import initializeApp
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, updateProfile  } from "firebase/auth";
import { getDatabase } from 'firebase/database';

// 🔹 Your Firebase config (Replace with your actual Firebase config values)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};
// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);  // Now the app is initialized with the config
const auth = getAuth(app);  // Initialize the authentication service
const db = getDatabase(app);

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

export { signInWithGoogle, auth, db };  // Export necessary methods and variables


export const updateUserProfile = async (user, { displayName, photoURL }) => {
  try {
    await updateProfile(user, {
      displayName: displayName,
      photoURL: photoURL,
    });
    console.log('User profile updated!');
  } catch (error) {
    console.error('Error updating profile:', error);
  }
};
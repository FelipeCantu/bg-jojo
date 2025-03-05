import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore"; // Firestore imports
import { client } from "./sanityClient"; // Assuming sanityClient is correctly imported

// 🔹 Your Firebase config (Ensure environment variables are set)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// 🔹 Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Firebase Authentication
const db = getDatabase(app); // Realtime Database
const firestore = getFirestore(app); // Firestore instance

// 🔹 Google Sign-In
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("✅ User signed in: ", result.user);
    return result.user;
  } catch (error) {
    console.error("❌ Error during sign-in: ", error.message);
    throw new Error(error.message);
  }
};

// 🔹 Logout
const logOut = async () => {
  try {
    await signOut(auth);
    console.log("✅ User logged out");
  } catch (error) {
    console.error("❌ Error logging out:", error.message);
  }
};

// 🔹 Update User Profile in Firestore and Sanity
const updateUserProfile = async (user) => {
  const { displayName, photoURL, uid } = user;

  // Fallback if photoURL is not available
  const photo = photoURL || 'https://via.placeholder.com/150';

  const userData = {
    name: displayName,
    photoURL: photo,
    uid: uid,
    role: 'user',
  };

  try {
    // Update Firestore
    await setDoc(doc(firestore, 'users', uid), userData, { merge: true });

    // Update Sanity
    await client.createOrReplace({
      _type: 'user',
      _id: uid,
      name: displayName,
      photoURL: photo,
      uid: uid,
      role: 'user',
    });

    console.log('✅ User profile updated successfully!');
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    throw new Error("Error updating user profile");
  }
};

// 🔹 Fetch user data from Firestore
const getUserData = async (userId) => {
  if (!userId) {
    console.error("❌ Invalid user ID");
    return null;
  }

  try {
    const userRef = doc(firestore, "users", userId); // Firestore reference
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log("✅ User data retrieved:", userDoc.data());
      return userDoc.data();
    } else {
      console.warn("⚠️ User not found in Firestore");
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching user data:", error);
    return null;
  }
};

const submitArticle = async (articleData, user) => {
  try {
    if (!user || !user.uid) {
      console.error("❌ User UID is missing. Please sign in.");
      throw new Error("User UID is missing. Please sign in.");
    }

    // Check if user exists in Firestore
    const userRef = doc(firestore, "users", user.uid);
    const userDoc = await getDoc(userRef);

    // If the user doesn't exist, create a user in Firestore
    if (!userDoc.exists()) {
      console.warn("⚠️ User not found in Firestore, creating user...");
      const userData = {
        name: user.displayName,
        photoURL: user.photoURL || 'https://via.placeholder.com/150', // Default photo if not provided
        role: 'user', // Default role if not provided
      };

      // Save user to Firestore
      await setDoc(userRef, userData, { merge: true });
      console.log(`✅ User created in Firestore: ${user.displayName}`);
    }

    // Submit the article to Firestore
    const articleRef = doc(firestore, 'articles', articleData.id);
    await setDoc(articleRef, {
      title: articleData.title,
      content: articleData.content,
      mainImage: articleData.mainImage,
      authorId: user.uid, // Store the user UID as authorId
      authorName: user.displayName || 'Anonymous',
      authorImage: user.photoURL || 'https://via.placeholder.com/150',
      publishedDate: articleData.publishedDate,
      readingTime: articleData.readingTime,
      views: 0, // Initialize with 0 views
      comments: [], // Initialize comments as an empty array
    });

    console.log("✅ Article submitted to Firestore successfully");

    // Optionally, you can also submit the article to Sanity as you already have in your code
    const response = await client.createOrReplace({
      _type: 'article',
      title: articleData.title,
      content: articleData.content,
      mainImage: articleData.mainImage,
      author: {
        _type: 'reference',
        _ref: user.uid,  // Store the reference to the user UID in Sanity
      },
      authorName: user.displayName || 'Anonymous',
      authorImage: user.photoURL || 'https://via.placeholder.com/150',
      publishedDate: articleData.publishedDate,
      readingTime: articleData.readingTime,
    });

    console.log("✅ Article submitted to Sanity successfully", response);
    return response;
  } catch (error) {
    console.error("❌ Error submitting article to Firestore and Sanity:", error);
    throw new Error("Error submitting article to Firestore and Sanity");
  }
};

// ✅ Export Firebase utilities
export { app, signInWithGoogle, auth, db, firestore, updateUserProfile, logOut, getUserData, submitArticle };

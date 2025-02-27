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

  // Sanity user data
  const userData = {
    name: displayName,
    photoURL: photo,
    uid: uid,
    role: 'user', // Default role if not provided
  };

  // Save to Firestore
  await setDoc(doc(firestore, 'users', uid), userData, { merge: true });

  // Save to Sanity
  await client.createOrReplace({
    _type: 'user',
    _id: uid,
    name: displayName,
    photoURL: photo,
    uid: uid,
    role: 'user', // Default role, can be updated later
  });

  console.log('User profile updated successfully!');
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

// 🔹 Submit article to Sanity
const submitArticle = async (articleData, user) => {
  try {
    if (!user || !user.uid) {
      console.error("❌ User UID is missing. Please sign in.");
      throw new Error("User UID is missing. Please sign in.");
    }

    // Check if user exists in Firestore before submitting article to Sanity
    const userExists = await getUserData(user.uid);

    if (!userExists) {
      console.warn("⚠️ User not found in Firestore, creating user...");
      await setDoc(doc(firestore, "users", user.uid), { 
        name: user.displayName, 
        photoURL: user.photoURL,
        role: 'user', // Default role if not found
      }, { merge: true });
      console.log(`✅ User created in Firestore: ${user.displayName}`);
    }

    // Submit the article to Sanity
    const response = await client.create({
      _type: 'article',
      title: articleData.title,
      content: articleData.content,
      mainImage: articleData.mainImage,
      author: {
        _type: 'reference',
        _ref: user.uid,  // Reference to the user UID from Firebase
      },
      authorName: user.displayName || 'Anonymous',  // Author name (in case no name is available)
      authorImage: user.photoURL || '', // Save the author's photo URL from Firebase (if available)
      publishedDate: articleData.publishedDate,
      readingTime: articleData.readingTime,
    });

    console.log("✅ Article submitted successfully", response);
    return response;
  } catch (error) {
    console.error("❌ Error submitting article to Sanity:", error);
    throw new Error("Error submitting article to Sanity");
  }
};

// ✅ Export Firebase utilities
export { app, signInWithGoogle, auth, db, firestore, updateUserProfile, logOut, getUserData, submitArticle };

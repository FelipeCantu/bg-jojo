import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  increment,
  getDoc,
  collection,
  addDoc,
  arrayUnion // Added arrayUnion import
} from "firebase/firestore"; // Firestore imports

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

// 🔹 Update User Profile in Firestore
const updateUserProfile = async (user) => {
  const { displayName, photoURL, uid } = user;

  // Fallback if photoURL is not available
  const photo = photoURL || 'https://via.placeholder.com/150';

  // Save user data to Firestore
  const userData = {
    name: displayName,
    photoURL: photo,
    uid: uid,
    role: 'user', // Default role
  };

  // Save to Firestore
  await setDoc(doc(firestore, 'users', uid), userData, { merge: true });

  console.log('User profile updated successfully!');
};

// 🔹 Fetch user data from Firestore
const getUserData = async (userId) => {
  if (!userId) {
    console.error("❌ Invalid user ID");
    return null;
  }

  try {
    const userRef = doc(firestore, "users", userId);
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

// 🔹 Submit Article to Firestore
const submitArticle = async (articleData, user) => {
  try {
    if (!user || !user.uid) {
      console.error("❌ User UID is missing. Please sign in.");
      throw new Error("User UID is missing. Please sign in.");
    }

    // Submit the article to Firestore
    const articleRef = doc(firestore, 'articles', articleData.id);
    await setDoc(articleRef, {
      title: articleData.title,
      content: articleData.content,
      mainImage: articleData.mainImage,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorImage: user.photoURL || '',
      publishedDate: articleData.publishedDate,
      readingTime: articleData.readingTime,
      likes: 0,
      comments: [],
    });

    // Add the article ID to the user's articles array in the 'users' collection
    const userRef = doc(firestore, 'users', user.uid);
    await setDoc(userRef, {
      articles: arrayUnion(articleData.id), // Add the article ID to the 'articles' array
    }, { merge: true });

    console.log("✅ Article submitted to Firestore successfully");
  } catch (error) {
    console.error("❌ Error submitting article:", error);
    throw new Error("Error submitting article");
  }
};

// 🔹 Handle Likes
const handleLike = async (articleId) => {
  const articleRef = doc(firestore, 'articles', articleId);

  try {
    // Increment the likes count
    await updateDoc(articleRef, {
      likes: increment(1),
    });
    console.log("Like count incremented.");
  } catch (error) {
    console.error("Error incrementing like count:", error);
  }
};

// 🔹 Handle Add Comment
const handleAddComment = async (articleId, userId, commentText, userName, userImage) => {
  if (!articleId || !userId || !commentText.trim()) {
    console.error("Invalid input: Missing articleId, userId, or comment text.");
    return;
  }

  const commentsRef = collection(firestore, `articles/${articleId}/comments`);

  try {
    // Add the comment along with user information
    await addDoc(commentsRef, {
      userId,
      userName,  // Store the author's name with the comment
      userImage, // Store the author's image with the comment (optional)
      comment: commentText,
      timestamp: Date.now(),
    });
    console.log("Comment added successfully.");
  } catch (error) {
    console.error("Error posting comment:", error);
  }
};

// ✅ Export Firebase utilities
export {
  app,
  signInWithGoogle,
  auth,
  firestore,
  updateUserProfile,
  logOut,
  getUserData,
  submitArticle,
  handleLike,
  handleAddComment,
};

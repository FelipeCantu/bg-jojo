import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  arrayUnion,
  arrayRemove,
  runTransaction,
} from "firebase/firestore";
import { client } from "./sanityClient";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// Google Sign-In
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

// Log Out
const logOut = async () => {
  try {
    await signOut(auth);
    console.log("✅ User logged out");
  } catch (error) {
    console.error("❌ Error logging out:", error.message);
  }
};

// Update User Profile
const updateUserProfile = async (user) => {
  const { displayName, photoURL, uid } = user;
  const photo = photoURL || "https://via.placeholder.com/150";
  const userData = {
    name: displayName,
    photoURL: photo,
    uid: uid,
    role: "user",
  };

  try {
    await setDoc(doc(firestore, "users", uid), userData, { merge: true });
    console.log("✅ User profile updated successfully!");
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    throw new Error("Error updating user profile");
  }
};

// Get User Data
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

// Submit Article
const submitArticle = async (articleData, user) => {
  try {
    if (!user || !user.uid) {
      console.error("❌ User UID is missing. Please sign in.");
      throw new Error("User UID is missing. Please sign in.");
    }
    if (!articleData.title || !articleData.content || !articleData.mainImage) {
      console.error("❌ Missing article data: title, content, or mainImage.");
      throw new Error("Title, content, and mainImage are required.");
    }

    const articleRef = doc(firestore, "articles", articleData.id);
    const articleDoc = await getDoc(articleRef);

    if (articleDoc.exists()) {
      console.log("⚠️ Article already exists in Firestore. No update necessary.");
      return;
    }

    await setDoc(
      articleRef,
      {
        title: articleData.title,
        content: articleData.content,
        mainImage: articleData.mainImage,
        authorId: user.uid, // Store the author's UID in Firestore
        authorName: user.displayName || "Anonymous",
        authorImage: user.photoURL || "https://via.placeholder.com/150",
        publishedDate: articleData.publishedDate,
        readingTime: articleData.readingTime || 0,
        likes: 0,
        likedBy: [],
        views: 0, // Added for view tracking
      },
      { merge: true }
    );

    console.log("✅ Article submitted to Firestore successfully");

    const response = await client.createOrReplace({
      _type: "article",
      title: articleData.title,
      content: articleData.content,
      mainImage: articleData.mainImage,
      author: {
        _type: "reference",
        _ref: user.uid, // Store the reference to the user in Sanity
      },
      authorName: user.displayName || "Anonymous",
      authorImage: user.photoURL || "https://via.placeholder.com/150",
      publishedDate: articleData.publishedDate,
      readingTime: articleData.readingTime || 0,
    });

    console.log("✅ Article submitted to Sanity successfully", response);
    return response;
  } catch (error) {
    console.error("❌ Error submitting article to Firestore and Sanity:", error);
    throw new Error("Error submitting article to Firestore and Sanity");
  }
};

const handleLike = async (articleId) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("❌ User must be logged in to like.");
    return;
  }

  const articleRef = doc(firestore, "articles", articleId);
  console.log(`🔍 Attempting to like article: ${articleId} by user: ${user.uid}`);

  try {
    await runTransaction(firestore, async (transaction) => {
      const articleDoc = await transaction.get(articleRef);
      if (!articleDoc.exists()) {
        console.error("❌ Article not found.");
        throw new Error("Article not found.");
      }

      const articleData = articleDoc.data();
      const likedBy = articleData.likedBy || [];
      const alreadyLiked = likedBy.includes(user.uid);
      const newLikes = alreadyLiked ? articleData.likes - 1 : articleData.likes + 1;

      console.log(`🔄 Current likes: ${articleData.likes}, New likes: ${newLikes}`);
      console.log(`Liked by array before update: ${likedBy}`);

      // Directly update likes and likedBy fields
      transaction.update(articleRef, {
        likes: newLikes,
        likedBy: alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });

      console.log(`✅ Like updated successfully! New like count: ${newLikes}`);
    });
  } catch (error) {
    console.error("❌ Error updating like count:", error);
  }
};

// Handle Add Comment
const handleAddComment = async (articleId, userId, commentText, userName, userImage) => {
  if (!articleId || !userId || !commentText.trim()) {
    console.error("❌ Invalid input: Missing articleId, userId, or comment text.");
    return;
  }

  const commentsRef = collection(firestore, `articles/${articleId}/comments`);

  try {
    await addDoc(commentsRef, {
      userId,
      userName,
      userImage,
      comment: commentText,
      timestamp: Date.now(),
    });
    console.log("✅ Comment added successfully.");
  } catch (error) {
    console.error("❌ Error posting comment:", error);
  }
};

// Handle Increment Views
const incrementViews = async (articleId) => {
  const articleRef = doc(firestore, "articles", articleId);
  try {
    await runTransaction(firestore, async (transaction) => {
      const articleDoc = await transaction.get(articleRef);
      if (!articleDoc.exists()) {
        console.log("❌ Article not found.");
        throw new Error("Article not found.");
      }

      const articleData = articleDoc.data();
      const views = articleData.views ?? 0;
      const newViews = views + 1;
      console.log("New views count: ", newViews);

      // Update the article's views
      transaction.update(articleRef, { views: newViews });
      console.log(`✅ Views incremented successfully!`);
    });
  } catch (error) {
    console.error("❌ Error updating views count:", error);
  }
};

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
  incrementViews, // Export the incrementViews function
};
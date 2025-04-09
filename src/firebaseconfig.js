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
  updateDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  orderBy
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
    notificationPrefs: {
      comments: true,
      likes: true
    }
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
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        authorImage: user.photoURL || "https://via.placeholder.com/150",
        publishedDate: articleData.publishedDate,
        readingTime: articleData.readingTime || 0,
        likes: 0,
        likedBy: [],
        views: 0,
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
        _ref: user.uid,
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

// Enhanced handleLike with notifications
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

      // Update likes
      transaction.update(articleRef, {
        likes: newLikes,
        likedBy: alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });

      // Create notification if it's a new like
      if (!alreadyLiked) {
        const notificationRef = collection(firestore, "notifications");
        await addDoc(notificationRef, {
          type: "like",
          senderId: user.uid,
          receiverId: articleData.authorId,
          articleId: articleId,
          articleTitle: articleData.title,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      console.log(`✅ Like updated successfully! New like count: ${newLikes}`);
    });
  } catch (error) {
    console.error("❌ Error updating like count:", error);
  }
};

// Enhanced handleAddComment with notifications
const handleAddComment = async (articleId, commentText) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("❌ User must be logged in to comment.");
    return;
  }

  if (!articleId || !commentText.trim()) {
    console.error("❌ Invalid input: Missing articleId or comment text.");
    return;
  }

  try {
    // First get the article to find the author
    const articleRef = doc(firestore, "articles", articleId);
    const articleDoc = await getDoc(articleRef);
    
    if (!articleDoc.exists()) {
      console.error("❌ Article not found.");
      return;
    }

    const articleData = articleDoc.data();
    
    // Add comment to subcollection
    const commentsRef = collection(firestore, `articles/${articleId}/comments`);
    const commentRef = await addDoc(commentsRef, {
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      userImage: user.photoURL || "https://via.placeholder.com/150",
      comment: commentText,
      timestamp: serverTimestamp(),
      notificationCreated: false // Flag for notification tracking
    });

    // Create notification for the article author
    if (articleData.authorId !== user.uid) { // Don't notify yourself
      const notificationRef = collection(firestore, "notifications");
      await addDoc(notificationRef, {
        type: "comment",
        senderId: user.uid,
        receiverId: articleData.authorId,
        articleId: articleId,
        commentId: commentRef.id,
        articleTitle: articleData.title,
        commentText: commentText,
        read: false,
        createdAt: serverTimestamp()
      });
    }

    console.log("✅ Comment added and notification created successfully.");
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

      transaction.update(articleRef, { views: newViews });
      console.log(`✅ Views incremented successfully!`);
    });
  } catch (error) {
    console.error("❌ Error updating views count:", error);
  }
};

// Get real-time notifications
const getNotifications = (userId, callback) => {
  if (!userId) {
    console.error("❌ User ID is required to fetch notifications");
    return () => {};
  }

  const q = query(
    collection(firestore, "notifications"),
    where("receiverId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));
    callback(notifications);
  }, (error) => {
    console.error("❌ Error fetching notifications:", error);
  });

  return unsubscribe;
};

// Mark notifications as read
const markNotificationsRead = async (notificationIds) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated");

    const batch = notificationIds.map(id => {
      const ref = doc(firestore, "notifications", id);
      return updateDoc(ref, {
        read: true,
        readAt: serverTimestamp()
      });
    });

    await Promise.all(batch);
    return { success: true };
  } catch (error) {
    console.error("❌ Error marking notifications as read:", error);
    throw error;
  }
};

// Update notification preferences
const updateNotificationPrefs = async (userId, prefs) => {
  try {
    await updateDoc(doc(firestore, "users", userId), {
      notificationPrefs: prefs
    });
    console.log("✅ Notification preferences updated");
    return true;
  } catch (error) {
    console.error("❌ Error updating notification preferences:", error);
    throw error;
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
  incrementViews,
  getNotifications,
  markNotificationsRead,
  updateNotificationPrefs
};
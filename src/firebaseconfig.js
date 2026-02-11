import {
  app,
  db as firestore,
  auth,
  addDoc,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
} from "./firestore";
import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  runTransaction,
  serverTimestamp,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { client } from "./sanityClient";

// Google Sign-In
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error during sign-in:", error.message);
    throw new Error(error.message);
  }
};

// Log Out
const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error.message);
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
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error("Error updating user profile");
  }
};

// Get User Data
const getUserData = async (userId) => {
  if (!userId) {
    console.error("Invalid user ID");
    return null;
  }

  try {
    const userRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

// Submit Article
const submitArticle = async (articleData, user) => {
  try {
    if (!user || !user.uid) {
      throw new Error("User UID is missing. Please sign in.");
    }
    if (!articleData.title || !articleData.content || !articleData.mainImage) {
      throw new Error("Title, content, and mainImage are required.");
    }

    const articleRef = doc(firestore, "articles", articleData.id);
    const articleDoc = await getDoc(articleRef);

    if (articleDoc.exists()) {
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

    return response;
  } catch (error) {
    console.error("Error submitting article:", error);
    throw new Error("Error submitting article to Firestore and Sanity");
  }
};

// Enhanced handleLike with notifications
const handleLike = async (articleId) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("User must be logged in to like.");
    return;
  }

  const articleRef = doc(firestore, "articles", articleId);

  try {
    await runTransaction(firestore, async (transaction) => {
      const articleDoc = await transaction.get(articleRef);
      if (!articleDoc.exists()) {
        throw new Error("Article not found.");
      }

      const articleData = articleDoc.data();
      const likedBy = articleData.likedBy || [];
      const alreadyLiked = likedBy.includes(user.uid);
      const newLikes = alreadyLiked ? articleData.likes - 1 : articleData.likes + 1;

      transaction.update(articleRef, {
        likes: newLikes,
        likedBy: alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });

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
    });
  } catch (error) {
    console.error("Error updating like count:", error);
  }
};

// Enhanced handleAddComment with notifications
const handleAddComment = async (articleId, commentText) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("User must be logged in to comment.");
    return;
  }

  if (!articleId || !commentText.trim()) {
    console.error("Invalid input: Missing articleId or comment text.");
    return;
  }

  try {
    const articleRef = doc(firestore, "articles", articleId);
    const articleDoc = await getDoc(articleRef);

    if (!articleDoc.exists()) {
      console.error("Article not found.");
      return;
    }

    const articleData = articleDoc.data();

    const commentsRef = collection(firestore, `articles/${articleId}/comments`);
    const commentRef = await addDoc(commentsRef, {
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      userImage: user.photoURL || "https://via.placeholder.com/150",
      comment: commentText,
      timestamp: serverTimestamp(),
      notificationCreated: false
    });

    if (articleData.authorId !== user.uid) {
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
  } catch (error) {
    console.error("Error posting comment:", error);
  }
};

// Handle Increment Views
const incrementViews = async (articleId) => {
  const articleRef = doc(firestore, "articles", articleId);
  try {
    await runTransaction(firestore, async (transaction) => {
      const articleDoc = await transaction.get(articleRef);
      if (!articleDoc.exists()) {
        throw new Error("Article not found.");
      }

      const articleData = articleDoc.data();
      const views = articleData.views ?? 0;
      transaction.update(articleRef, { views: views + 1 });
    });
  } catch (error) {
    console.error("Error updating views count:", error);
  }
};

// Get real-time notifications
const getNotifications = (userId, callback) => {
  if (!userId) {
    console.error("User ID is required to fetch notifications");
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
    console.error("Error fetching notifications:", error);
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
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};

// Update notification preferences
const updateNotificationPrefs = async (userId, prefs) => {
  try {
    await updateDoc(doc(firestore, "users", userId), {
      notificationPrefs: prefs
    });
    return true;
  } catch (error) {
    console.error("Error updating notification preferences:", error);
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

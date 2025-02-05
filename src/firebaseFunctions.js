// src/firebaseFunctions.js
import { ref, push, set, update, increment, get } from 'firebase/database';
import { db } from './firebaseconfig';  // Assuming you've already set up Firebase (db is the reference to the database)

export const handleLike = async (articleId) => {
  const articleRef = ref(db, "articles/" + articleId);
  
  try {
    await update(articleRef, { likes: increment(1) });  
    console.log("Like count incremented.");
  } catch (error) {
    console.error("Error incrementing like count:", error);
  }
};

export const handleAddComment = async (articleId, userId, commentText) => {
  if (!articleId || !userId || !commentText.trim()) {
    console.error("Invalid input: Missing articleId, userId, or comment text.");
    return;
  }

  const commentsRef = ref(db, `articles/${articleId}/comments`);
  const newCommentRef = push(commentsRef);

  try {
    await set(newCommentRef, {
      userId,
      comment: commentText,
      timestamp: Date.now(),
    });
    console.log("Comment added successfully.");
  } catch (error) {
    console.error("Error posting comment:", error);
  }
};

// src/firebaseFunctions.js
import { ref, push, set, update, increment, get } from 'firebase/database';
import { db } from './firebaseconfig';  // Assuming you've already set up Firebase (db is the reference to the database)

export const handleLike = async (articleId) => {
  const articleRef = ref(db, 'articles/' + articleId);

  try {
    // Check if the article exists and if it has the 'likes' field
    const snapshot = await get(articleRef);
    if (snapshot.exists()) {
      // If 'likes' does not exist, initialize it to 0
      const likes = snapshot.val().likes || 0;
      update(articleRef, {
        likes: likes + 1,  // Increment likes
      });
    } else {
      console.error('Article not found');
    }
  } catch (error) {
    console.error("Error incrementing like count:", error);
  }
};

export const handleAddComment = (articleId, userId, commentText) => {
  const commentsRef = ref(db, 'articles/' + articleId + '/comments');

  // Create a new comment reference with a unique ID
  const newCommentRef = push(commentsRef);

  set(newCommentRef, {
    userId: userId,        // The user ID of the commenter
    comment: commentText,   // The actual comment text
    timestamp: Date.now(),  // Timestamp of when the comment was posted
  }).catch((error) => {
    console.error("Error posting comment:", error);
  });
};

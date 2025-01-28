// src/firebaseFunctions.js
import { ref, push, set, update, increment } from 'firebase/database';
import { db } from './firebaseconfig';  // Assuming you've already set up Firebase (db is the reference to the database)

export const handleLike = (articleId) => {
  const articleRef = ref(db, 'articles/' + articleId);
  
  // Increment the like count in the database
  update(articleRef, {
    likes: increment(1),  // Increment the likes by 1
  }).catch((error) => {
    console.error("Error incrementing like count:", error);
  });
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

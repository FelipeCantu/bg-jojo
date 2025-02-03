import React, { useState, useEffect } from "react";
import { db, collection, addDoc, getDocs } from "../firestore";
import styled from "styled-components";

const CommentSection = ({ articleId, user }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isCommentBoxExpanded, setIsCommentBoxExpanded] = useState(false);

  // Fetch the comments for this article
  useEffect(() => {
    const fetchComments = async () => {
      const commentsRef = collection(db, "articles", articleId, "comments");
      const commentsSnapshot = await getDocs(commentsRef);
      setComments(commentsSnapshot.docs.map((doc) => doc.data()));
    };

    fetchComments();
  }, [articleId]);

  // Submit a new comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const commentsRef = collection(db, "articles", articleId, "comments");
    await addDoc(commentsRef, {
      userName: user.name,
      userPhoto: user.photo,
      text: newComment,
      timestamp: new Date().toISOString(),
    });

    setNewComment("");
    setIsCommentBoxExpanded(false);

    // Refresh comment list
    const commentsSnapshot = await getDocs(commentsRef);
    setComments(commentsSnapshot.docs.map((doc) => doc.data()));
  };

  return (
    <CommentSectionContainer>
      <h3>Comments</h3>
      {user ? (
        <CommentForm onSubmit={handleCommentSubmit}>
          <CommentBox
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onFocus={() => setIsCommentBoxExpanded(true)}
            expanded={isCommentBoxExpanded}
          />
          {isCommentBoxExpanded && (
            <ButtonContainer>
              <CancelButton type="button" onClick={() => setIsCommentBoxExpanded(false)}>Cancel</CancelButton>
              <PublishButton type="submit">Publish</PublishButton>
            </ButtonContainer>
          )}
        </CommentForm>
      ) : (
        <p>Please log in to comment.</p>
      )}
      {comments.map((comment, index) => (
        <Comment key={index}>
          <UserPhoto src={comment.userPhoto} alt={comment.userName} />
          <CommentContent>
            <strong>{comment.userName}</strong>
            <p>{comment.text}</p>
          </CommentContent>
        </Comment>
      ))}
    </CommentSectionContainer>
  );
};

const CommentSectionContainer = styled.div`
  margin-top: 20px;
  margin-bottom: 50px;
`;

const CommentForm = styled.form`
  display: flex;
  flex-direction: column;
  margin-top: 15px;
  position: relative;
  margin-bottom: 50px;
`;

const CommentBox = styled.textarea`
  width: 100%;
  max-width: 100%;  /* Prevents the textarea from exceeding its container's width */
  height: ${(props) => (props.expanded ? "100px" : "40px")};
  transition: height 0.3s ease;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  position: relative;
  resize: vertical;  /* Allow vertical resizing only */
  box-sizing: border-box;
`;

const ButtonContainer = styled.div`
  position: absolute;
  bottom: -40px;
  right: 0;
  display: flex;
  gap: 10px;
`;

const PublishButton = styled.button`
  background-color: #024a47;
  color: white;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  transition: opacity 0.2s ease-in-out;

  &:hover {
    opacity: 0.8;
  }
`;

const CancelButton = styled.button`
  color: #024a47;
  padding: 5px 10px;
  border: none;
  cursor: pointer;
`;

const Comment = styled.div`
  display: flex;
  align-items: flex-start;
  margin-top: 20px;  
`;

const UserPhoto = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
`;

const CommentContent = styled.div`
  margin-left: 10px;
`;

export default CommentSection;

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import client from "../sanityClient";
import useCurrentUser from "../hook/useCurrentUser";

const CommentSection = ({ articleId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isCommentBoxExpanded, setIsCommentBoxExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { currentUser, loading: userLoading, error: userError } = useCurrentUser();

  useEffect(() => {
    if (!articleId) return;

    const fetchComments = async () => {
      try {
        setIsLoading(true);
        const result = await client.fetch(
          `*[_type == "comment" && article._ref == $articleId] | order(_createdAt desc){
            _id,
            text,
            _createdAt,
            "user": user->{
              _id,
              name,
              photoURL
            }
          }`,
          { articleId }
        );
        console.log("Fetched comments:", result); // Debugging
        setComments(result || []);
      } catch (err) {
        // ... error handling
      }
    };

    fetchComments();
  }, [articleId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    if (!currentUser?._id) {
      setError("Please log in to comment");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const newCommentData = {
        _type: "comment",
        text: newComment,
        article: {
          _type: "reference",
          _ref: articleId,
        },
        user: {
          _type: "reference",
          _ref: currentUser._id,
        },
      };

      const createdComment = await client.create(newCommentData);

      // Update the article's comments array
      await client
        .patch(articleId)
        .setIfMissing({ comments: [] })
        .append('comments', [{ _type: "reference", _ref: createdComment._id }])
        .commit();

      // Create notification if commenter is not the article author
      const article = await client.getDocument(articleId);
      if (article?.author?._ref && article.author._ref !== currentUser._id) {
        await client.create({
          _type: "notification",
          user: { _type: "reference", _ref: article.author._ref },
          type: "comment",
          message: `${currentUser.name} commented on your article "${article.title || ''}"`,
          link: `/article/${articleId}`,
          seen: false,
          sender: { _type: "reference", _ref: currentUser._id },
          relatedContent: { _type: "reference", _ref: articleId }
        });
      }

      setNewComment("");
      setIsCommentBoxExpanded(false);
      setComments(prev => [{
        ...createdComment,
        user: {
          _id: currentUser._id,
          name: currentUser.name,
          photo: currentUser.photo
        }
      }, ...prev]);

    } catch (err) {
      setError("Failed to post comment. Please try again.");
      console.error("Error submitting comment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser?._id) {
      setError("Please log in to delete comments");
      return;
    }

    try {
      setIsLoading(true);
      const commentToDelete = comments.find(c => c._id === commentId);

      if (!commentToDelete || commentToDelete.user?._id !== currentUser._id) {
        throw new Error("Unauthorized deletion attempt");
      }

      await client
        .patch(articleId)
        .unset([`comments[_ref=="${commentId}"]`])
        .commit();

      await client.delete(commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (err) {
      setError("Failed to delete comment");
      console.error("Error deleting comment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "";
    }
  };

  if (userLoading) {
    return <LoadingMessage>Loading user information...</LoadingMessage>;
  }

  if (userError) {
    return <ErrorMessage>{userError}</ErrorMessage>;
  }

  return (
    <CommentSectionContainer>
      <SectionTitle>Comments ({comments.length})</SectionTitle>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {currentUser?._id ? (
        <CommentForm onSubmit={handleCommentSubmit}>
          <CommentBox
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onFocus={() => setIsCommentBoxExpanded(true)}
            $isExpanded={isCommentBoxExpanded}
            disabled={isLoading}
          />

          {isCommentBoxExpanded && (
            <ButtonContainer>
              <CancelButton
                type="button"
                onClick={() => {
                  setIsCommentBoxExpanded(false);
                  setNewComment("");
                  setError(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </CancelButton>
              <PublishButton
                type="submit"
                disabled={!newComment.trim() || isLoading}
              >
                {isLoading ? 'Posting...' : 'Publish'}
              </PublishButton>
            </ButtonContainer>
          )}
        </CommentForm>
      ) : (
        <LoginPrompt>Please log in to comment.</LoginPrompt>
      )}

      {isLoading && !comments.length ? (
        <LoadingMessage>Loading comments...</LoadingMessage>
      ) : comments.length === 0 ? (
        <EmptyState>No comments yet. Be the first to comment!</EmptyState>
      ) : (
        <CommentsList>
          {comments.map((comment) => (
            <Comment key={comment._id}>
              <AvatarWrapper>
                {comment.user?.photoURL ? (
                  <UserPhoto
                    src={comment.user.photoURL}
                    alt={comment.user?.name || 'Anonymous'}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                ) : (
                  <DefaultAvatar>
                    {comment.user?.name?.charAt(0) || 'A'}
                  </DefaultAvatar>
                )}
              </AvatarWrapper>
              <CommentContent>
                <CommentHeader>
                  <UserName>{comment.user?.name || 'Anonymous'}</UserName>
                  <CommentDate>{formatDate(comment._createdAt)}</CommentDate>
                </CommentHeader>
                <CommentText>{comment.text}</CommentText>
              </CommentContent>
              {currentUser?._id === comment.user?._id && (
                <DeleteButton
                  onClick={() => handleDeleteComment(comment._id)}
                  disabled={isLoading}
                  aria-label="Delete comment"
                >
                  Delete
                </DeleteButton>
              )}
            </Comment>
          ))}
        </CommentsList>
      )}
    </CommentSectionContainer>
  );
};

// Styled Components (remain the same as before)
const CommentSectionContainer = styled.div`
  margin: 2rem 0;
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  color: #333;
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  margin-bottom: 1rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  font-size: 0.9rem;
`;

const CommentForm = styled.form`
  margin-bottom: 2rem;
`;

const CommentBox = styled.textarea`
  width: 100%;
  min-height: ${(props) => (props.$isExpanded ? "100px" : "60px")};
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;
  font-size: 0.95rem;

  &:focus {
    outline: none;
    border-color: #024a47;
    box-shadow: 0 0 0 2px rgba(2, 74, 71, 0.1);
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: flex-end;
`;

const PublishButton = styled.button`
  background-color: #024a47;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;

  &:hover:not(:disabled) {
    background-color: #01332f;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  background: none;
  color: #666;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: color 0.2s;
  font-size: 0.9rem;

  &:hover:not(:disabled) {
    color: #333;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const LoginPrompt = styled.p`
  color: #666;
  margin: 1rem 0;
  text-align: center;
`;

const LoadingMessage = styled.div`
  padding: 1.5rem;
  text-align: center;
  color: #666;
`;

const EmptyState = styled.div`
  padding: 1.5rem;
  text-align: center;
  color: #666;
  font-style: italic;
`;

const CommentsList = styled.div`
  margin-top: 1.5rem;
`;

const Comment = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
  position: relative;

  &:last-child {
    border-bottom: none;
  }
`;

const UserPhoto = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f0f0f0;
`;

const AvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const DefaultAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #4b5563;
  font-size: 16px;
`;

const CommentContent = styled.div`
  flex: 1;
  min-width: 0; /* Prevent overflow */
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const UserName = styled.strong`
  font-size: 0.95rem;
  color: #333;
`;

const CommentDate = styled.span`
  font-size: 0.8rem;
  color: #666;
`;

const CommentText = styled.p`
  margin: 0;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.95rem;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 0;
  background: none;
  border: none;
  color: #c62828;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #ffebee;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export default CommentSection;
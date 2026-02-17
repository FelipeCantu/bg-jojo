import React, { useState, useEffect, useCallback } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import styled, { keyframes } from "styled-components";
import { client, articleAPI } from "../sanityClient";
import useCurrentUser from "../hook/useCurrentUser";
import toast from 'react-hot-toast';

const ArticleCounters = ({ articleId, isDetailView = false }) => {
  const { currentUser } = useCurrentUser();
  const [commentCount, setCommentCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewCount, setViewCount] = useState(0);

  // Fetch all counter data
  const fetchCounters = useCallback(async () => {
    if (!articleId) return;

    setIsLoading(true);
    try {
      const data = await client.fetch(
        `*[_type == "article" && _id == $articleId][0]{
          views,
          likes,
          "likedBy": likedBy[]->_id,
          "commentCount": count(*[_type == "comment" && article._ref == ^._id])
        }`,
        { articleId }
      );

      setViewCount(data?.views || 0);
      setLikeCount(data?.likes || 0);
      setCommentCount(data?.commentCount || 0);
      setIsLiked(data?.likedBy?.includes(currentUser?.sanityId) || false);
    } catch (err) {
      console.error("Error loading counters:", err);
    } finally {
      setIsLoading(false);
    }
  }, [articleId, currentUser?.sanityId]);

  // Handle view increment - executed only once when component mounts
  useEffect(() => {
    if (!articleId || !isDetailView) return;

    const incrementView = async () => {
      try {
        const updatedViewCount = await articleAPI.incrementViews(articleId);
        setViewCount(updatedViewCount);
      } catch (err) {
        console.error("Failed to increment view count:", err);
      }
    };

    // Increment view immediately when component mounts
    incrementView();
  }, [articleId, isDetailView]); // Dependencies ensure this runs only once when component mounts

  // Initial data load
  useEffect(() => {
    fetchCounters();
  }, [fetchCounters]);

  // Handle like action
  const handleLike = async () => {
    if (!currentUser?.sanityId) {
      toast("Please sign in to like articles");
      return;
    }

    const prevLikeCount = likeCount;
    const prevIsLiked = isLiked;

    setIsLoading(true);
    try {
      const article = await client.fetch(
        `*[_type == "article" && _id == $articleId][0]{
          _id,
          likes,
          "likedByRefs": likedBy[]->_id,
          author->{ _id }
        }`,
        { articleId }
      );

      const alreadyLiked = article.likedByRefs?.includes(currentUser.sanityId);
      const newLikeCount = alreadyLiked ? likeCount - 1 : likeCount + 1;

      // Optimistic UI update
      setLikeCount(newLikeCount);
      setIsLiked(!alreadyLiked);

      await articleAPI.toggleLike(articleId, currentUser.sanityId);

      // Refresh data to ensure sync
      await fetchCounters();
    } catch (err) {
      // Rollback on error
      setLikeCount(prevLikeCount);
      setIsLiked(prevIsLiked);
      console.error("Like action failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && (!viewCount && !likeCount && !commentCount)) {
    return <LoadingSpinner />;
  }

  return (
    <CountersSection>
      <CounterItem>
        <EyeIcon />
        {viewCount} {viewCount === 1 ? "View" : "Views"}
      </CounterItem>
      <CounterItem>
        <CommentIcon />
        {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
      </CounterItem>
      <HeartIconWrapper
        onClick={handleLike}
        $liked={isLiked ? 1 : 0}
        disabled={isLoading}
        aria-label={isLiked ? "Unlike article" : "Like article"}
      >
        {isLiked ? (
          <HeartIconSolidStyled className="icon" />
        ) : (
          <HeartIconStyled className="icon" />
        )}
        <span>{likeCount}</span>
      </HeartIconWrapper>
    </CountersSection>
  );
};

// Styled Components
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(254, 165, 0, 0.3);
  border-radius: 50%;
  border-top: 3px solid var(--primary-color);
  animation: ${spin} 1s linear infinite;
  margin: 0 auto;
`;

const CountersSection = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  width: 100%;
  margin-top: 12px;
`;

const CounterItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-light);
`;

const EyeIcon = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: #666;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'%3E%3C/path%3E%3Ccircle cx='12' cy='12' r='3'%3E%3C/circle%3E%3C/svg%3E");
  mask-repeat: no-repeat;
`;

const CommentIcon = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: #666;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'%3E%3C/path%3E%3C/svg%3E");
  mask-repeat: no-repeat;
`;

const HeartIconWrapper = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 0;
  margin-left: auto;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    .icon {
      color: ${({ $liked }) => ($liked ? "var(--error-color)" : "var(--text-muted)")};
    }
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  span {
    font-size: 14px;
    color: ${({ $liked }) => ($liked ? "var(--error-color)" : "var(--text-muted)")};
    font-weight: ${({ $liked }) => ($liked ? "600" : "400")};
  }
`;

const HeartIconStyled = styled(HeartIcon)`
  width: 24px;
  height: 24px;
  color: var(--text-muted);
  transition: all 0.2s ease;
`;

const HeartIconSolidStyled = styled(HeartIconSolid)`
  width: 24px;
  height: 24px;
  color: var(--error-color);
  transition: all 0.2s ease;
`;

export default ArticleCounters;
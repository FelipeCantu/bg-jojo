import React, { useState, useEffect } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import styled, { keyframes } from "styled-components";
import { client } from "../sanityClient";
import useCurrentUser from "../hook/useCurrentUser";

const ArticleCounters = ({ articleId, isDetailView = false }) => {
  const { currentUser } = useCurrentUser();
  const [viewCount, setViewCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCountedView, setHasCountedView] = useState(false);

  // Track view count only in detail view
  useEffect(() => {
    const countView = async () => {
      if (!articleId || !isDetailView || hasCountedView) return;

      try {
        // Increment view count in Sanity
        await client
          .patch(articleId)
          .setIfMissing({ views: 0 })
          .inc({ views: 1 })
          .commit();

        // Update local state
        setViewCount(prev => prev + 1);
        setHasCountedView(true);
        
        // Store in sessionStorage to prevent duplicate counts
        sessionStorage.setItem(`viewCounted-${articleId}`, 'true');
      } catch (err) {
        console.error("Error counting view:", err);
      }
    };

    // Check if we've already counted this view in this session
    const alreadyCounted = sessionStorage.getItem(`viewCounted-${articleId}`) === 'true';
    if (alreadyCounted) {
      setHasCountedView(true);
    } else {
      countView();
    }
  }, [articleId, isDetailView, hasCountedView]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!articleId) return;

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
        console.error("Error loading article data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [articleId, currentUser?.sanityId]);

  // Handle like click (unchanged from your original)
  const handleLike = async () => {
    if (!currentUser?.sanityId) {
      alert("Please sign in to like articles");
      return;
    }

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

      if (!article) {
        throw new Error("Article not found");
      }

      const alreadyLiked = article.likedByRefs?.includes(currentUser.sanityId) || false;
      
      const updatedLikedBy = alreadyLiked
        ? (article.likedByRefs || []).filter(id => id && id !== currentUser.sanityId)
        : [...(article.likedByRefs || []).filter(Boolean), currentUser.sanityId];

      const likedByReferences = updatedLikedBy
        .filter(Boolean)
        .map(userId => ({
          _type: "reference",
          _ref: String(userId)
        }));

      const newLikeCount = alreadyLiked ? Math.max(0, likeCount - 1) : likeCount + 1;

      await client
        .patch(articleId)
        .set({ 
          likes: newLikeCount,
          likedBy: likedByReferences.length > 0 ? likedByReferences : []
        })
        .commit();

      if (!alreadyLiked && article.author?._id && article.author._id !== currentUser.sanityId) {
        await client.create({
          _type: "notification",
          user: { 
            _type: "reference", 
            _ref: String(article.author._id)
          },
          sender: { 
            _type: "reference", 
            _ref: String(currentUser.sanityId)
          },
          type: "like",
          relatedArticle: { 
            _type: "reference", 
            _ref: String(article._id)
          },
          seen: false,
          createdAt: new Date().toISOString()
        });
      }

      setLikeCount(newLikeCount);
      setIsLiked(!alreadyLiked);
    } catch (err) {
      console.error("Error updating like:", err);
      alert("Failed to update like. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <CountersSection>
      <CounterItem>
        <EyeIcon />
        {viewCount} Views
      </CounterItem>
      <CounterItem>
        <CommentIcon />
        {commentCount} Comments
      </CounterItem>
      <HeartIconWrapper 
        onClick={handleLike} 
        $liked={isLiked ? 1 : 0}
        disabled={isLoading}
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

// Styled components (unchanged from your original)
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 215, 0, 0.3);
  border-radius: 50%;
  border-top: 3px solid #ffd700;
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
  color: #666;
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
      color: ${({ $liked }) => ($liked ? "#dc2626" : "#9ca3af")};
    }
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  span {
    font-size: 14px;
    color: ${({ $liked }) => ($liked ? "#dc2626" : "#6b7280")};
    font-weight: ${({ $liked }) => ($liked ? "600" : "400")};
  }
`;

const HeartIconStyled = styled(HeartIcon)`
  width: 24px;
  height: 24px;
  color: #9ca3af;
  transition: all 0.2s ease;
`;

const HeartIconSolidStyled = styled(HeartIconSolid)`
  width: 24px;
  height: 24px;
  color: #dc2626;
  transition: all 0.2s ease;
`;

export default ArticleCounters;
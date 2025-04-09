import React, { useState, useEffect } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import styled from "styled-components";
import { client } from "../sanityClient";
import useCurrentUser from "../hook/useCurrentUser";

const ArticleCounters = ({ articleId }) => {
  const { currentUser } = useCurrentUser();
  const [viewCount, setViewCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Handle like click
  const handleLike = async () => {
    if (!currentUser?.sanityId) {
      alert("Please sign in to like articles");
      return;
    }
  
    setIsLoading(true);
    try {
      // 1. Fetch current article data
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
  
      // 2. Check if current user already liked
      const alreadyLiked = article.likedByRefs?.includes(currentUser.sanityId) || false;
      
      // 3. Prepare the new likedBy array with proper reference format
      const updatedLikedBy = alreadyLiked
        ? (article.likedByRefs || []).filter(id => id && id !== currentUser.sanityId)
        : [...(article.likedByRefs || []).filter(Boolean), currentUser.sanityId];
  
      // 4. Convert to Sanity references with null checks
      const likedByReferences = updatedLikedBy
        .filter(Boolean) // Remove any null/undefined values
        .map(userId => ({
          _type: "reference",
          _ref: String(userId) // Ensure string conversion
        }));
  
      // 5. Calculate new like count
      const newLikeCount = alreadyLiked ? Math.max(0, likeCount - 1) : likeCount + 1;
  
      // 6. Update the article
      await client
        .patch(articleId)
        .set({ 
          likes: newLikeCount,
          likedBy: likedByReferences.length > 0 ? likedByReferences : [] // Ensure array
        })
        .commit();
  
      // 7. Create notification if needed (with null checks)
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
  
      // 8. Update local state
      setLikeCount(newLikeCount);
      setIsLiked(!alreadyLiked);
    } catch (err) {
      console.error("Error updating like:", err);
      alert("Failed to update like. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <CountersSection>
      <CounterItem>{viewCount} Views</CounterItem>
      <CounterItem>{commentCount} Comments</CounterItem>
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

// Styled Components (updated with loading state)
const CountersSection = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  width: 100%;
  margin-top: 12px;
`;

const CounterItem = styled.div`
  font-size: 14px;
  color: #666;
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
import React, { useState, useEffect, useCallback } from "react";
import { HeartIcon } from "@heroicons/react/24/outline"; 
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid"; 
import styled from "styled-components";
import { db, collection, doc, getDocs, getDoc, updateDoc, increment, arrayUnion, arrayRemove, setDoc } from "../firestore";

const ArticleCounters = ({ articleId, user }) => {
  const [viewCount, setViewCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Function to increment views
  const incrementViewCount = useCallback(async () => {
    if (!articleId) return;

    const articleRef = doc(db, "articles", articleId);

    try {
      const articleSnapshot = await getDoc(articleRef);

      if (articleSnapshot.exists()) {
        await updateDoc(articleRef, { views: increment(1) });
      } else {
        await setDoc(articleRef, { views: 1 }); // Create article with initial view count
      }
    } catch (error) {
      console.error("❌ Error incrementing view count:", error);
    }
  }, [articleId]);

  useEffect(() => {
    if (!articleId) return;

    const fetchCounts = async () => {
      try {
        const articleRef = doc(db, "articles", articleId);
        const articleSnapshot = await getDoc(articleRef);

        if (articleSnapshot.exists()) {
          const articleData = articleSnapshot.data();
          setViewCount(articleData.views || 0);
          setLikeCount(articleData.likeCount || 0);
          setIsLiked(articleData.likedBy?.includes(user?.uid) || false);

          const commentsRef = collection(db, "articles", articleId, "comments");
          const commentsSnapshot = await getDocs(commentsRef);
          setCommentCount(commentsSnapshot.size);
        }
      } catch (error) {
        console.error("❌ Error fetching article data:", error);
      }
    };

    fetchCounts();
    incrementViewCount();
  }, [articleId, user, incrementViewCount]); // Ensure incrementViewCount is included

  // Handle likes
  const toggleLike = async () => {
    if (!user) return;

    try {
      const articleRef = doc(db, "articles", articleId);
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);

      await updateDoc(articleRef, {
        likeCount: newIsLiked ? increment(1) : increment(-1),
        likedBy: newIsLiked ? arrayUnion(user.uid) : arrayRemove(user.uid),
      });

      setLikeCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
    } catch (error) {
      console.error("❌ Error updating like count:", error);
    }
  };

  return (
    <CountersSection>
      <CounterItem>{viewCount} Views</CounterItem>
      <CounterItem>{commentCount} Comments</CounterItem>
      <HeartIconWrapper onClick={toggleLike} liked={isLiked}>
        {isLiked ? <HeartIconSolidStyled /> : <HeartIconStyled />}
        <span>{likeCount}</span>
      </HeartIconWrapper>
    </CountersSection>
  );
};

const CountersSection = styled.div`
  font-size: 16px;
  color: #666;
  margin-top: 2px;
  display: flex;
  gap: 20px;
  align-items: center;
  width: 100%;
`;

const CounterItem = styled.h4`
  margin: 0;
`;

const HeartIconWrapper = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 20px;
  margin-left: auto;
  
  span {
    color: red;
  }
`;

const HeartIconStyled = styled(HeartIcon)`
  width: 24px;
  height: 24px;
  color: red;
  padding: 5px;
  transition: all 0.3s ease;
`;

const HeartIconSolidStyled = styled(HeartIconSolid)`
  width: 24px;
  height: 24px;
  color: red;
  padding: 5px;
  transition: all 0.3s ease;
`;

export default ArticleCounters;

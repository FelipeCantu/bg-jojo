import React, { useState, useEffect, useCallback } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import styled from "styled-components";
import { doc, getDoc, setDoc, increment, arrayUnion, arrayRemove, collection, getDocs, runTransaction } from "firebase/firestore";
import { auth, firestore } from "../firebaseconfig";
import useCurrentUser from "../hook/useCurrentUser";

const ArticleCounters = ({ articleId }) => {
  const { currentUser, loading, error } = useCurrentUser();
  const [viewCount, setViewCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Increment view count function
  const incrementViewCount = useCallback(async () => {
    if (!articleId) return;

    const articleRef = doc(firestore, "articles", articleId);

    try {
      await runTransaction(firestore, async (transaction) => {
        const articleDoc = await transaction.get(articleRef);

        if (!articleDoc.exists()) {
          transaction.set(articleRef, { views: 1, likes: 0, likedBy: [] });
        } else {
          transaction.update(articleRef, { views: increment(1) });
        }
      });
    } catch (err) {
      console.error("❌ Error incrementing view count:", err);
    }
  }, [articleId]);

  // Fetch view, like, comment counts, and liked status
  useEffect(() => {
    const fetchCounts = async () => {
      if (!articleId || loading) return;
  
      try {
        const articleRef = doc(firestore, "articles", articleId);
        const articleSnapshot = await getDoc(articleRef);
  
        if (!articleSnapshot.exists()) {
          await setDoc(articleRef, { views: 0, likes: 0, likedBy: [] });
        }
  
        const articleData = articleSnapshot.data();
        setViewCount(articleData?.views || 0);
        setLikeCount(articleData?.likes || 0);
        setIsLiked(articleData?.likedBy?.includes(currentUser?.uid) || false);
  
        const commentsRef = collection(firestore, "articles", articleId, "comments");
        const commentsSnapshot = await getDocs(commentsRef);
        setCommentCount(commentsSnapshot.size);
      } catch (err) {
        console.error("❌ Error fetching article data:", err);
      }
    };
  
    if (articleId && !loading) {
      fetchCounts();
    }
  }, [articleId, currentUser, loading]);

  // Increment view count on first load
  useEffect(() => {
    if (articleId && !loading) {
      incrementViewCount();
    }
  }, [articleId, loading, incrementViewCount]);

  // Handle like click
  const handleLike = async (articleId) => {
    const user = auth.currentUser;
    if (!user) {
      alert("You need to sign in to like this article!");
      return;
    }

    try {
      const articleRef = doc(firestore, "articles", articleId);

      await runTransaction(firestore, async (transaction) => {
        const articleDoc = await transaction.get(articleRef);
        if (!articleDoc.exists()) {
          console.log("❌ Article not found.");
          return;
        }

        const articleData = articleDoc.data();
        const likedBy = articleData?.likedBy || [];
        const alreadyLiked = likedBy.includes(user.uid);
        const newLikeStatus = !alreadyLiked;

        transaction.update(articleRef, {
          likes: newLikeStatus ? increment(1) : increment(-1),
          likedBy: newLikeStatus ? arrayUnion(user.uid) : arrayRemove(user.uid),
        });

        setIsLiked(newLikeStatus);
        setLikeCount((prevCount) => (newLikeStatus ? prevCount + 1 : prevCount - 1));
      });
    } catch (err) {
      console.error("❌ Error updating like count:", err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <CountersSection>
      <CounterItem>{viewCount} Views</CounterItem>
      <CounterItem>{commentCount} Comments</CounterItem>
      <HeartIconWrapper onClick={() => handleLike(articleId)} $liked={isLiked ? 1 : 0}>
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
    color: ${({ $liked }) => ($liked ? "red" : "gray")};
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

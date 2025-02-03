import React, { useState, useEffect } from "react";
import { HeartIcon } from "@heroicons/react/24/outline"; // Import outline heart icon
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid"; // Import solid heart icon
import styled from "styled-components";
import { db, collection, doc, getDocs, getDoc, updateDoc, increment, arrayUnion, arrayRemove } from "../firestore";

const ArticleCounters = ({ articleId, user }) => {
  const [viewCount, setViewCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!articleId) return;

      const articleRef = doc(db, "articles", articleId);
      const articleSnapshot = await getDoc(articleRef);
      if (articleSnapshot.exists()) {
        const articleData = articleSnapshot.data();
        setViewCount(articleData.viewCount || 0);
        setLikeCount(articleData.likeCount || 0);
        setIsLiked(articleData.likedBy && articleData.likedBy.includes(user?.uid)); // Check if the user already liked the article
        const commentsRef = collection(db, "articles", articleId, "comments");
        const commentsSnapshot = await getDocs(commentsRef);
        setCommentCount(commentsSnapshot.size); // Set the comment count
      }
    };

    fetchCounts();
  }, [articleId, user]);

  const toggleLike = async () => {
    if (!user) return;

    const articleRef = doc(db, "articles", articleId);
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);

    // Update the like count and likedBy field
    await updateDoc(articleRef, {
      likeCount: newIsLiked ? increment(1) : increment(-1),
      likedBy: newIsLiked ? arrayUnion(user.uid) : arrayRemove(user.uid),
    });
    setLikeCount((prev) => (newIsLiked ? prev + 1 : prev - 1)); // Update local like count
  };

  return (
    <CountersSection>
      <CounterItem>{viewCount} Views</CounterItem>
      <CounterItem>{commentCount} Comments</CounterItem>
      <HeartIconWrapper onClick={toggleLike} liked={isLiked}>
        <span>{likeCount}</span>
        {isLiked ? <HeartIconSolidStyled /> : <HeartIconStyled />}
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
  width: 100%; /* Ensure it spans the full width of the container */
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
  margin-left: auto; /* Push the heart icon to the far right */
  
  span {
    color: ${(props) => (props.liked ? "red" : "#666")};
  }
`;

const HeartIconStyled = styled(HeartIcon)`
  width: 24px;
  height: 24px;
  color: #666;
  padding: 5px;
  transition: all 0.3s ease;
`;

const HeartIconSolidStyled = styled(HeartIconSolid)`
  width: 24px;
  height: 24px;
  color: red;
`;

export default ArticleCounters;

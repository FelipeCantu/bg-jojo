import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchArticleById } from "../sanityClient";
import { urlFor } from "../sanityClient";
import BlockContent from "@sanity/block-content-to-react";
import styled from "styled-components";
import ArticleCounters from "./ArticleCounters"; // Import the ArticleCounters component
import CommentSection from "./CommentSection";
import { auth, onAuthStateChanged } from '../firestore';

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [user, setUser] = useState(null);

  // Fetch the article data
  useEffect(() => {
    const getArticle = async () => {
      const fetchedArticle = await fetchArticleById(id);
      setArticle(fetchedArticle);
    };

    getArticle();

    // Listen for the authentication state to get the current user
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ? {
        name: currentUser.displayName,
        photo: currentUser.photoURL || "https://via.placeholder.com/40",
        uid: currentUser.uid,
      } : null);
    });
  }, [id]);

  if (!article) return <p>Loading...</p>;

  return (
    <ArticleDetailContainer>
      <Title>{article.title}</Title>
      {article.image && <ArticleImage src={urlFor(article.image).url()} alt={article.title} />}
      {article.authorImage && (
        <AuthorInfo>
          <AuthorImage src={urlFor(article.authorImage).url()} alt={article.authorName} />
          <AuthorName>{article.authorName}</AuthorName>
        </AuthorInfo>
      )}
      <PublishedDate>Published on: {new Date(article.publishedDate).toLocaleDateString()}</PublishedDate>
      <ReadingTime>Estimated Reading Time: {article.readingTime} minutes</ReadingTime>
      {article.content && Array.isArray(article.content) && (
        <BlockContent blocks={article.content} serializers={{ types: {} }} />
      )}
      <Divider />
      
      {/* Reusable Counters Component */}
      <ArticleCounters articleId={id} user={user} />

      {/* Reusable Comment Section Component */}
      <CommentSection articleId={id} user={user} />
    </ArticleDetailContainer>
  );
};

const ArticleDetailContainer = styled.div`
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 20px;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
`;

const AuthorImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 10px;
`;

const Divider = styled.hr`
  margin-top: 20px;
  border: 1px solid #ddd;
  margin-bottom: 0;
`;

const PublishedDate = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 5px;
`;

const ReadingTime = styled.p`
  font-size: 14px;
  color: #777;
  margin-top: 5px;
`;

const ArticleImage = styled.img`
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 10px;
  margin-top: 20px;
`;

const AuthorName = styled.p`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

export default ArticleDetail;

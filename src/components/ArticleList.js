import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchArticles } from '../sanityClient';
import { urlFor } from '../sanityClient';
import styled from 'styled-components';

const ArticleList = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const getArticles = async () => {
      const fetchedArticles = await fetchArticles();
      setArticles(fetchedArticles);
    };
    getArticles();
  }, []);

  if (articles.length === 0) return <p>Loading...</p>;

  return (
    <ArticleListContainer>
      <Title>Articles</Title>
      {articles.map((article) => (
        <ArticleItem key={article._id}>
          {/* Display article image */}
          {article.image && <ArticleImage src={urlFor(article.image).url()} alt={article.title} />}

          <ArticleTitle to={`/article/${article._id}`}>{article.title}</ArticleTitle>

          {/* Display Author's Image and Name */}
          {article.authorImage && (
            <AuthorInfo>
              <AuthorImage src={urlFor(article.authorImage).url()} alt={article.authorName} />
              <AuthorName>{article.authorName}</AuthorName>
            </AuthorInfo>
          )}

          {/* Display Estimated Reading Time */}
          <ReadingTime>Estimated Reading Time: {article.readingTime} minutes</ReadingTime>
        </ArticleItem>
      ))}
    </ArticleListContainer>
  );
};


// Container for the entire article list
const ArticleListContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

// Title for the list of articles
const Title = styled.h1`
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 40px;
  color: #333;
`;

// The wrapper for individual articles
const ArticleItem = styled.div`
  background: #fff;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
  }
`;

// The article image styling
const ArticleImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin-bottom: 15px;
`;

// Author info section (author's image and name)
const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  margin-top: 10px;
`;

const AuthorImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
`;

const AuthorName = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #555;
`;

// Article title link styling
const ArticleTitle = styled(Link)`
  font-size: 1.8rem;
  font-weight: 700;
  color: #007bff;
  text-decoration: none;
  margin-bottom: 10px;

  &:hover {
    text-decoration: underline;
  }
`;

// Estimated reading time styling
const ReadingTime = styled.p`
  font-size: 1rem;
  color: #888;
  margin-top: 5px;
`;

export default ArticleList;

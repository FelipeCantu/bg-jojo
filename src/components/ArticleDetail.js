import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchArticleById } from '../sanityClient'; // Fetch article data
import { urlFor } from '../sanityClient'; // Get image URLs
import BlockContent from '@sanity/block-content-to-react'; // Render Sanity Portable Text
import styled from 'styled-components';

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);

  useEffect(() => {
    const getArticle = async () => {
      const fetchedArticle = await fetchArticleById(id);
      setArticle(fetchedArticle);
    };
    getArticle();
  }, [id]);

  if (!article) return <p>Loading...</p>;

  return (
    <ArticleDetailContainer>
      <Title>{article.title}</Title>

      {/* Display article image */}
      {article.image && (
        <ArticleImage src={urlFor(article.image).url()} alt={article.title} />
      )}

      {/* Display Author's Image and Name */}
      {article.authorImage && (
        <AuthorInfo>
          <AuthorImage src={urlFor(article.authorImage).url()} alt={article.authorName} />
          <AuthorName>{article.authorName}</AuthorName>
        </AuthorInfo>
      )}

      {/* Display Published Date */}
      {article.publishedDate && (
        <PublishedDate>Published on: {new Date(article.publishedDate).toLocaleDateString()}</PublishedDate>
      )}

      {/* Display Estimated Reading Time */}
      <ReadingTime>Estimated Reading Time: {article.readingTime} minutes</ReadingTime>

      {/* Render the Portable Text content with serializers */}
      {article.content && (
        <BlockContent blocks={article.content} serializers={serializers} />
      )}
    </ArticleDetailContainer>
  );
};

// 🔹 Define Custom Serializers for BlockContent
const serializers = {
  types: {
    block: (props) => <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{props.children}</p>,
  },
};

// Styled Components for the article detail page
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

const ArticleImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
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

const AuthorName = styled.span`
  font-size: 1.2rem;
  font-weight: 600;
  color: #555;
`;

const PublishedDate = styled.p`
  font-size: 1rem;
  color: #888;
  margin-top: 10px;
`;

const ReadingTime = styled.p`
  font-size: 1rem;
  color: #888;
`;

export default ArticleDetail;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchArticles } from '../sanityClient';
import { urlFor } from '../sanityClient';
import ArticleCounters from './ArticleCounters';
import ArticleForm from './ArticleForm';
import styled from 'styled-components';

const ArticleList = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getArticles = async () => {
    try {
      const fetchedArticles = await fetchArticles();
      setArticles(fetchedArticles);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError('Failed to load articles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getArticles();
  }, []);

  if (loading) return <LoadingMessage>Loading articles...</LoadingMessage>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <ArticleContainer>
      <ArticleGrid>
        {articles.map((article) => (
          <LinkWrapper to={`/article/${article._id}`} key={article._id}>
            <ArticleCard>
              <TopLeftSection>
                <UserInfo>
                  <UserImage
                    src={article.author?.photoURL || "https://via.placeholder.com/40"}
                    alt={article.author?.name || "Anonymous"}
                  />
                  <UserName>{article.author?.name || "Anonymous"}</UserName>
                </UserInfo>
                <DateAndTime>
                  {article.publishedDate && (
                    <PublishedDate>{new Date(article.publishedDate).toLocaleDateString()}</PublishedDate>
                  )}
                  {article.publishedDate && article.readingTime && <Dot>·</Dot>}
                  <ReadingTime>
                    Estimated Reading Time: {article.readingTime || 'N/A'} minutes
                  </ReadingTime>
                </DateAndTime>
              </TopLeftSection>

              {/* Apply styles to the image */}
              {article.mainImage?.asset ? (
                <ArticleImage src={urlFor(article.mainImage.asset).url()} alt={article.title} />
              ) : (
                <ArticleImage src="https://via.placeholder.com/350x250" alt="Fallback content for this article" />
              )}

              <Divider />
              <ArticleTitle>{article.title || 'No Title'}</ArticleTitle>

              <ArticleCounters articleId={article._id} />
            </ArticleCard>
          </LinkWrapper>
        ))}
      </ArticleGrid>

      <ArticleForm onArticleSubmitted={getArticles} />
    </ArticleContainer>
  );
};

// Styled Components (updated for image styling)
const ArticleContainer = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  background: #feedfd;
  padding-right: 2.5rem;
  padding-left: 0;
`;

const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 100px;
  padding: 30px;
`;

const LinkWrapper = styled(Link)`
  text-decoration: none;
`;

const ArticleCard = styled.div`
  background: #f8d8a5;
  padding: 30px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  transition: transform 0.3s ease;
  height: 550px;
  width: 100%;
  overflow: hidden;
  margin-bottom: 20px;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.2);
  }
`;

const TopLeftSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 15px;
  width: 100%;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const UserName = styled.span`
  font-size: 1rem;
  font-weight: bold;
  color: #333;
`;

const DateAndTime = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PublishedDate = styled.span`
  font-size: 0.9rem;
  color: #666;
`;

const Dot = styled.span`
  font-size: 1rem;
  color: #666;
`;

const ReadingTime = styled.span`
  font-size: 0.9rem;
  color: #555;
`;

const ArticleImage = styled.img`
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 15px;
`;

const Divider = styled.div`
  width: 100%;
  height: 2px;
  background: black;
  margin: 10px 0;
`;

const ArticleTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 500;
  color: black;
  margin: 15px 0;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const LoadingMessage = styled.p`
  font-size: 1.2rem;
  color: #555;
  text-align: center;
`;

const ErrorMessage = styled.p`
  font-size: 1.2rem;
  color: red;
  text-align: center;
`;

export default ArticleList;

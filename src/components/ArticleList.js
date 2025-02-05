import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchArticles } from '../sanityClient'; // Fetch articles from Sanity
import { urlFor } from '../sanityClient'; // URL function for Sanity images
import ArticleCounters from './ArticleCounters'; // Import the ArticleCounters component
import styled from 'styled-components';

const ArticleList = ({ user }) => {
  const [articles, setArticles] = useState([]);
  
  useEffect(() => {
    const getArticles = async () => {
      const fetchedArticles = await fetchArticles(); // Fetching articles from Sanity
      setArticles(fetchedArticles);
    };
    getArticles();
  }, []);

  if (articles.length === 0) return <p>Loading...</p>;

  return (
    <ArticleContainer>
      <ArticleGrid>
        {articles.map((article) => (
          <LinkWrapper to={`/article/${article._id}`} key={article._id}>
            <ArticleCard>
              <TopLeftSection>
                {article.authorImage && (
                  <AuthorInfo>
                    <AuthorImage src={urlFor(article.authorImage).url()} alt={article.authorName} />
                    <AuthorName>{article.authorName}</AuthorName>
                  </AuthorInfo>
                )}

                <DateAndTime>
                  {article.publishedDate && (
                    <PublishedDate>{new Date(article.publishedDate).toLocaleDateString()}</PublishedDate>
                  )}
                  {article.publishedDate && article.readingTime && <Dot>·</Dot>}
                  {article.readingTime ? (
                    <ReadingTime>Estimated Reading Time: {article.readingTime} minutes</ReadingTime>
                  ) : (
                    <ReadingTime>Estimated Reading Time: N/A</ReadingTime>
                  )}
                </DateAndTime>
              </TopLeftSection>

              {/* Article Image */}
              {article.image && (
                <ArticleImageWrapper>
                  <ArticleImage src={urlFor(article.image).url()} alt={article.title} />
                </ArticleImageWrapper>
              )}

              <Divider />
              <ArticleTitle>{article.title}</ArticleTitle>

              {/* Add the ArticleCounters Component here */}
              <ArticleCounters articleId={article._id} user={user} />
            </ArticleCard>
          </LinkWrapper>
        ))}
      </ArticleGrid>
    </ArticleContainer>
  );
};

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

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AuthorImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const AuthorName = styled.span`
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

const ArticleImageWrapper = styled.div`
  width: 100%;
  height: 250px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ArticleImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
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

  @media (max-width: 768px) {
    font-size: 1.5rem; /* Tablets */
  }

  @media (max-width: 480px) {
    font-size: 1.2rem; /* Mobile devices */
  }
`;

export default ArticleList;

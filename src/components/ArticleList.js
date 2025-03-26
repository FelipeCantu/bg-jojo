import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchArticles } from '../sanityClient';
import { urlFor } from '../sanityClient';
import ArticleCounters from './ArticleCounters';
import CreateArticleButton from './CreateArticleButton';
import styled from 'styled-components';
import { FaSearch } from 'react-icons/fa';
import LoadingContainer from './LoadingContainer';

const ArticleList = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const getArticles = async () => {
      try {
        const fetchedArticles = await fetchArticles();
        setArticles(fetchedArticles);
        setFilteredArticles(fetchedArticles);
      } catch (err) {
        console.error("Error fetching articles:", err);
        setError('Failed to load articles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    getArticles();
  }, []);

  useEffect(() => {
    setFilteredArticles(
      articles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, articles]);

  if (loading) return <LoadingContainer message="Fetching latest articles..." size="large" spinnerColor="#fea500" textColor="#555" />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <ArticleContainer>
      <SearchContainer>
        <SearchIcon onClick={() => setShowSearch(!showSearch)} />
        <SearchBar show={showSearch}
          type="text"
          placeholder="Search article..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchContainer>

      <CreateArticleButton />
      {filteredArticles.length === 0 ? (
        <NoArticlesMessage>No articles found</NoArticlesMessage>
      ) : (
        <ArticleGrid>
          {filteredArticles.map((article) => (
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

                {article.mainImage?.asset ? (
                  <ArticleImage src={urlFor(article.mainImage.asset).url()} alt={article.title} />
                ) : (
                  <ArticleImage src="https://via.placeholder.com/350x250" alt="Fallback content for this article" />
                )}

                <Divider />
                <ArticleTitle>
                  {article.title.length > 50
                    ? `${article.title.substring(0, 50)}...` // Truncate after 50 characters
                    : article.title}
                </ArticleTitle>
                <ArticleCounters articleId={article._id} />
              </ArticleCard>
            </LinkWrapper>
          ))}
        </ArticleGrid>
      )}
    </ArticleContainer>
  );
};


const ErrorMessage = styled.p`
  font-size: 1.2rem;
  color: red;
  text-align: center;
`;

const NoArticlesMessage = styled.p`
  font-size: 1.2rem;
  color: #555;
  text-align: center;
`;

const ArticleContainer = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  background: #feedfd;
  padding: 30px;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 40px; /* Increased margin to add spacing */
  position: relative; /* Changed to relative to avoid overlap */
`;

const SearchIcon = styled(FaSearch)`
  cursor: pointer;
  font-size: 1.5rem;
  margin-right: 10px;
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.2);
  }
`;

const SearchBar = styled.input`
  display: ${({ show }) => (show ? 'block' : 'none')};
  padding: 10px;
  font-size: 1rem;
  border: none;
  border-bottom: 2px solid #ccc;
  background: transparent;
  outline: none;
  width: 250px;
  transition: all 0.3s ease-in-out;
  opacity: ${({ show }) => (show ? '1' : '0')};
  transform: ${({ show }) => (show ? 'translateX(0)' : 'translateX(-20px)')};
  &::placeholder {
    color: #aaa;
  }
  &:focus {
    border-bottom: 2px solid #fe592a;
  }
`;

const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  width: 100%;
  justify-content: center;
  align-items: center;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const LinkWrapper = styled(Link)`
  text-decoration: none;
  display: flex;
  justify-content: center;
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
  width: 350px;
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
  display: -webkit-box;
  // -webkit-line-clamp: 2; 
  -webkit-box-orient: vertical; 
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  line-height: 1.2;
  max-width: 100%; 
`;

export default ArticleList;
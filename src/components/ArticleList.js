import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchArticles } from '../sanityClient';
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
    const query = searchQuery.toLowerCase();
    setFilteredArticles(
      articles.filter(article => 
        article.title?.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, articles]);

  if (loading) return <LoadingContainer message="Fetching latest articles..." size="large" spinnerColor="#fea500" textColor="#555" />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <ArticleContainer>
      <SearchContainer>
        <SearchIcon onClick={() => setShowSearch(!showSearch)} />
        <SearchBar
          show={showSearch}
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
          {filteredArticles.map((article) => {
            const authorImageSrc = article.author?.photoURL || 'https://via.placeholder.com/40';
            const mainImageSrc = article.mainImage || 'https://via.placeholder.com/350x250';

            return (
              <LinkWrapper to={`/article/${article._id}`} key={article._id}>
                <ArticleCard>
                  <TopLeftSection>
                    <UserInfo>
                      <UserImage src={authorImageSrc} alt={article.author?.name || 'Unknown author'} />
                      <UserName>{article.author?.name}</UserName>
                    </UserInfo>

                    <DateAndTime>
                      {article.publishedDate && (
                        <PublishedDate>{new Date(article.publishedDate).toLocaleDateString()}</PublishedDate>
                      )}
                      {article.publishedDate && article.readingTime && <Dot>·</Dot>}
                      <ReadingTime>
                        Reading Time: {article.readingTime || 'N/A'} mins
                      </ReadingTime>
                    </DateAndTime>
                  </TopLeftSection>

                  <ArticleImage src={mainImageSrc} alt={article.title} />
                  <Divider />

                  <ArticleTitle>
                    {article.title?.length > 50
                      ? `${article.title.substring(0, 50)}...`
                      : article.title}
                  </ArticleTitle>

                  <ArticleCounters articleId={article._id} />
                </ArticleCard>
              </LinkWrapper>
            );
          })}
        </ArticleGrid>
      )}
    </ArticleContainer>
  );
};

// Styled components remain exactly the same as in your original code
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
  margin: 40px 0 40px 20px;
  position: relative;
  width: 100%;
  justify-content: flex-start;
`;

const SearchIcon = styled(FaSearch)`
  cursor: pointer;
  font-size: 1.5rem;
  margin-right: 10px;
  transition: all 0.3s ease;
  color: ${({ show }) => (show ? '#054944' : 'inherit')};
  &:hover {
    transform: scale(1.2);
    color: #054944;
  }
`;

const SearchBar = styled.input`
  padding: 10px;
  font-size: 1rem;
  border: none;
  border-bottom: 2px solid #ccc;
  background: transparent;
  outline: none;
  width: ${({ show }) => (show ? '250px' : '0')};
  opacity: ${({ show }) => (show ? '1' : '0')};
  transform: ${({ show }) => (show ? 'translateX(0)' : 'translateX(-10px)')};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: ${({ show }) => (show ? '10px' : '0')};
  visibility: ${({ show }) => (show ? 'visible' : 'hidden')};
  
  &::placeholder {
    color: #aaa;
    transition: color 0.2s ease;
  }
  
  &:focus {
    border-bottom: 2px solid #054944;
    
    &::placeholder {
      color: transparent;
    }
  }
`;

const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
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
  width: 360px;
  overflow: hidden;
  margin-bottom: 20px;

  & > *:not(:last-child) {
    margin-bottom: 15px;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 400px) {
    width: 95vw;
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 2px;
  background: black;
  flex-shrink: 0;
`;

const ArticleTitle = styled.h2`
  font-size: clamp(1.4rem, 2vw, 1.8rem);
  font-weight: 600;
  color: #222;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  line-height: 1.4;
  max-width: 100%;
  padding: 0 10px;
  transition: color 0.2s ease;
  word-break: break-word;
  
  ${ArticleCard}:hover & {
    color: #054944;
  }

  @media (max-width: 768px) {
    -webkit-line-clamp: 2;
    font-size: 1.5rem;
  }
`;

export default ArticleList;
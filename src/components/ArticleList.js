import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchArticles } from '../sanityClient';
import { urlFor } from '../sanityClient';
import styled from 'styled-components';
import { EyeIcon, ChatBubbleLeftIcon, HeartIcon } from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

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
    <ArticleContainer>
      <ArticleGrid>
        {articles.map((article) => (
          <LinkWrapper to={`/article/${article._id}`} key={article._id}>
            <ArticleCard>
              <Menu as="div" style={{ position: "absolute", top: "10px", right: "10px" }}>
                <MenuButton
                  style={{
                    background: "none", // No background
                    border: "none", // No border
                    padding: 0, // Remove any default padding
                    cursor: "pointer", // Ensures the cursor changes on hover
                  }}
                >
                  <EllipsisVerticalIcon
                    style={{
                      width: "24px",
                      height: "30px",
                      cursor: "pointer",
                      color: "#333", // Icon color
                      background: "none", // No background
                      border: "none", // No border
                      boxShadow: "none", // No shadow
                      padding: "0", // Remove any internal padding
                    }}
                  />
                </MenuButton>
                <MenuItems
                  style={{
                    position: "absolute",
                    right: 0,
                    background: "white",
                    border: "1px solid #ccc",
                    // borderRadius: "5px",
                    padding: "5px 15px", // Added padding to make the menu items wider
                    width: "180px", // Adjusted width to make the menu wider
                    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                    zIndex: 10,
                  }}
                >
                  <MenuItem>
                    {({ active }) => (
                      <button
                        style={{
                          padding: "8px 12px",
                          width: "100%",
                          textAlign: "left",
                          background: active ? "#f0f0f0" : "white",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onClick={() => alert("Follow Post clicked")}
                      >
                        Follow Post
                      </button>
                    )}
                  </MenuItem>

                  {/* Share Post */}
                  <MenuItem>
                    {({ active }) => (
                      <button
                        style={{
                          padding: "8px 12px",
                          width: "100%",
                          textAlign: "left",
                          background: active ? "#f0f0f0" : "white",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onClick={() => alert("Share Post clicked")}
                      >
                        Share Post
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>

              </Menu>
              <TopLeftSection>
                {article.authorImage && (
                  <AuthorInfo>
                    <AuthorImage src={urlFor(article.authorImage).url()} alt={article.authorName} />
                    <AuthorName>{article.authorName}</AuthorName>
                  </AuthorInfo>
                )}

                {/* Display Date and Reading Time in one row, with a dot in between */}
                <DateAndTime>
                  {article.publishedDate && (
                    <PublishedDate>{new Date(article.publishedDate).toLocaleDateString()}</PublishedDate>
                  )}
                  {article.publishedDate && article.readingTime && <Dot>·</Dot>}
                  {article.readingTime ? (
                    <ReadingTime>Estimated Reading Time: {article.readingTime} minutes</ReadingTime>
                  ) : (
                    <ReadingTime>Estimated Reading Time: N/A</ReadingTime> // Fallback text if reading time is missing
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

              <Engagement>
                <HeartWrapper>
                  <HeartIcon style={{ width: '20px', height: '20px', color: 'red' }} /> {article.likes || 0}
                </HeartWrapper>
                <IconWrapper>
                  <IconItem><EyeIcon style={{ width: '20px', height: '20px' }} /> {article.views || 0}</IconItem>
                  <IconItem><ChatBubbleLeftIcon style={{ width: '20px', height: '20px' }} /> {article.comments || 0}</IconItem>
                </IconWrapper>
              </Engagement>
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
  padding: 4rem 2rem;
  overflow: hidden;
  background: #feedfd;
`;


const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); /* Slightly larger cards */
  gap: 100px; /* Increased gap between listings */
  padding: 30px;
`;

const LinkWrapper = styled(Link)`
  text-decoration: none;
`;

const ArticleCard = styled.div`
  background: #f8d8a5;
  padding: 30px 20px 20px;
  // border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  transition: transform 0.3s ease;
  height: 550px;
  width: 100%;
  overflow: hidden;
  margin-bottom: 20px; /* Extra space if needed */
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
  width: 100%; /* Ensure the section takes up the full width */
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
  height: 250px; /* Increased image height for a bigger feel */
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
  font-size: 1.8rem; /* Bigger text */
  font-weight: 500;
  color: black;
  margin: 15px 0;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const Engagement = styled.div`
display: flex;
justify-content: space-between;
align-items: center;
width: 100%;
font-size: 1.2rem; /* Bigger icons and numbers */
color: #444;
`;

const HeartWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const IconItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

export default ArticleList;

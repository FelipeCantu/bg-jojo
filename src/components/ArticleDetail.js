import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchArticleById, urlFor, client } from "../sanityClient";
import styled from "styled-components";
import ArticleCounters from "./ArticleCounters";
import CommentSection from "./CommentSection";
import { auth, onAuthStateChanged } from "../firestore";
import { PortableText } from '@portabletext/react';

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [author, setAuthor] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getArticle = async () => {
      setLoading(true);
      try {
        const fetchedArticle = await fetchArticleById(id);
        console.log("Article content:", fetchedArticle.content);

        if (fetchedArticle) {
          const authorData = await fetchAuthorData(fetchedArticle.author._ref);
          setArticle(fetchedArticle);
          setAuthor(authorData);
        } else {
          console.error("Article not found");
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };

    getArticle();

    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName,
          photo: currentUser.photoURL || "https://via.placeholder.com/40",
          uid: currentUser.uid,
        });
      } else {
        setUser(null);
      }
    });
  }, [id]);

  const fetchAuthorData = async (authorRef) => {
    try {
      const authorData = await client.fetch(`*[_type == "user" && _id == $id][0]`, { id: authorRef });
      return authorData;
    } catch (error) {
      console.error("Error fetching author data:", error);
      return null;
    }
  };

  if (loading) return <LoadingMessage>Loading article...</LoadingMessage>;
  if (!article) return <ErrorMessage>Article not found.</ErrorMessage>;

  const isAuthor = user && article.authorUid && article.authorUid === user.uid;
  
  return (
    <ArticleDetailContainer>
      {/* Title and Top Right Section (Level with the title) */}
      <HeaderSection>
        <Title>{article.title}</Title>
        <TopRightSection>
          {author && (
            <AuthorInfo>
              <AuthorName>{author.name}</AuthorName>
              <AuthorImage src={author.photoURL || "https://via.placeholder.com/40"} alt={author.name} />
            </AuthorInfo>
          )}
          <PublishedDate>Published on: {new Date(article.publishedDate).toLocaleDateString()}</PublishedDate>
          <ReadingTime>Estimated Reading Time: {article.readingTime} minutes</ReadingTime>
        </TopRightSection>
      </HeaderSection>

      {/* Main Image */}
      {article.mainImage?.asset ? (
        <ArticleImage src={urlFor(article.mainImage.asset).url()} alt={article.title} />
      ) : (
        <ArticleImage src="https://via.placeholder.com/800x400" alt="No image available" />
      )}

      {/* Article Content */}
      <ContentWrapper>
        <PortableText
          value={article.content}
          components={{
            types: {
              image: ({ value }) => (
                <img
                  src={urlFor(value.asset).url()}
                  alt={value.alt || "Image"}
                  style={{ maxWidth: "100%", height: "auto", borderRadius: "10px", margin: "10px 0" }}
                />
              ),
            },
            block: {
              h1: ({ children }) => <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", margin: "20px 0" }}>{children}</h1>,
              h2: ({ children }) => <h2 style={{ fontSize: "2rem", fontWeight: "bold", margin: "15px 0" }}>{children}</h2>,
              h3: ({ children }) => <h3 style={{ fontSize: "1.75rem", fontWeight: "bold", margin: "10px 0" }}>{children}</h3>,
              h4: ({ children }) => <h4 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "10px 0" }}>{children}</h4>,
              normal: ({ children }) => <p style={{ marginBottom: "15px", lineHeight: "1.6" }}>{children}</p>,
              blockquote: ({ children }) => (
                <blockquote style={{ fontStyle: "italic", borderLeft: "4px solid #ccc", paddingLeft: "10px", margin: "15px 0" }}>
                  {children}
                </blockquote>
              ),
            },
            marks: {
              link: ({ value, children }) => {
                let href = value?.href;
              
                if (!href) {
                  console.warn("Invalid or missing href in link:", value);
                  return <span style={{ color: "red", fontWeight: "bold" }}>{children}</span>;
                }
              
                // Add https:// if it's missing
                if (!/^https?:\/\//.test(href)) {
                  href = `https://${href}`;
                }
              
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#007bff", textDecoration: "none" }}>
                    {children}
                  </a>
                );
              },
              
              code: ({ children }) => (
              <code style={{ fontFamily: "monospace", backgroundColor: "#f4f4f4", padding: "2px 4px", borderRadius: "4px" }}>
                {children}
              </code>
            ),
          },
            list: {
          bullet: ({children}) => <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>{children}</ul>,
        number: ({children}) => <ol style={{ margin: "10px 0", paddingLeft: "20px" }}>{children}</ol>,
            },
        listItem: {
          bullet: ({children}) => <li style={{ marginBottom: "5px" }}>{children}</li>,
        number: ({children}) => <li style={{ marginBottom: "5px" }}>{children}</li>,
            },
          }}
        />
      </ContentWrapper>

      <Divider />
      <ArticleCounters articleId={id} user={user} />
      <CommentSection articleId={id} user={user} />

      {isAuthor && user && (
        <UserInfo>
          <UserImage src={user.photo} alt={user.name} />
          <UserName>{user.name}</UserName>
        </UserInfo>
      )}
    </ArticleDetailContainer>
  );
};
// Styled Components
const ArticleDetailContainer = styled.div`
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  @media (max-width: 768px) {
    padding: 10px;
    max-width: 100%;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin: 0;
`;

const TopRightSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;

  @media (max-width: 768px) {
    align-items: flex-start;
  }
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AuthorImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
`;

const AuthorName = styled.p`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const PublishedDate = styled.p`
  font-size: 14px;
  color: #555;
  margin: 0;
`;

const ReadingTime = styled.p`
  font-size: 14px;
  color: #777;
  margin: 0;
`;

const ArticleImage = styled.img`
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 10px;
`;

const ContentWrapper = styled.div`
  margin-top: 30px;
  font-size: 16px;
  line-height: 1.6;
  color: #333;

  img {
    max-width: 100%;
    height: auto;
    border-radius: 10px;
    margin: 10px 0;
  }

  h1, h2, h3, h4 {
    margin-top: 20px;
    margin-bottom: 10px;
  }

  p {
    margin-bottom: 15px;
  }

a {
  color: #007bff;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}


  blockquote {
    font-style: italic;
    border-left: 4px solid #ccc;
    padding-left: 10px;
    margin: 15px 0;
  }

  ul, ol {
    margin: 10px 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 5px;
  }

  code {
    font-family: monospace;
    background-color: #f4f4f4;
    padding: 2px 4px;
    border-radius: 4px;
  }
`;

const Divider = styled.hr`
  margin-top: 20px;
  border: 1px solid #ddd;
  margin-bottom: 0;
`;

const LoadingMessage = styled.p`
  font-size: 18px;
  text-align: center;
  margin-top: 50px;
`;

const ErrorMessage = styled.p`
  font-size: 18px;
  color: red;
  text-align: center;
`;

const UserInfo = styled.div`
  margin-top: 20px;
  display: flex;
  align-items: center;
`;

const UserImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
`;

const UserName = styled.p`
  font-size: 16px;
  color: #333;
`;

export default ArticleDetail;

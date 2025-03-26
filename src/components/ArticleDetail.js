import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchArticleById, urlFor, client } from "../sanityClient";
import styled from "styled-components";
import ArticleCounters from "./ArticleCounters";
import CommentSection from "./CommentSection";
import { auth, onAuthStateChanged } from "../firestore";
import { PortableText } from "@portabletext/react";
import LoadingContainer from "./LoadingContainer";

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
        console.log('Fetched Article:', fetchedArticle); // Debugging log
        if (fetchedArticle) {
          const authorData = await fetchAuthorData(fetchedArticle.author._ref);
          setArticle(fetchedArticle);
          setAuthor(authorData);
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
      return await client.fetch(`*[_type == "user" && _id == $id][0]`, { id: authorRef });
    } catch (error) {
      console.error("Error fetching author data:", error);
      return null;
    }
  };

  if (loading) return <LoadingContainer message="Loading article..." size="large" spinnerColor="#fea500" textColor="#555" />;
  if (!article) return <ErrorMessage>Article not found.</ErrorMessage>;

  const contentToRender = article?.content || [];
  console.log('Content to Render:', contentToRender); // Debugging log

  return (
    <ArticleDetailContainer>
      <style>
        {`
          .portable-text a {
            color: #007BFF;
            text-decoration: underline;
          }
          .portable-text a:hover {
            color: #0056b3;
            text-decoration: none;
          }
          .portable-text ul,
          .portable-text ol {
            padding-left: 1.5em;
            margin: 1em 0;
          }
          .portable-text ul {
            list-style-type: disc;
          }
          .portable-text ol {
            list-style-type: decimal;
          }
          .portable-text li {
            margin: 0.5em 0;
          }
          .custom-quote {
            border-left: 4px solid #007BFF;
            padding: 10px 20px;
            margin: 20px 0;
            font-style: italic;
            background-color: #f9f9f9;
          }
          .portable-text img {
            max-width: 100%;
            height: auto;
            margin: 20px 0;
            border-radius: 8px;
          }
        `}
      </style>

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

      {article.mainImage?.asset ? (
        <ArticleImage src={urlFor(article.mainImage.asset).url()} alt={article.title} />
      ) : (
        <ArticleImage src="https://via.placeholder.com/800x400" alt="No image available" />
      )}

      <ContentWrapper className="portable-text">
        <PortableText
          value={contentToRender}
          components={{
            types: {
              // Handle image blocks
              image: ({ value }) => (
                <img
                  src={urlFor(value.asset).url()}
                  alt={value.alt || "Image"}
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              ),
            },
            block: {
              normal: ({ children }) => <p>{children}</p>,
              h1: ({ children }) => <h1>{children}</h1>,
              h2: ({ children }) => <h2>{children}</h2>,
              h3: ({ children }) => <h3>{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className="custom-quote">{children}</blockquote>
              ),
            },
            list: {
              bullet: ({ children }) => <ul className="custom-list">{children}</ul>,
              number: ({ children }) => <ol className="custom-list">{children}</ol>,
            },
            listItem: ({ children }) => <li>{children}</li>,
            marks: {
              link: ({ value, children }) => (
                <a href={value.href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              strong: ({ children }) => <strong>{children}</strong>,
              em: ({ children }) => <em>{children}</em>,
            },
          }}
        />
      </ContentWrapper>

      <Divider />
      <ArticleCounters articleId={id} user={user} />
      <CommentSection articleId={id} user={user} />
    </ArticleDetailContainer>
  );
};

// Styled Components
const ArticleDetailContainer = styled.div`
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
`;

const TopRightSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
`;

const AuthorImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
`;

const AuthorName = styled.p`
  font-weight: bold;
`;

const PublishedDate = styled.p`
  font-size: 14px;
`;

const ReadingTime = styled.p`
  font-size: 14px;
`;

const ArticleImage = styled.img`
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 10px;
`;

const ContentWrapper = styled.div`
  margin-top: 30px;
`;

const Divider = styled.hr`
  margin-top: 20px;
  border: 1px solid #ddd;
`;

const ErrorMessage = styled.p`
  font-size: 18px;
  color: red;
  text-align: center;
`;

export default ArticleDetail;
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchArticleById, urlFor, client } from "../sanityClient";
import styled from "styled-components";
import ArticleCounters from "./ArticleCounters";
import CommentSection from "./CommentSection";
import { auth, onAuthStateChanged } from "../firestore";
import { PortableText } from "@portabletext/react";

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
        console.log("Fetched Article:", fetchedArticle); // Debugging
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

          .portable-text blockquote {
            border-left: 4px solid #ddd;
            margin: 1.5em 0;
            padding: 0.5em 1em;
            color: #555;
            font-style: italic;
            background-color: #f9f9f9;
          }

          .portable-text blockquote p {
            margin: 0;
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
          value={article.content}
          components={{
            list: {
              bullet: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
              number: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
            },
            listItem: ({ children }) => <li>{children}</li>,
          }}
        />
      </ContentWrapper>

      <Divider />
      <ArticleCounters articleId={id} user={user} />
      <CommentSection articleId={id} user={user} />
    </ArticleDetailContainer>
  );
};

// Styled Components (unchanged)
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
`;

const Divider = styled.hr`
  margin-top: 20px;
  border: 1px solid #ddd;
  margin-bottom: 0;
`;

const LoadingMessage = styled.p`
  font-size: 18px;
  color: #555;
  text-align: center;
`;

const ErrorMessage = styled.p`
  font-size: 18px;
  color: red;
  text-align: center;
`;

export default ArticleDetail;

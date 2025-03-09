import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchArticleById, urlFor, client } from "../sanityClient";
import { PortableText } from "@portabletext/react";
import styled from "styled-components";
import ArticleCounters from "./ArticleCounters";
import CommentSection from "./CommentSection";
import { auth, onAuthStateChanged } from "../firestore";

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
        if (fetchedArticle) {
          setArticle(fetchedArticle);
          const authorData = await fetchAuthorData(fetchedArticle.author._ref);
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
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!article) return <p>Article not found</p>;

  const isAuthor = user && author && article.authorUid === user.uid;

  return (
    <ArticleDetailContainer>
      <Title>{article.title}</Title>

      {article.mainImage?.asset ? (
        <ArticleImage
          src={urlFor(article.mainImage.asset).url()}
          alt={article.title}
        />
      ) : (
        <ArticleImage src="https://via.placeholder.com/800x400" alt="No image available" />
      )}

      {author ? (
        <AuthorInfo>
          <AuthorImage src={author.photoURL || "https://via.placeholder.com/40"} alt={author.name} />
          <AuthorName>{author.name}</AuthorName>
        </AuthorInfo>
      ) : (
        <AuthorInfo>
          <AuthorImage src="https://via.placeholder.com/40" alt="Unknown author" />
          <AuthorName>Unknown author</AuthorName>
        </AuthorInfo>
      )}

      <PublishedDate>Published on: {new Date(article.publishedDate).toLocaleDateString()}</PublishedDate>
      <ReadingTime>Estimated Reading Time: {article.readingTime} minutes</ReadingTime>

      {article.content && Array.isArray(article.content) && article.content.length > 0 ? (
        <PortableText value={article.content} />
      ) : (
        <p>No content available for this article.</p>
      )}

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
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
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

const Divider = styled.hr`
  margin-top: 20px;
  border: 1px solid #ddd;
  margin-bottom: 0;
`;

const PublishedDate = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 5px;
`;

const ReadingTime = styled.p`
  font-size: 14px;
  color: #777;
  margin-top: 5px;
`;

const ArticleImage = styled.img`
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 10px;
  margin-top: 20px;
`;

const AuthorName = styled.p`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-top: 30px;
`;

const UserImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
`;

const UserName = styled.p`
  font-size: 16px;
  font-weight: bold;
  color: #333;
`;

export default ArticleDetail;

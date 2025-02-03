import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { db, auth, collection, doc, setDoc, getDocs, addDoc, onAuthStateChanged } from "../firestore";
import { fetchArticleById } from "../sanityClient";
import { urlFor } from "../sanityClient";
import BlockContent from "@sanity/block-content-to-react";
import styled from "styled-components";

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);
  const [isCommentBoxExpanded, setIsCommentBoxExpanded] = useState(false);

  const fetchComments = useCallback(async () => {
    const commentsRef = collection(db, "articles", id, "comments");
    const commentsSnapshot = await getDocs(commentsRef);
    setComments(commentsSnapshot.docs.map((doc) => doc.data()));
  }, [id]);

  useEffect(() => {
    const getArticle = async () => {
      const fetchedArticle = await fetchArticleById(id);
      setArticle(fetchedArticle);
      if (fetchedArticle) syncArticleToFirestore(fetchedArticle);
    };

    getArticle();
    fetchComments();

    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ? {
        name: currentUser.displayName,
        photo: currentUser.photoURL || "https://via.placeholder.com/40",
      } : null);
    });
  }, [id, fetchComments]);

  const syncArticleToFirestore = async (article) => {
    try {
      const articleRef = doc(collection(db, "articles"), article._id);
      await setDoc(articleRef, { ...article });
    } catch (error) {
      console.error("Error syncing article:", error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const commentsRef = collection(db, "articles", id, "comments");
    await addDoc(commentsRef, {
      userName: user.name,
      userPhoto: user.photo,
      text: newComment,
      timestamp: new Date().toISOString(),
    });

    setNewComment("");
    setIsCommentBoxExpanded(false);
    fetchComments();
  };

  if (!article) return <p>Loading...</p>;

  return (
    <ArticleDetailContainer>
      <Title>{article.title}</Title>
      {article.image && <ArticleImage src={urlFor(article.image).url()} alt={article.title} />}
      {article.authorImage && (
        <AuthorInfo>
          <AuthorImage src={urlFor(article.authorImage).url()} alt={article.authorName} />
          <AuthorName>{article.authorName}</AuthorName>
        </AuthorInfo>
      )}
      <PublishedDate>Published on: {new Date(article.publishedDate).toLocaleDateString()}</PublishedDate>
      <ReadingTime>Estimated Reading Time: {article.readingTime} minutes</ReadingTime>
      {article.content && Array.isArray(article.content) && (
        <BlockContent blocks={article.content} serializers={{ types: {} }} />
      )}
      <Divider />

      <CommentSection>
        <h3>Comments</h3>
        {user ? (
          <CommentForm onSubmit={handleCommentSubmit}>
            <CommentBox
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onFocus={() => setIsCommentBoxExpanded(true)}
              expanded={isCommentBoxExpanded}
            />
            {isCommentBoxExpanded && (
              <ButtonContainer>
                <CancelButton type="button" onClick={() => setIsCommentBoxExpanded(false)}>Cancel</CancelButton>
                <PublishButton type="submit">Publish</PublishButton>
              </ButtonContainer>
            )}
          </CommentForm>
        ) : (
          <p>Please log in to comment.</p>
        )}
        {comments.map((comment, index) => (
          <Comment key={index}>
            <UserPhoto src={comment.userPhoto} alt={comment.userName} />
            <CommentContent>
              <strong>{comment.userName}</strong>
              <p>{comment.text}</p>
            </CommentContent>
          </Comment>
        ))}
      </CommentSection>
    </ArticleDetailContainer>
  );
};

const ArticleDetailContainer = styled.div`padding: 20px; max-width: 900px; margin: 0 auto;`;
const Title = styled.h1`font-size: 2.5rem; color: #333; margin-bottom: 20px;`;
const AuthorInfo = styled.div`display: flex; align-items: center; margin-top: 20px;`;
const AuthorImage = styled.img`width: 50px; height: 50px; border-radius: 50%; margin-right: 10px;`;
const Divider = styled.hr`margin: 30px 0; border: 1px solid #ddd;`;
const CommentSection = styled.div`margin-top: 20px; margin-bottom: 50px`;
const CommentForm = styled.form`display: flex; flex-direction: column; margin-top: 15px; position: relative;`;
const CommentBox = styled.textarea`
  width: 100%;
  height: ${(props) => (props.expanded ? "100px" : "40px")};
  transition: height 0.3s ease;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  position: relative;
`;
const ButtonContainer = styled.div`
  position: absolute;
  bottom: -40px;
  right: 0;
  display: flex;
  gap: 10px;
`;


const ArticleImage = styled.img`width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px; margin-top: 20px;`;
const AuthorName = styled.p`font-size: 16px; font-weight: bold; color: #333;`;
const PublishedDate = styled.p`font-size: 14px; color: #555; margin-top: 5px;`;
const ReadingTime = styled.p`font-size: 14px; color: #777; margin-top: 5px;`;
const Comment = styled.div`display: flex; align-items: flex-start; margin-top: 10px;`;
const UserPhoto = styled.img`width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;`;
const CommentContent = styled.div`margin-left: 10px;`;

const PublishButton = styled.button`
  background-color: #024a47;
  color: white;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  transition: opacity 0.2s ease-in-out;

  &:hover {
    opacity: 0.8;
  }
`;const CancelButton = styled.button`color: #024a47; padding: 5px 10px; border: none; cursor: pointer;`;

export default ArticleDetail;

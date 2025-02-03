import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db, auth, provider, collection, doc, setDoc, getDocs, addDoc, signInWithPopup, onAuthStateChanged } from "../firebase";
import { fetchArticleById } from "../sanityClient";
import { urlFor } from "../sanityClient";
import BlockContent from "@sanity/block-content-to-react";
import styled from "styled-components";

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null); // Store authenticated user

  useEffect(() => {
    const getArticle = async () => {
      const fetchedArticle = await fetchArticleById(id);
      setArticle(fetchedArticle);
      if (fetchedArticle) syncArticleToFirestore(fetchedArticle);
    };

    getArticle();
    fetchComments();

    // Listen for authentication state changes
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName,
          photo: currentUser.photoURL || "https://via.placeholder.com/40", // Default image
        });
      } else {
        setUser(null);
      }
    });
  }, [id]);

  const syncArticleToFirestore = async (article) => {
    const { _id, _rev, _createdAt, _updatedAt, ...data } = article;
    try {
      const articleRef = doc(collection(db, "articles"), _id);
      await setDoc(articleRef, { ...data, _rev, _createdAt, _updatedAt });
    } catch (error) {
      console.error(`Error syncing article: ${article._id}`, error);
    }
  };

  const fetchComments = async () => {
    const commentsRef = collection(db, "articles", id, "comments");
    const commentsSnapshot = await getDocs(commentsRef);
    setComments(commentsSnapshot.docs.map((doc) => doc.data()));
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
    fetchComments();
  };

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const currentUser = result.user;
      setUser({
        name: currentUser.displayName,
        photo: currentUser.photoURL || "https://via.placeholder.com/40",
      });
    } catch (error) {
      console.error("Login failed", error);
    }
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
      {article.content && <BlockContent blocks={article.content} serializers={serializers} />}
      <Divider />

      <CommentSection>
        <h3>Comments</h3>
        
        {/* Show user profile next to comment input */}
        {!user ? (
          <LoginButton onClick={handleLogin}>Sign in to comment</LoginButton>
        ) : (
          <CommentForm onSubmit={handleCommentSubmit}>
            <UserProfile>
              <UserPhoto src={user.photo} alt={user.name} />
              <strong>{user.name}</strong>
            </UserProfile>
            <textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} required />
            <button type="submit">Submit</button>
          </CommentForm>
        )}

        {/* Display comments */}
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

const serializers = { types: { block: (props) => <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>{props.children}</p> } };

const ArticleDetailContainer = styled.div`padding: 20px; max-width: 900px; margin: 0 auto;`;
const Title = styled.h1`font-size: 2.5rem; color: #333; margin-bottom: 20px;`;
const AuthorInfo = styled.div`display: flex; align-items: center; margin-top: 20px;`;
const AuthorImage = styled.img`width: 50px; height: 50px; border-radius: 50%; margin-right: 10px;`;
const Divider = styled.hr`margin: 30px 0; border: 1px solid #ddd;`;
const CommentSection = styled.div`margin-top: 20px;`;
const CommentForm = styled.form`display: flex; flex-direction: column; margin-top: 15px;`;
const UserProfile = styled.div`display: flex; align-items: center; margin-bottom: 10px;`;
const UserPhoto = styled.img`width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;`;
const LoginButton = styled.button`background: #007bff; color: white; padding: 10px; border: none; cursor: pointer; border-radius: 5px;`;

export default ArticleDetail;

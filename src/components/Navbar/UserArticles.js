import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { client, urlFor } from "../../sanityClient";
import useCurrentUser from "../../hook/useCurrentUser";

const UserArticles = () => {
  const { currentUser, loading, error } = useCurrentUser();
  const [articles, setArticles] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      if (!currentUser?.uid) {
        setFetchError("You must be logged in to view your articles.");
        return;
      }

      try {
        const sanityUserQuery = `*[_type == "user" && uid == $uid][0]`;
        const sanityUser = await client.fetch(sanityUserQuery, { uid: currentUser.uid });

        if (!sanityUser) {
          setFetchError("No Sanity user found for this Firebase UID.");
          return;
        }

        const articlesQuery = `*[_type == "article" && author._ref == $sanityUserId]{
          _id,
          title,
          mainImage,
          publishedDate
        }`;

        const userArticles = await client.fetch(articlesQuery, { sanityUserId: sanityUser._id });

        setArticles(userArticles.length === 0 ? [] : userArticles);
      } catch (error) {
        setFetchError("Error fetching articles. Please try again later.");
        console.error("Error fetching articles from Sanity:", error);
      }
    };

    if (currentUser?.uid) {
      fetchArticles();
    }
  }, [currentUser]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error.message}</p>;
  if (!currentUser?.uid) return <p>You must be logged in to view your articles.</p>;

  return (
    <Container>
      <UserProfile>
        <ProfileImage src={currentUser.photoURL} alt={currentUser.displayName} />
        <UserName>{currentUser.displayName}</UserName>
      </UserProfile>

      {fetchError ? (
        <ErrorMessage>{fetchError}</ErrorMessage>
      ) : articles.length > 0 ? (
        <ArticleSection>
          <Title>Your Articles:</Title>
          <ScrollWrapper>
            <HorizontalScrollContainer>
              {articles.map((article) => (
                <ArticleItem key={article._id}>
                  <Link to={`/article/${article._id}`}>
                    <ArticleImage
                      src={article.mainImage?.asset ? urlFor(article.mainImage.asset).url() : "https://via.placeholder.com/350x250"}
                      alt={article.title}
                    />
                    <ArticleTitle>{article.title}</ArticleTitle>
                  </Link>
                  <ArticleMeta>Published on: {new Date(article.publishedDate).toLocaleDateString()}</ArticleMeta>
                </ArticleItem>
              ))}
            </HorizontalScrollContainer>
          </ScrollWrapper>
        </ArticleSection>
      ) : (
        <NoArticlesMessage>No articles found for this user.</NoArticlesMessage>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  max-width: 80%; /* Adjust width as needed */
  margin: 0 auto; /* Centers horizontally */
  background-color: #666;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center; /* Centers children horizontally */
  justify-content: center; /* Centers children vertically if needed */
  min-height: 300px; /* Adjust height as needed */
  text-align: center; /* Ensures text is centered */
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const ProfileImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 15px;
`;

const UserName = styled.h3`
  font-size: 1.25rem;
  color: #333;
`;

const ArticleSection = styled.div`
  width: 100%;
  padding: 20px 0;
`;

const Title = styled.h2`
  font-size: 2rem;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
`;

const ScrollWrapper = styled.div`
  width: 100%;
  overflow: hidden;
`;

const HorizontalScrollContainer = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 15px;
  padding-bottom: 10px;
  scrollbar-width: thin;
  scrollbar-color: #888 transparent;
  white-space: nowrap;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
`;

const ArticleItem = styled.div`
  flex: 0 0 auto;
  width: 250px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  padding: 15px;
  text-align: center;

  &:hover {
    background-color: #f1f1f1;
  }
`;

const ArticleImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 15px;
`;

const ArticleTitle = styled.h3`
  font-size: 1.25rem;
  color: #333;
  margin: 0 0 10px;
`;

const ArticleMeta = styled.p`
  font-size: 0.875rem;
  color: #888;
  margin: 0;
`;

const ErrorMessage = styled.p`
  color: red;
  font-size: 1rem;
  text-align: center;
`;

const NoArticlesMessage = styled.p`
  font-size: 1rem;
  color: #555;
  text-align: center;
`;

export default UserArticles;

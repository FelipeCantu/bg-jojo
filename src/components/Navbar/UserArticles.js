import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { client, urlFor } from "../../sanityClient";
import useCurrentUser from "../../hook/useCurrentUser";
import ArticleCounters from "../ArticleCounters"; // Import the ArticleCounters component

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
          publishedDate,
          readingTime,
          author->{
            _id,
            name,
            photoURL
          }
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

  if (loading) return <LoadingMessage>Loading...</LoadingMessage>;
  if (error) return <ErrorMessage>{error.message}</ErrorMessage>;
  if (!currentUser?.uid) return <ErrorMessage>You must be logged in to view your articles.</ErrorMessage>;

  return (
    <Container>
      {fetchError ? (
        <ErrorMessage>{fetchError}</ErrorMessage>
      ) : articles.length > 0 ? (
        <ArticleSection>
          <ScrollWrapper>
            <HorizontalScrollContainer>
              {articles.map((article) => (
                <ArticleItem key={article._id}>
                  <LinkWrapper to={`/article/${article._id}`}>
                    <ArticleCard>
                      <TopLeftSection>
                        <UserInfo>
                          <UserImage
                            src={article.author?.photoURL || "https://via.placeholder.com/40"}
                            alt={article.author?.name || "Anonymous"}
                          />
                          <UserDisplayName>{article.author?.name || "Anonymous"}</UserDisplayName>
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

                      <ArticleImage
                        src={article.mainImage?.asset ? urlFor(article.mainImage.asset).url() : "https://via.placeholder.com/350x250"}
                        alt={article.title}
                      />

                      <Divider />
                      <ArticleTitle>{article.title || 'No Title'}</ArticleTitle>

                      {/* Include ArticleCounters here, passing the articleId */}
                      <ArticleCounters articleId={article._id} />
                    </ArticleCard>
                  </LinkWrapper>
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
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
`;

const ArticleSection = styled.div`
  width: 100%;
  padding: 20px 0;
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
  width: 100%; /* Full width on smaller screens */
  max-width: 600px; /* Max width to prevent cards from becoming too wide */
  height: 550px;
  background-color: #f8d8a5;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  transition: transform 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.2);
  }
`;

const LinkWrapper = styled(Link)`
  text-decoration: none;
`;

const ArticleCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  position: relative;
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

const UserDisplayName = styled.span`
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

const ArticleTitle = styled.h3`
  font-size: 1.25rem;
  color: #333;
`;

const NoArticlesMessage = styled.p`
  font-size: 1rem;
  color: #555;
  text-align: center;
`;

const ErrorMessage = styled.p`
  color: red;
  font-size: 1rem;
  text-align: center;
`;

const LoadingMessage = styled.p`
  font-size: 1.2rem;
  color: #555;
  text-align: center;
`;

export default UserArticles;
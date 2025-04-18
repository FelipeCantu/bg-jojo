import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { client, urlFor, deleteArticle } from "../../sanityClient";
import useCurrentUser from "../../hook/useCurrentUser";
import ArticleCounters from "../ArticleCounters";
import { HiDotsVertical } from 'react-icons/hi';

const UserArticles = () => {
  const { currentUser, loading, error } = useCurrentUser();
  const [articles, setArticles] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [referencingCount, setReferencingCount] = useState(0);
  const navigate = useNavigate();
  const dropdownRefs = useRef({});

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
          slug,
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId) {
        const dropdownElement = dropdownRefs.current[openDropdownId];
        if (dropdownElement && !dropdownElement.contains(event.target)) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId]);

 const handleDeleteArticle = async (articleId) => {
  try {
    await deleteArticle(articleId);
    setArticles(prev => prev.filter(a => a._id !== articleId));
    setConfirmDelete(false);
    alert("Article deleted successfully!");
  } catch (error) {
    alert(`Delete failed: ${error.message}`);
  }
};
  const openConfirmDelete = async (articleId) => {
    try {
      // Get counts of different reference types
      const [commentsCount, otherRefsCount] = await Promise.all([
        client.fetch(`count(*[_type == "comment" && article._ref == $articleId])`, { articleId }),
        client.fetch(`count(*[references($articleId) && _type != "comment"])`, { articleId })
      ]);

      setReferencingCount({
        comments: commentsCount,
        others: otherRefsCount
      });
      setArticleToDelete(articleId);
      setConfirmDelete(true);
      setOpenDropdownId(null);
    } catch (error) {
      console.error("Error checking references:", error);
      // Proceed with deletion anyway
      setReferencingCount({ comments: 0, others: 0 });
      setArticleToDelete(articleId);
      setConfirmDelete(true);
      setOpenDropdownId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(false);
    setArticleToDelete(null);
  };

  const toggleDropdown = (articleId, e) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === articleId ? null : articleId);
  };

  const handleEditArticle = (articleId) => {
    navigate(`/edit-article/${articleId}`);
    setOpenDropdownId(null);
  };

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
                  <LinkWrapper to={`/article/${article.slug?.current || article._id}`}>
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
                            {article.readingTime || 'N/A'} min read
                          </ReadingTime>
                        </DateAndTime>
                      </TopLeftSection>

                      <ArticleImage
                        src={article.mainImage?.asset ? urlFor(article.mainImage.asset).url() : "https://via.placeholder.com/350x250"}
                        alt={article.title}
                      />

                      <Divider />
                      <ArticleTitle>{article.title || 'No Title'}</ArticleTitle>

                      <ArticleCountersWrapper>
                        <ArticleCounters articleId={article._id} />
                      </ArticleCountersWrapper>
                    </ArticleCard>
                  </LinkWrapper>

                  <DropdownWrapper
                    ref={(el) => (dropdownRefs.current[article._id] = el)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownButton onClick={(e) => toggleDropdown(article._id, e)}>
                      <HiDotsVertical size={20} />
                    </DropdownButton>
                    {openDropdownId === article._id && (
                      <DropdownMenu>
                        <MenuItem onClick={() => handleEditArticle(article._id)}>Edit</MenuItem>
                        <MenuItem onClick={() => openConfirmDelete(article._id)}>Delete</MenuItem>
                      </DropdownMenu>
                    )}
                  </DropdownWrapper>
                </ArticleItem>
              ))}
            </HorizontalScrollContainer>
          </ScrollWrapper>
        </ArticleSection>
      ) : (
        <NoArticlesMessage>No articles found for this user.</NoArticlesMessage>
      )}

      {confirmDelete && (
        <ConfirmationModal>
          <ModalContainer>
            <ConfirmationText>
              Are you sure you want to delete this article?
            </ConfirmationText>

            {(referencingCount.comments > 0 || referencingCount.others > 0) && (
              <ReferenceWarning>
                ⚠️ This will also delete:
                {referencingCount.comments > 0 && (
                  <div>- {referencingCount.comments} comment(s)</div>
                )}
                {referencingCount.others > 0 && (
                  <div>- {referencingCount.others} other reference(s) will be removed</div>
                )}
              </ReferenceWarning>
            )}

            <ButtonContainer>
              <ConfirmButton onClick={() => handleDeleteArticle(articleToDelete)}>
                Delete Permanently
              </ConfirmButton>
              <CancelButton onClick={cancelDelete}>Cancel</CancelButton>
            </ButtonContainer>
          </ModalContainer>
        </ConfirmationModal>
      )}
    </Container>
  );
};

const ReferenceWarning = styled.div`
  color: #e74c3c;
  font-weight: bold;
  margin: 15px 0;
  padding: 10px;
  background-color: #fde8e8;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: left;
  
  div {
    margin: 5px 0;
    padding-left: 10px;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
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
  gap: 20px;
  padding-bottom: 10px;
  scrollbar-width: thin;
  scrollbar-color: #888 transparent;
`;


const ArticleItem = styled.div`
  flex: 0 0 auto;
  width: 360px; // was 300px
  background-color: #f8d8a5;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: transform 0.3s ease;


  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }


  @media (max-width: 400px) {
    width: 95vw;
  }
`;


const LinkWrapper = styled(Link)`
  text-decoration: none;
  color: inherit;
`;


const ArticleCard = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 5px 20px;
  position: relative;
`;


const TopLeftSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
`;


const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;


const UserImage = styled.img`
  padding-top: 5px;
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
  gap: 5px;
  font-size: 0.9rem;
  color: #666;
`;


const PublishedDate = styled.span``;


const Dot = styled.span``;


const ReadingTime = styled.span``;


const ArticleImage = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 15px;
`;


const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: black;
  margin: 10px 0;
`;


const ArticleTitle = styled.h3`
  font-size: 1.25rem;
  color: #333;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  max-width: 100%;
`;


const ArticleCountersWrapper = styled.div`
  margin-top: auto;
  padding-top: 10px;
  padding-bottom: 5px;
  display: flex;
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


const DropdownWrapper = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
`;


const DropdownButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
`;


const DropdownMenu = styled.div`
  position: absolute;
  top: 30px;
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  z-index: 100;
  width: 120px;
`;


const MenuItem = styled.div`
  padding: 10px;
  font-size: 0.9rem;
  color: #333;
  cursor: pointer;


  &:hover {
    background-color: #f1f1f1;
  }
`;


const ConfirmationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;


const ModalContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
  text-align: center;
`;


const ConfirmationText = styled.p`
  font-size: 1rem;
  margin-bottom: 20px;
  color: #333;
`;


const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
`;


const ConfirmButton = styled.button`
  padding: 10px 20px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;


  &:hover {
    background-color: #c0392b;
  }
`;


const CancelButton = styled.button`
  padding: 10px 20px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;


  &:hover {
    background-color: #7f8c8d;
  }
`;


export default UserArticles;


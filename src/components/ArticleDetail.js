import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchArticleById, urlFor, client } from "../sanityClient";
import styled from "styled-components";
import ArticleCounters from "./ArticleCounters";
import CommentSection from "./CommentSection";
import { auth, onAuthStateChanged } from "../firestore";
import { PortableText } from "@portabletext/react";
import LoadingContainer from "./LoadingContainer";
import { Link } from 'react-router-dom'

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [author, setAuthor] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedArticle = await fetchArticleById(id);
        if (!fetchedArticle) {
          throw new Error("Article not found");
        }
        
        const authorData = await fetchAuthorData(fetchedArticle.author._ref);
        setArticle(fetchedArticle);
        setAuthor(authorData);
      } catch (error) {
        console.error("Error fetching article:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getArticle();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
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

    return () => unsubscribe();
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
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!article) return <ErrorMessage>Article not found.</ErrorMessage>;

  const components = {
    types: {
      image: ({ value }) => {
        if (!value?.asset?._ref) return null;
        
        const imageUrl = value.hotspot 
          ? urlFor(value)
              .fit('clip')
              .width(800)
              .url()
          : urlFor(value)
              .width(800)
              .url();

        return (
          <Figure className={`image-align-${value.align || 'center'}`}>
            <ContentImage
              src={imageUrl}
              alt={value.alt || 'Article image'}
              $hasHotspot={!!value.hotspot}
              $hotspotX={value.hotspot?.x}
              $hotspotY={value.hotspot?.y}
              loading="lazy"
            />
            {value.caption && <Figcaption>{value.caption}</Figcaption>}
          </Figure>
        );
      },
      code: ({ value }) => (
        <CodeBlock>
          <pre>
            <code className={`language-${value.language || 'text'}`}>
              {value.code}
            </code>
          </pre>
          {value.filename && <CodeFilename>{value.filename}</CodeFilename>}
        </CodeBlock>
      ),
    },
    block: {
      normal: ({ children }) => <Paragraph>{children}</Paragraph>,
      h1: ({ children }) => <H1>{children}</H1>,
      h2: ({ children }) => <H2>{children}</H2>,
      h3: ({ children }) => <H3>{children}</H3>,
      h4: ({ children }) => <H4>{children}</H4>,
      blockquote: ({ children }) => <Blockquote>{children}</Blockquote>,
    },
    list: {
      bullet: ({ children }) => <Ul>{children}</Ul>,
      number: ({ children }) => <Ol>{children}</Ol>,
    },
    listItem: ({ children }) => <Li>{children}</Li>,
    marks: {
      link: ({ value, children }) => (
        <ExternalLink 
          href={value.href} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {children}
        </ExternalLink>
      ),
      internalLink: ({ value, children }) => {
        const { slug = {} } = value;
        const href = `/${slug.current}`;
        return <InternalLink to={href}>{children}</InternalLink>;
      },
      strong: ({ children }) => <Strong>{children}</Strong>,
      em: ({ children }) => <Em>{children}</Em>,
      code: ({ children }) => <InlineCode>{children}</InlineCode>,
    },
  };

  return (
    <ArticleDetailContainer>
      <MetaInfoContainer>
        {author && (
          <AuthorInfo>
            <AuthorImage 
              src={author.photoURL || "https://via.placeholder.com/40"} 
              alt={author.name} 
              loading="lazy"
            />
            <AuthorDetails>
              <AuthorName>{author.name}</AuthorName>
              {author.bio && <AuthorBio>{author.bio}</AuthorBio>}
            </AuthorDetails>
          </AuthorInfo>
        )}
        <MetaText>
          {new Date(article.publishedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} • {article.readingTime} min read
        </MetaText>
      </MetaInfoContainer>

      <Title>{article.title}</Title>
      {article.subtitle && <Subtitle>{article.subtitle}</Subtitle>}

      {article.mainImage?.asset ? (
        <HeroImage
          src={urlFor(article.mainImage).width(1200).url()}
          alt={article.mainImage.alt || article.title}
          loading="eager"
        />
      ) : (
        <HeroImage 
          src="https://via.placeholder.com/1200x600" 
          alt="No image available" 
        />
      )}

      <ContentWrapper>
        <PortableText
          value={article.content}
          components={components}
        />
      </ContentWrapper>

      <Divider />
      <ArticleCounters articleId={id} user={user} />
      <CommentSection articleId={id} user={user} />
    </ArticleDetailContainer>
  );
};

// Styled Components with hardcoded values instead of theme
const ArticleDetailContainer = styled.article`
  padding: 2rem 1rem;
  max-width: 900px;
  margin: 0 auto;
  line-height: 1.6;
`;

const MetaInfoContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AuthorImage = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
`;

const AuthorDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const AuthorName = styled.span`
  font-weight: 600;
  font-size: 1rem;
  color: #333;
`;

const AuthorBio = styled.span`
  font-size: 0.875rem;
  color: #666;
`;

const MetaText = styled.span`
  font-size: 0.875rem;
  color: #666;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  line-height: 1.2;
  margin-bottom: 1rem;
  color: #333;
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
`;

const HeroImage = styled.img`
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ContentWrapper = styled.section`
  margin-top: 2rem;
`;

const Paragraph = styled.p`
  margin-bottom: 1.5rem;
  font-size: 1.125rem;
  color: #333;
`;

const H1 = styled.h1`
  font-size: 2rem;
  margin: 2rem 0 1rem;
  line-height: 1.3;
  color: #333;
`;

const H2 = styled.h2`
  font-size: 1.75rem;
  margin: 1.75rem 0 0.75rem;
  line-height: 1.3;
  color: #333;
`;

const H3 = styled.h3`
  font-size: 1.5rem;
  margin: 1.5rem 0 0.5rem;
  line-height: 1.3;
  color: #333;
`;

const H4 = styled.h4`
  font-size: 1.25rem;
  margin: 1.25rem 0 0.5rem;
  line-height: 1.3;
  color: #333;
`;

const Blockquote = styled.blockquote`
  border-left: 4px solid #007BFF;
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  background: #f5f5f5;
  font-style: italic;
  color: #666;
`;

const Ul = styled.ul`
  margin: 1.5rem 0;
  padding-left: 2rem;
  list-style-type: disc;
`;

const Ol = styled.ol`
  margin: 1.5rem 0;
  padding-left: 2rem;
  list-style-type: decimal;
`;

const Li = styled.li`
  margin-bottom: 0.5rem;
  font-size: 1.125rem;
  color: #333;
`;

const ExternalLink = styled.a`
  color: #007BFF;
  text-decoration: underline;
  &:hover {
    text-decoration: none;
  }
`;

const InternalLink = styled(Link)`
  color: #007BFF;
  text-decoration: underline;
  &:hover {
    text-decoration: none;
  }
`;

const Strong = styled.strong`
  font-weight: 600;
`;

const Em = styled.em`
  font-style: italic;
`;

const InlineCode = styled.code`
  font-family: 'Courier New', monospace;
  background: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
`;

const Figure = styled.figure`
  margin: 2rem 0;
  text-align: ${props => {
    if (props.className?.includes('left')) return 'left';
    if (props.className?.includes('right')) return 'right';
    return 'center';
  }};
  
  &.image-align-left {
    float: left;
    margin-right: 2rem;
    max-width: 50%;
  }
  
  &.image-align-right {
    float: right;
    margin-left: 2rem;
    max-width: 50%;
  }
`;

const ContentImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 0 auto;
  display: block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  object-position: ${props => 
    props.$hasHotspot 
      ? `${props.$hotspotX * 100}% ${props.$hotspotY * 100}%` 
      : 'center'};
`;

const Figcaption = styled.figcaption`
  font-size: 0.875rem;
  color: #666;
  text-align: center;
  margin-top: 0.5rem;
`;

const CodeBlock = styled.div`
  margin: 2rem 0;
  background: #f5f5f5;
  border-radius: 6px;
  overflow: hidden;
  pre {
    margin: 0;
    padding: 1rem;
    overflow-x: auto;
  }
`;

const CodeFilename = styled.div`
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.1);
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
`;

const Divider = styled.hr`
  margin: 3rem 0;
  border: none;
  border-top: 1px solid #ddd;
`;

const ErrorMessage = styled.p`
  font-size: 1.25rem;
  color: #dc3545;
  text-align: center;
  margin: 2rem 0;
`;

export default ArticleDetail;
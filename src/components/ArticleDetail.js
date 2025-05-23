import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { articleAPI, urlFor } from "../sanityClient";
import styled from "styled-components";
import ArticleCounters from "./ArticleCounters";
import CommentSection from "./CommentSection";
import { auth, onAuthStateChanged } from "../firestore";
import { PortableText } from "@portabletext/react";
import { Link } from 'react-router-dom';

const DEFAULT_ANONYMOUS_AVATAR = 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg';

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedArticle = await articleAPI.fetchById(id);
        if (!fetchedArticle) {
          throw new Error("Article not found");
        }
        setArticle(fetchedArticle);
      } catch (error) {
        console.error("Error fetching article:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    getArticle();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ? {
        name: currentUser.displayName,
        photo: currentUser.photoURL || DEFAULT_ANONYMOUS_AVATAR,
        uid: currentUser.uid,
      } : null);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) return <LoadingPlaceholder />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!article) return <ErrorMessage>Article not found.</ErrorMessage>;

  // Handle author display based on anonymous status
  const authorName = article.isAnonymous ? 'Anonymous' : article.author?.name || 'Unknown author';
  const authorImageSrc = article.isAnonymous
    ? DEFAULT_ANONYMOUS_AVATAR
    : article.author?.photoURL || DEFAULT_ANONYMOUS_AVATAR;
  const authorBio = article.isAnonymous ? '' : article.author?.bio;

  // Get main image URL
  const mainImageSrc = article.mainImage?.url || 'https://via.placeholder.com/1200x600';

  const components = {
    types: {
      image: ({ value }) => (
        <Figure $align={value.align || 'center'}>
          <ContentImage
            src={urlFor(value).width(800).url()}
            alt={value.alt || 'Article image'}
            $hasHotspot={!!value.hotspot}
            $hotspotX={value.hotspot?.x}
            $hotspotY={value.hotspot?.y}
            loading="lazy"
          />
          {value.caption && <Figcaption>{value.caption}</Figcaption>}
        </Figure>
      ),
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
      normal: ({ children, value }) => (
        <Paragraph $align={value?.textAlign}>
          {children}
        </Paragraph>
      ),
      p: ({ children, value }) => (
        <Paragraph $align={value?.textAlign}>
          {children}
        </Paragraph>
      ),
      h1: ({ children, value }) => <H1 $align={value?.textAlign}>{children}</H1>,
      h2: ({ children, value }) => <H2 $align={value?.textAlign}>{children}</H2>,
      h3: ({ children, value }) => <H3 $align={value?.textAlign}>{children}</H3>,
      h4: ({ children, value }) => <H4 $align={value?.textAlign}>{children}</H4>,
      blockquote: ({ children, value }) => (
        <Blockquote $align={value?.textAlign}>{children}</Blockquote>
      ),
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
        const href = `/${value.slug?.current || ''}`;
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
        <AuthorInfo>
          <AuthorImage
            src={authorImageSrc}
            alt={authorName}
            loading="lazy"
          />
          <AuthorDetails>
            <AuthorName>{authorName}</AuthorName>
            {authorBio && <AuthorBio>{authorBio}</AuthorBio>}
          </AuthorDetails>
        </AuthorInfo>
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
      <HeroImage
        src={mainImageSrc}
        alt={article.title}
        loading="eager"
      />

      <ContentWrapper>
        <PortableText
          value={article.content}
          components={components}
        />
      </ContentWrapper>

      <Divider />
      <ArticleCounters articleId={id} isDetailView={true} />
      <CommentSection articleId={id} user={user} />
    </ArticleDetailContainer>
  );
};

// Styled Components (all remain exactly the same as your original)
const ArticleDetailContainer = styled.article`
  padding: 2rem 1rem;
  max-width: 900px;
  margin: 0 auto;
  line-height: 1.6;
`;

const LoadingPlaceholder = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  
  &::after {
    content: "";
    width: 40px;
    height: 40px;
    border: 4px solid rgba(254, 165, 0, 0.3);
    border-top-color: #fea500;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Paragraph = styled.p`
  margin-bottom: 1.5rem;
  font-size: 1.125rem;
  color: #333;
  text-align: ${props => props.$align || 'left'};
`;

const H1 = styled.h1`
  font-size: 2rem;
  margin: 2rem 0 1rem;
  line-height: 1.3;
  color: #333;
  text-align: ${props => props.$align || 'left'};
`;

const H2 = styled.h2`
  font-size: 1.75rem;
  margin: 1.75rem 0 0.75rem;
  line-height: 1.3;
  color: #333;
  text-align: ${props => props.$align || 'left'};
`;

const H3 = styled.h3`
  font-size: 1.5rem;
  margin: 1.5rem 0 0.5rem;
  line-height: 1.3;
  color: #333;
  text-align: ${props => props.$align || 'left'};
`;

const H4 = styled.h4`
  font-size: 1.25rem;
  margin: 1.25rem 0 0.5rem;
  line-height: 1.3;
  color: #333;
  text-align: ${props => props.$align || 'left'};
`;

const Blockquote = styled.blockquote`
  border-left: 4px solid #054944;
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  background: #f5f5f5;
  font-style: italic;
  color: #666;
  text-align: ${props => props.$align || 'left'};
`;

const Figure = styled.figure`
  margin: 2rem 0;
  text-align: ${props => props.$align};
  float: ${props => props.$align === 'left' ? 'left' : props.$align === 'right' ? 'right' : 'none'};
  max-width: ${props => (props.$align === 'left' || props.$align === 'right') ? '50%' : '100%'};
  ${props => (props.$align === 'left' || props.$align === 'right') && `
    margin-${props.$align === 'left' ? 'right' : 'left'}: 2rem;
  `}

  @media (max-width: 768px) {
    float: none;
    max-width: 100%;
    margin-left: 0;
    margin-right: 0;
  }
`;

const MetaInfoContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
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
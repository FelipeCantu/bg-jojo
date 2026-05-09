import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PortableText } from '@portabletext/react';
import { client } from '../sanityClient';
import SEO from './SEO';

const portableTextComponents = {
  block: {
    h1: ({ children }) => <Heading1>{children}</Heading1>,
    h2: ({ children }) => <Heading2>{children}</Heading2>,
    h3: ({ children }) => <Heading3>{children}</Heading3>,
    normal: ({ children }) => <Paragraph>{children}</Paragraph>,
    blockquote: ({ children }) => <Blockquote>{children}</Blockquote>,
  },
  list: {
    bullet: ({ children }) => <BulletList>{children}</BulletList>,
    number: ({ children }) => <NumberList>{children}</NumberList>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    code: ({ children }) => <code>{children}</code>,
    link: ({ value, children }) => (
      <ExternalLink href={value?.href} target="_blank" rel="noopener noreferrer">
        {children}
      </ExternalLink>
    ),
  },
};

const PrivacyPolicy = () => {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .fetch(`*[_type == "legalDocument" && docType == "privacy"][0]{ title, lastUpdated, content }`)
      .then(data => setDoc(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <BackgroundWrapper>
      <PrivacyContainer>
        <SEO
          title="Privacy Policy"
          description="Read our privacy policy to understand how we collect, use, and protect your personal information on givebackjojo.org."
          path="/privacy"
        />
        {loading ? (
          <Paragraph>Loading...</Paragraph>
        ) : doc ? (
          <>
            <Heading1>{doc.title}</Heading1>
            {doc.lastUpdated && (
              <LastUpdated>
                Last updated: {new Date(doc.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </LastUpdated>
            )}
            <PortableText value={doc.content} components={portableTextComponents} />
          </>
        ) : (
          <Paragraph>Privacy Policy not found. Please check back soon.</Paragraph>
        )}
      </PrivacyContainer>
    </BackgroundWrapper>
  );
};

// Styled Components
const BackgroundWrapper = styled.div`
  background: #feedfd;
  min-height: 100vh;
  padding: 2rem 1rem;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

const PrivacyContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  line-height: 1.6;
  background: #fcd3c1;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  color: var(--text-color);
  font-family: var(--font-body);

  @media (max-width: 768px) {
    border-radius: 0;
    box-shadow: none;
  }
`;

const LastUpdated = styled.p`
  color: var(--text-light);
  font-style: italic;
  margin-bottom: 2rem;
`;

const Heading1 = styled.h1`
  font-size: 2.5rem;
  color: var(--text-color);
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.5rem;
`;

const Heading2 = styled.h2`
  font-size: 1.8rem;
  color: var(--text-color);
  margin: 2rem 0 1rem;
`;

const Heading3 = styled.h3`
  font-size: 1.4rem;
  color: var(--text-color);
  margin: 1.5rem 0 0.8rem;
`;

const Paragraph = styled.p`
  margin-bottom: 1rem;
`;

const Blockquote = styled.blockquote`
  border-left: 3px solid var(--border-color);
  margin: 1rem 0;
  padding-left: 1rem;
  color: var(--text-light);
  font-style: italic;
`;

const BulletList = styled.ul`
  margin: 1rem 0;
  padding-left: 1.5rem;
  list-style-type: none;

  li {
    margin-bottom: 0.8rem;
    position: relative;
    padding-left: 1.5rem;

    &:before {
      content: '•';
      position: absolute;
      left: 0;
      color: var(--info-color);
    }
  }
`;

const NumberList = styled.ol`
  margin: 1rem 0;
  padding-left: 2rem;

  li {
    margin-bottom: 0.8rem;
  }
`;

const ExternalLink = styled.a`
  color: var(--info-color);
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    text-decoration: underline;
  }
`;

export default PrivacyPolicy;

// NotFound.js
import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <PageContainer>
      <Content>
        <ErrorCode>404</ErrorCode>
        <Title>Page Not Found</Title>
        <Message>The page you are looking for doesn't exist or has been moved.</Message>
        <BackButton to="/home">Go back to Home</BackButton>
      </Content>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: var(--space-xl);
  background-color: #fde8ef;
  text-align: center;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  padding: 3rem 4rem;
  border-radius: 12px;
  box-shadow: var(--box-shadow);
  max-width: 500px;
  width: 100%;
`;

const ErrorCode = styled.h1`
  font-family: var(--font-heading);
  font-size: 8rem;
  font-weight: 700;
  color: var(--secondary-color);
  line-height: 1;
  margin-bottom: var(--space-sm);

  @media (max-width: 480px) {
    font-size: 5rem;
  }
`;

const Title = styled.h2`
  font-family: var(--font-heading);
  font-size: 1.75rem;
  color: var(--secondary-color);
  margin-bottom: var(--space-md);
`;

const Message = styled.p`
  font-family: var(--font-body);
  color: var(--text-light);
  font-size: 1rem;
  max-width: 400px;
  margin-bottom: var(--space-xl);
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.75rem;
  background-color: var(--accent-pink);
  color: white;
  text-decoration: none;
  border-radius: var(--border-radius);
  border: 1px solid var(--accent-pink);
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.15);
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 1rem;
  min-width: 160px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #d93d6e;
    box-shadow: 2px 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

export default NotFound;

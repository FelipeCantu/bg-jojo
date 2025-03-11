// NotFound.js
import React from 'react';
import styled from 'styled-components';

const NotFound = () => {
  return (
    <PageContainer>
      <ErrorContainer>
        <h2>404 - Page Not Found</h2>
        <p>The page you are looking for does not exist.</p>
        <BackButton href="/home">Go back to Home</BackButton>
      </ErrorContainer>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh; /* Adjust height to match your design */
  background-color: #f9f9f9; /* Light background color */
`;

const ErrorContainer = styled.div`
  text-align: center;
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
`;

const BackButton = styled.a`
  display: inline-block;
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

export default NotFound;

import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Subscriptions = () => {
  const navigate = useNavigate();

  const goToPlans = () => {
    navigate('/plans'); // Navigate to Plans & Pricing page
  };

  return (
    <SubscriptionsContainer>
      <Title>Subscriptions</Title>
      <Description>View and manage the subscriptions you've purchased.</Description>
      <NoSubscriptions>
        <p>No purchased subscriptions</p>
        <span>When you purchase a subscription, it'll appear here.</span>
      </NoSubscriptions>
      <ViewPlansButton onClick={goToPlans}>View Plans & Pricing</ViewPlansButton>
    </SubscriptionsContainer>
  );
};

// Styled Components
const SubscriptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f4f4f4;
  padding: 20px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 24px;
  margin-bottom: 5px;
`;

const Description = styled.p`
  font-size: 16px;
  color: gray;
  margin-bottom: 20px;
`;

const NoSubscriptions = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin-bottom: 20px;

  p {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  span {
    font-size: 14px;
    color: gray;
  }
`;

const ViewPlansButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

export default Subscriptions;

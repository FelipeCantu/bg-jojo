import React from 'react';
import styled from 'styled-components';

const Notifications = () => {
  return (
    <NotificationsContainer>
      <Title>Notifications</Title>
      <NoNotifications>
        <p>No Notifications Yet</p>
        <span>Make comments, like posts or follow members to get things going.</span>
      </NoNotifications>
    </NotificationsContainer>
  );
};

// Styled Components
const NotificationsContainer = styled.div`
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
  margin-bottom: 15px;
`;

const NoNotifications = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  max-width: 400px;

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

export default Notifications;

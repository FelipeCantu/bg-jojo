import React, { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import styled from 'styled-components';
import { client, realtimeClient } from '../../sanityClient';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseconfig';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const sanityUser = await realtimeClient.fetch(
            `*[_type == "user" && _id == $firebaseUid][0]`,
            { firebaseUid: user.uid }
          );
          
          if (sanityUser) {
            setCurrentUser({
              ...user,
              sanityId: sanityUser._id
            });
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser?.sanityId) return;

    const fetchUnreadCount = async () => {
      try {
        const count = await realtimeClient.fetch(
          `count(*[_type == "notification" && user._ref == $userId && seen == false])`,
          { userId: currentUser.sanityId }
        );
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Set up real-time listener
    const subscription = client.listen(
      `*[_type == "notification" && user._ref == $userId && seen == false]`,
      { userId: currentUser.sanityId }
    ).subscribe(() => {
      fetchUnreadCount();
    });

    return () => subscription.unsubscribe();
  }, [currentUser?.sanityId]);

  const handleClick = () => {
    navigate('/notifications');
  };

  return (
    <NotificationContainer>
      <BellButton onClick={handleClick} aria-label="Notifications">
        {unreadCount > 0 ? (
          <>
            <BellAlertIcon className="icon solid" />
            <Badge>{unreadCount > 9 ? '9+' : unreadCount}</Badge>
          </>
        ) : (
          <BellIcon className="icon" />
        )}
      </BellButton>
    </NotificationContainer>
  );
};

const NotificationContainer = styled.div`
  position: relative;
  margin-left: 1rem;
`;

const BellButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(4, 73, 71, 0.1); 
  }

  .icon {
    width: 24px;
    height: 24px;
    color: #666;
  }

  .solid {
    color: #044947; 
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  background: red;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
`;

export default NotificationBell;
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
  ChatBubbleOvalLeftIcon as ChatAltIcon,
  UserPlusIcon as UserAddIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {HeartIcon} from '@heroicons/react/24/solid';
import { auth } from '../../firebaseconfig';
import { client } from '../../sanityClient';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const formatTime = useCallback((date) => {
    if (!date) return 'Just now';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Just now';

    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  // Fetch current user
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        setError("Please sign in to view notifications");
        return;
      }

      try {
        const sanityUser = await client.fetch(
          `*[_type == "user" && uid == $firebaseUid][0]`,
          { firebaseUid: user.uid }
        );

        if (!sanityUser) throw new Error("User not found in Sanity");
        setCurrentUser({ ...user, sanityId: sanityUser._id });
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user data");
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch notifications with proper sorting
  useEffect(() => {
    if (!currentUser?.sanityId) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const fetched = await client.fetch(
          `*[_type == "notification" && user._ref == $userId] | order(createdAt desc) {
            _id,
            type,
            message,
            link,
            createdAt,
            readAt,
            seen,
            sender->{
              _id,
              name,
              photoURL
            },
            relatedArticle->{
              _id,
              title,
              slug
            },
            relatedComment->{
              _id,
              text,
              article->{
                _id,
                title
              }
            }
          }`,
          { userId: currentUser.sanityId }
        );

        // Ensure proper sorting (newest first)
        const sortedNotifications = Array.isArray(fetched) 
          ? [...fetched].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [];
          
        setNotifications(sortedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    const subscription = client.listen(
      `*[_type == "notification" && user._ref == $userId] | order(createdAt desc)`,
      { userId: currentUser.sanityId }
    ).subscribe((update) => {
      if (update.result) {
        setNotifications(prev => {
          // Process new notifications
          const newNotifications = Array.isArray(update.result) 
            ? update.result.map(n => ({
                ...n,
                createdAt: n.createdAt || new Date().toISOString()
              }))
            : [{
                ...update.result,
                createdAt: update.result.createdAt || new Date().toISOString()
              }];
          
          // Merge and deduplicate with newest first
          const merged = [...newNotifications, ...prev]
            .filter((n, index, self) => 
              index === self.findIndex(t => t._id === n._id)
            )
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
          return merged;
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [currentUser]);
  const markNotificationAsRead = async (notificationId) => {
    try {
      await client.patch(notificationId)
        .set({ seen: true, readAt: new Date().toISOString() })
        .commit();

      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, seen: true, readAt: new Date().toISOString() } : n
      ));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.seen);
    if (unreadNotifications.length === 0) return;

    try {
      const transaction = client.transaction();
      unreadNotifications.forEach(n => {
        transaction.patch(n._id, { set: { seen: true, readAt: new Date().toISOString() } });
      });
      await transaction.commit();

      setNotifications(prev => prev.map(n => ({ 
        ...n, 
        seen: true, 
        readAt: n.seen ? n.readAt : new Date().toISOString() 
      })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation(); // Prevent triggering the notification click
    try {
      await client.delete(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const deleteAllNotifications = async () => {
    if (notifications.length === 0) return;
    
    try {
      const transaction = client.transaction();
      notifications.forEach(n => {
        transaction.delete(n._id);
      });
      await transaction.commit();
      setNotifications([]);
    } catch (err) {
      console.error("Error deleting all notifications:", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <StyledHeartIcon />;
      case 'comment':
        return <StyledChatIcon />;
      case 'follow':
        return <StyledFollowIcon />;
      default:
        return <DefaultIcon />;
    }
  };
  
  const getNotificationMessage = (notification) => {
    const senderName = notification.sender?.name || 'Someone';
    const currentUserIsSender = notification.sender?._id === currentUser?.sanityId;

    switch (notification.type) {
      case 'like':
        return `${currentUserIsSender ? 'You' : senderName} liked your article ${notification.relatedArticle?.title ? `"${notification.relatedArticle.title}"` : 'article'}`;
      case 'comment':
        return `${currentUserIsSender ? 'You' : senderName} commented on your ${notification.relatedArticle?.title ? `"${notification.relatedArticle.title}"` : 'article'}`;
      case 'follow':
        return `${currentUserIsSender ? 'You' : senderName} started following you`;
      case 'mention':
        return `${currentUserIsSender ? 'You' : senderName} mentioned you in ${notification.relatedArticle?.title ? `"${notification.relatedArticle.title}"` : 'a article'}`;
      default:
        return notification.message || 'New activity on your content';
    }
  };

  const handleNotificationClick = useCallback((notification) => {
    if (!notification.seen) {
      markNotificationAsRead(notification._id);
    }
    
    if (notification.relatedArticle?.slug?.current) {
      navigate(`/articles/${notification.relatedArticle.slug.current}`);
    } else if (notification.link) {
      window.open(notification.link, '_blank');
    }
  }, [navigate]);

  if (loading) return <Loader>Loading notifications...</Loader>;
  if (error) return <Error>{error}</Error>;

  return (
    <Container>
          <Header>
        <h2>Your Notifications</h2>
        <HeaderActions>
          <Badge>{notifications.filter(n => !n.seen).length}</Badge>
          {notifications.length > 0 && (
            <ActionButtons>
              {notifications.some(n => !n.seen) && (
                <ActionButton onClick={markAllAsRead}>
                  Mark all as read
                </ActionButton>
              )}
              <ActionButton data-danger onClick={deleteAllNotifications}>
                Delete all
              </ActionButton>
            </ActionButtons>
          )}
        </HeaderActions>
      </Header>

      {notifications.length === 0 ? (
        <EmptyState>
          <Title>No notifications yet</Title>
          <Hint>Likes, comments, and follows will appear here</Hint>
        </EmptyState>
      ) : (
        <List>
        {notifications.map(notification => (
          <NotificationItem
            key={notification._id}
            data-unread={!notification.seen}
            onClick={() => handleNotificationClick(notification)}
            aria-label={getNotificationMessage(notification)}
          >
            <AvatarWrapper>
              {notification.sender?.photoURL ? (
                <NotificationAvatar
                  src={notification.sender.photoURL}
                  alt={notification.sender.name}
                  onError={(e) => (e.target.src = '/default-avatar.png')}
                />
              ) : (
                <DefaultAvatar>
                  {notification.sender?.name?.charAt(0) || 'U'}
                </DefaultAvatar>
              )}
              <NotificationBadge>
                {getNotificationIcon(notification.type)}
              </NotificationBadge>
            </AvatarWrapper>
      
            <Content>
              <Message>{getNotificationMessage(notification)}</Message>
              <Time>
                {formatTime(notification.createdAt)}
                {notification.seen && notification.readAt && (
                  <ReadTime> • Read {formatTime(notification.readAt)}</ReadTime>
                )}
              </Time>
            </Content>
      
            <DeleteButton
              onClick={(e) => deleteNotification(notification._id, e)}
              aria-label="Delete notification"
            >
              <TrashIcon className="h-4 w-4" />
            </DeleteButton>
      
            {!notification.seen && <UnreadIndicator data-unread={!notification.seen} />}
          </NotificationItem>
        ))}
      </List>
      
      )}
    </Container>
  );
};

// Updated Styled Components
const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
`;

const Loader = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const Error = styled.div`
  text-align: center;
  padding: 20px;
  color: #d32f2f;
  background: #ffebee;
  border-radius: 8px;
  margin: 20px 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: ${({ 'data-danger': danger }) => danger ? '#fee2e2' : '#ecfdf5'};
  color: ${({ 'data-danger': danger }) => danger ? '#b91c1c' : '#064e3b'};
  border: none;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: ${({ 'data-danger': danger }) => danger ? '#fecaca' : '#d1fae5'};
  }
`;

const Badge = styled.span`
  background: #044947;
  color: white;
  border-radius: 9999px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  background: #f9fafb;
  border-radius: 8px;
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #111827;
`;

const Hint = styled.p`
  color: #6b7280;
  font-size: 14px;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NotificationItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border-radius: 8px;
  background: ${({ 'data-unread': unread }) => unread ? '#f8fafc' : 'white'};
  cursor: pointer;
  transition: all 0.2s;
  gap: 12px;
  border-left: 3px solid ${({ 'data-unread': unread }) => unread ? '#044947' : 'transparent'};
  box-shadow: ${({ 'data-unread': unread }) => unread ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'};
  position: relative;

  &:hover {
    background: ${({ 'data-unread': unread }) => unread ? 'rgba(4, 73, 71, 0.05)' : '#f9fafb'};
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
`;

const UnreadIndicator = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #044947;
  display: ${({ 'data-unread': unread }) => unread ? 'block' : 'none'};
`;

const AvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const DefaultAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #4b5563;
  font-size: 16px;
`;

const NotificationAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #f1f1f1;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
`;

const NotificationBadge = styled.div`
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #f1f1f1;
`;

const Content = styled.div`
  flex: 1;
`;

const Message = styled.p`
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #111827;
  line-height: 1.4;
`;

const Time = styled.span`
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
`;

const ReadTime = styled.span`
  color: #9ca3af;
  margin-left: 4px;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-left: 8px;

  &:hover {
    color: #ef4444;
    background: #fee2e2;
  }
`;

const StyledHeartIcon = styled(HeartIcon)`
  width: 20px;
  height: 20px;
  color: #ef4444;
`;

const StyledChatIcon = styled(ChatAltIcon)`
  width: 20px;
  height: 20px;
  color: #3b82f6; /* blue-500 */
`;

const StyledFollowIcon = styled(UserAddIcon)`
  width: 20px;
  height: 20px;
  color: #10b981; /* green-500 */
`;

const DefaultIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background-color: #d1d5db; /* gray-300 */
`;


export default Notifications;
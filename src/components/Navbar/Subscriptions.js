import React, { useState, useEffect, useCallback } from 'react';
import { FaHeart } from 'react-icons/fa';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { useAuth } from '../../context/AuthContext';

const Subscriptions = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  const fetchSubscriptions = useCallback(async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      const db = getFirestore();
      const q = query(
        collection(db, 'donations'),
        where('userId', '==', currentUser.uid),
        where('frequency', '==', 'monthly'),
        orderBy('createdAt', 'desc'),
      );
      const snapshot = await getDocs(q);
      const subs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubscriptions(subs);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleCancel = async (donationId) => {
    setCancellingId(donationId);
    try {
      const functions = getFunctions(getApp(), 'us-central1');
      const api = httpsCallable(functions, 'api');
      await api({ endpoint: 'cancelDonationSubscription', donationId });
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === donationId ? { ...sub, status: 'cancelled' } : sub,
        ),
      );
      setConfirmCancelId(null);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <StatusBadge $status="active">Active</StatusBadge>;
      case 'cancelled':
        return <StatusBadge $status="cancelled">Cancelled</StatusBadge>;
      case 'failed':
        return <StatusBadge $status="failed">Failed</StatusBadge>;
      case 'pending':
        return <StatusBadge $status="pending">Pending</StatusBadge>;
      default:
        return <StatusBadge $status="pending">{status}</StatusBadge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <ContainerWrapper>
        <Container>
          <Title>Subscriptions</Title>
          <Subtitle>View and manage your recurring donations.</Subtitle>
          <ContentArea>
            <NoSubscriptions>
              <EmptyStateIcon>🔒</EmptyStateIcon>
              <h3>Sign in to view subscriptions</h3>
              <p>You need to be logged in to see your subscriptions.</p>
              <ActionButton onClick={() => navigate('/auth')}>
                Log In
              </ActionButton>
            </NoSubscriptions>
          </ContentArea>
        </Container>
      </ContainerWrapper>
    );
  }

  return (
    <ContainerWrapper>
      <Container>
        <Title>Subscriptions</Title>
        <Subtitle>View and manage your recurring donations.</Subtitle>

        {loading ? (
          <ContentArea>
            <LoadingWrapper>
              <LoadingSpinner />
              <p>Loading subscriptions...</p>
            </LoadingWrapper>
          </ContentArea>
        ) : subscriptions.length === 0 ? (
          <ContentArea>
            <NoSubscriptions>
              <EmptyStateIcon><FaHeart /></EmptyStateIcon>
              <h3>No subscriptions found</h3>
              <p>
                When you set up a monthly donation, it will appear here.
              </p>
              <ActionButton onClick={() => navigate('/donate')}>
                Make a Donation
              </ActionButton>
            </NoSubscriptions>
          </ContentArea>
        ) : (
          <SubscriptionList>
            {subscriptions.map((sub) => (
              <SubscriptionCard key={sub.id}>
                <CardHeader>
                  <AmountLabel>
                    ${sub.amount?.toFixed(2)}
                    <FrequencyLabel>/month</FrequencyLabel>
                  </AmountLabel>
                  {getStatusBadge(sub.status)}
                </CardHeader>

                {sub.tierDescription && (
                  <TierDescription>{sub.tierDescription}</TierDescription>
                )}

                <CardDetails>
                  <DetailRow>
                    <DetailLabel>Started</DetailLabel>
                    <DetailValue>{formatDate(sub.createdAt)}</DetailValue>
                  </DetailRow>
                  {sub.paidAt && (
                    <DetailRow>
                      <DetailLabel>Last payment</DetailLabel>
                      <DetailValue>{formatDate(sub.paidAt)}</DetailValue>
                    </DetailRow>
                  )}
                  {sub.cancelledAt && (
                    <DetailRow>
                      <DetailLabel>Cancelled</DetailLabel>
                      <DetailValue>{formatDate(sub.cancelledAt)}</DetailValue>
                    </DetailRow>
                  )}
                  <DetailRow>
                    <DetailLabel>Payment method</DetailLabel>
                    <DetailValue>
                      {sub.paymentMethod === 'stripe_checkout'
                        ? 'Secure Checkout'
                        : 'Credit Card'}
                    </DetailValue>
                  </DetailRow>
                </CardDetails>

                {sub.status === 'active' && (
                  <CardFooter>
                    {confirmCancelId === sub.id ? (
                      <ConfirmRow>
                        <ConfirmText>Cancel this subscription?</ConfirmText>
                        <ConfirmButtons>
                          <CancelConfirmButton
                            onClick={() => handleCancel(sub.id)}
                            disabled={cancellingId === sub.id}
                          >
                            {cancellingId === sub.id
                              ? 'Cancelling...'
                              : 'Yes, cancel'}
                          </CancelConfirmButton>
                          <KeepButton
                            onClick={() => setConfirmCancelId(null)}
                          >
                            Keep it
                          </KeepButton>
                        </ConfirmButtons>
                      </ConfirmRow>
                    ) : (
                      <CancelButton
                        onClick={() => setConfirmCancelId(sub.id)}
                      >
                        Cancel Subscription
                      </CancelButton>
                    )}
                  </CardFooter>
                )}
              </SubscriptionCard>
            ))}
          </SubscriptionList>
        )}
      </Container>
    </ContainerWrapper>
  );
};

// Styled Components
const ContainerWrapper = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: #fce4ec;
  padding: 0;
  overflow: hidden;
  width: 100%;

  @media (min-width: 768px) {
    padding: 2rem 0;
    align-items: center;
  }
`;

const Container = styled.div`
  padding: 2rem;
  width: 100%;
  height: 100vh;
  margin: 0;
  background: rgba(255, 255, 255, 0.95);
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-shadow: var(--box-shadow);
  border-radius: 0;

  @media (min-width: 768px) {
    padding: 3rem;
    max-width: 800px;
    height: auto;
    min-height: auto;
    border-radius: var(--border-radius);
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--secondary-color);
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #666;
  margin-bottom: 2rem;
  text-align: center;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const NoSubscriptions = styled.div`
  background: white;
  padding: 3rem 2rem;
  border-radius: var(--border-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
  text-align: center;
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  h3 {
    font-size: 1.25rem;
    color: var(--secondary-color);
    margin: 0;
  }

  p {
    color: #666;
    margin-bottom: 1rem;
    line-height: 1.5;
  }
`;

const EmptyStateIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  background: #fce4ec;
  color: #e91e63;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
`;

const ActionButton = styled.button`
  background-color: var(--secondary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background-color: var(--secondary-color-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const LoadingWrapper = styled.div`
  text-align: center;
  color: #666;

  p {
    margin-top: 1rem;
  }
`;

const LoadingSpinner = styled.div`
  width: 36px;
  height: 36px;
  border: 3px solid #e0e0e0;
  border-top: 3px solid var(--secondary-color);
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const SubscriptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SubscriptionCard = styled.div`
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const AmountLabel = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--secondary-color);
`;

const FrequencyLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 400;
  color: #888;
  margin-left: 0.15rem;
`;

const StatusBadge = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  text-transform: capitalize;

  ${(p) => {
    switch (p.$status) {
      case 'active':
        return 'background: #e8f5e9; color: #2e7d32;';
      case 'cancelled':
        return 'background: #fce4ec; color: #c62828;';
      case 'failed':
        return 'background: #fff3e0; color: #e65100;';
      default:
        return 'background: #f5f5f5; color: #666;';
    }
  }}
`;

const TierDescription = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 0.75rem;
  line-height: 1.4;
  font-style: italic;
`;

const CardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem 0;
  border-top: 1px solid #f0f0f0;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DetailLabel = styled.span`
  font-size: 0.85rem;
  color: #999;
`;

const DetailValue = styled.span`
  font-size: 0.85rem;
  color: #333;
  font-weight: 500;
`;

const CardFooter = styled.div`
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
  margin-top: 0.25rem;
`;

const CancelButton = styled.button`
  background: none;
  border: 1px solid #e0e0e0;
  color: #999;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;

  &:hover {
    border-color: #c62828;
    color: #c62828;
  }
`;

const ConfirmRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const ConfirmText = styled.span`
  font-size: 0.9rem;
  color: #c62828;
  font-weight: 500;
`;

const ConfirmButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const CancelConfirmButton = styled.button`
  background: #c62828;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.2s;

  &:hover {
    background: #b71c1c;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const KeepButton = styled.button`
  background: none;
  border: 1px solid #e0e0e0;
  color: #666;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;

  &:hover {
    border-color: #333;
    color: #333;
  }
`;

export default Subscriptions;

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const MyOrderHistory = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      const db = getFirestore();
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(results);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
    return <StatusBadge $status={status || 'pending'}>{label}</StatusBadge>;
  };

  const truncateId = (id) => id ? `#${id.slice(0, 8)}` : '';

  if (authLoading) {
    return <Loading>Loading...</Loading>;
  }

  if (!currentUser) {
    return <Message>Please log in to view your orders.</Message>;
  }

  if (loading) {
    return (
      <Container>
        <Title>Order History</Title>
        <Description>View your past purchases</Description>
        <LoadingWrapper>
          <LoadingSpinner />
          <p>Loading orders...</p>
        </LoadingWrapper>
      </Container>
    );
  }

  if (orders.length === 0) {
    return (
      <Container>
        <Title>Order History</Title>
        <Description>View your past purchases</Description>
        <EmptyState>No orders yet</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Order History</Title>
      <Description>View your past purchases</Description>

      <OrderList>
        {orders.map((order) => (
          <OrderCard key={order.id}>
            <CardHeader>
              <OrderId>{truncateId(order.id)}</OrderId>
              {getStatusBadge(order.status)}
            </CardHeader>

            <CardDetails>
              <DetailRow>
                <DetailLabel>Date</DetailLabel>
                <DetailValue>{formatDate(order.createdAt)}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Total</DetailLabel>
                <DetailValue>${(order.total || 0).toFixed(2)}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Payment</DetailLabel>
                <DetailValue>
                  {order.paymentMethod === 'stripe_checkout'
                    ? 'Secure Checkout'
                    : 'Credit Card'}
                </DetailValue>
              </DetailRow>
            </CardDetails>

            {order.items && order.items.length > 0 && (
              <ItemsSection>
                <ItemsHeader>Items ({order.items.length})</ItemsHeader>
                {order.items.map((item, idx) => (
                  <ItemRow key={idx}>
                    <ItemName>{item.name}</ItemName>
                    <ItemMeta>
                      {item.selectedSize && <span>{item.selectedSize}</span>}
                      <span>Qty: {item.quantity || 1}</span>
                      <span>${(item.price || 0).toFixed(2)}</span>
                    </ItemMeta>
                  </ItemRow>
                ))}
              </ItemsSection>
            )}

            {order.shippingInfo && (
              <>
                <ToggleButton onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                  {expandedId === order.id ? 'Hide' : 'Show'} Shipping Info
                </ToggleButton>
                {expandedId === order.id && (
                  <ShippingSection>
                    {order.shippingInfo.name && (
                      <DetailRow>
                        <DetailLabel>Name</DetailLabel>
                        <DetailValue>{order.shippingInfo.name}</DetailValue>
                      </DetailRow>
                    )}
                    {order.shippingInfo.address && (
                      <DetailRow>
                        <DetailLabel>Address</DetailLabel>
                        <DetailValue>{order.shippingInfo.address}</DetailValue>
                      </DetailRow>
                    )}
                    {(order.shippingInfo.city || order.shippingInfo.state || order.shippingInfo.zip) && (
                      <DetailRow>
                        <DetailLabel>Location</DetailLabel>
                        <DetailValue>
                          {[order.shippingInfo.city, order.shippingInfo.state, order.shippingInfo.zip]
                            .filter(Boolean)
                            .join(', ')}
                        </DetailValue>
                      </DetailRow>
                    )}
                  </ShippingSection>
                )}
              </>
            )}
          </OrderCard>
        ))}
      </OrderList>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 95%;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
`;

const Title = styled.h2`
  font-size: 1.75rem;
  color: var(--secondary-color);
  margin: 0 0 0.5rem 0;
`;

const Description = styled.p`
  color: #666;
  margin: 0 0 2rem 0;
`;

const OrderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OrderCard = styled.div`
  background: #f9f9f9;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 1.25rem;
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

const OrderId = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: var(--secondary-color);
  font-family: monospace;
`;

const StatusBadge = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  text-transform: capitalize;

  ${(p) => {
    switch (p.$status) {
      case 'paid':
        return 'background: #e8f5e9; color: #2e7d32;';
      case 'shipped':
        return 'background: #e3f2fd; color: #1565c0;';
      case 'failed':
        return 'background: #fce4ec; color: #c62828;';
      case 'pending':
        return 'background: #fff3e0; color: #e65100;';
      default:
        return 'background: #f5f5f5; color: #666;';
    }
  }}
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

const ItemsSection = styled.div`
  padding: 0.75rem 0;
  border-top: 1px solid #f0f0f0;
`;

const ItemsHeader = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.5rem;
`;

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.35rem 0;
`;

const ItemName = styled.span`
  font-size: 0.85rem;
  color: #333;
`;

const ItemMeta = styled.div`
  display: flex;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: #888;
`;

const ToggleButton = styled.button`
  background: none;
  border: 1px solid #e0e0e0;
  color: #666;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  transition: all 0.2s;

  &:hover {
    border-color: var(--secondary-color);
    color: var(--secondary-color);
  }
`;

const ShippingSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem 0;
  margin-top: 0.5rem;
  border-top: 1px dashed #e0e0e0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #888;
  background: #f9f9f9;
  border-radius: 8px;
`;

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

const Message = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #f5f5f5;
  border-radius: 8px;
`;

const LoadingWrapper = styled.div`
  text-align: center;
  color: #666;
  padding: 2rem;

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

export default MyOrderHistory;

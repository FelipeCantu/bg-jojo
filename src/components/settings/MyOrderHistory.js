import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../context/AuthContext';

const MyOrderHistory = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnItems, setReturnItems] = useState(new Set());
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      const db = getFirestore();
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        });
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
    const labels = { refund_requested: 'Return Pending', return_approved: 'Return Approved', refunded: 'Refunded' };
    const label = labels[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending');
    return <StatusBadge $status={status || 'pending'}>{label}</StatusBadge>;
  };

  const openReturnModal = (order) => {
    setReturnOrder(order);
    setReturnReason('');
    setReturnItems(new Set(order.items.map((_, i) => i)));
  };

  const closeReturnModal = () => {
    setReturnOrder(null);
    setReturnReason('');
    setReturnItems(new Set());
  };

  const toggleReturnItem = (idx) => {
    setReturnItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAllReturnItems = () => {
    if (!returnOrder) return;
    if (returnItems.size === returnOrder.items.length) {
      setReturnItems(new Set());
    } else {
      setReturnItems(new Set(returnOrder.items.map((_, i) => i)));
    }
  };

  const refundTotal = returnOrder
    ? returnOrder.items.reduce((sum, item, idx) => {
        if (returnItems.has(idx)) {
          return sum + (item.price || 0) * (item.quantity || 1);
        }
        return sum;
      }, 0)
    : 0;

  const handleReturnRequest = async () => {
    if (!returnOrder || submittingReturn || returnItems.size === 0) return;
    setSubmittingReturn(true);
    try {
      const functions = getFunctions(getApp(), 'us-central1');
      const api = httpsCallable(functions, 'api');
      await api({
        endpoint: 'requestRefund',
        orderId: returnOrder.id,
        reason: returnReason,
        returnItems: Array.from(returnItems),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === returnOrder.id ? { ...o, status: 'refund_requested' } : o))
      );
      closeReturnModal();
    } catch (error) {
      console.error('Error requesting return:', error);
      alert(error.message || 'Failed to submit return request. Please try again.');
    } finally {
      setSubmittingReturn(false);
    }
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

            {['paid', 'shipped'].includes(order.status) && (
              <ReturnButton onClick={() => openReturnModal(order)}>
                Request Return
              </ReturnButton>
            )}
            {order.status === 'refund_requested' && (
              <ReturnStatus>Return request submitted — we'll review it shortly.</ReturnStatus>
            )}
            {order.status === 'return_approved' && (
              <ReturnStatus $approved>Return approved — please ship the item back.</ReturnStatus>
            )}
            {order.status === 'refunded' && (
              <ReturnStatus $refunded>This order has been refunded.</ReturnStatus>
            )}
          </OrderCard>
        ))}
      </OrderList>

      {returnOrder && (
        <ModalOverlay onClick={closeReturnModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Request a Return</ModalTitle>
            <ModalText>Select the items you'd like to return.</ModalText>
            <ReturnSteps>
              <ReturnStepsTitle>How it works:</ReturnStepsTitle>
              <ReturnStepsList>
                <li>Select items and submit your return request</li>
                <li>Our team will review and approve or deny it</li>
                <li>If approved, ship the items back to us</li>
                <li>Once we receive them, your refund will be processed</li>
              </ReturnStepsList>
            </ReturnSteps>
            <ItemChecklist>
              <SelectAllRow onClick={toggleAllReturnItems}>
                <ItemCheckbox
                  type="checkbox"
                  checked={returnItems.size === returnOrder.items.length}
                  readOnly
                />
                <span>{returnItems.size === returnOrder.items.length ? 'Deselect All' : 'Select All'}</span>
              </SelectAllRow>
              {returnOrder.items.map((item, idx) => (
                <ItemCheckRow key={idx} onClick={() => toggleReturnItem(idx)}>
                  <ItemCheckbox
                    type="checkbox"
                    checked={returnItems.has(idx)}
                    readOnly
                  />
                  <ItemCheckInfo>
                    <span>{item.name}</span>
                    <ItemCheckMeta>
                      {item.selectedSize && <span>{item.selectedSize}</span>}
                      <span>Qty: {item.quantity || 1}</span>
                      <span>${(item.price || 0).toFixed(2)}</span>
                    </ItemCheckMeta>
                  </ItemCheckInfo>
                </ItemCheckRow>
              ))}
            </ItemChecklist>
            <RefundTotal>
              Refund total: <strong>${refundTotal.toFixed(2)}</strong>
            </RefundTotal>
            <ReturnTextarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Reason for return (optional)"
              maxLength={500}
            />
            <ModalActions>
              <ModalCancel onClick={closeReturnModal}>
                Cancel
              </ModalCancel>
              <ModalSubmit onClick={handleReturnRequest} disabled={submittingReturn || returnItems.size === 0}>
                {submittingReturn ? 'Submitting...' : 'Submit Request'}
              </ModalSubmit>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
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
      case 'refund_requested':
        return 'background: #fff3e0; color: #e65100;';
      case 'return_approved':
        return 'background: #e3f2fd; color: #0d47a1;';
      case 'refunded':
        return 'background: #ede7f6; color: #4527a0;';
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

const ReturnButton = styled.button`
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid #c62828;
  color: #c62828;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: #c62828;
    color: white;
  }
`;

const ReturnStatus = styled.div`
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  border-radius: 6px;
  background: ${(p) => (p.$refunded ? '#ede7f6' : p.$approved ? '#e3f2fd' : '#fff3e0')};
  color: ${(p) => (p.$refunded ? '#4527a0' : p.$approved ? '#0d47a1' : '#e65100')};
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: #333;
`;

const ModalText = styled.p`
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: #666;
`;

const ReturnSteps = styled.div`
  background: #f5f5f5;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
`;

const ReturnStepsTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.4rem;
`;

const ReturnStepsList = styled.ol`
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.8rem;
  color: #555;
  line-height: 1.6;
`;

const ReturnTextarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--secondary-color, #024a47);
    box-shadow: 0 0 0 2px rgba(2, 74, 71, 0.15);
  }
`;

const ItemChecklist = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
`;

const SelectAllRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  user-select: none;

  &:hover {
    background: #eeeeee;
  }
`;

const ItemCheckRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;

  &:hover {
    background: #f9f9f9;
  }

  & + & {
    border-top: 1px solid #f0f0f0;
  }
`;

const ItemCheckbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: var(--secondary-color, #024a47);
  cursor: pointer;
  flex-shrink: 0;
  pointer-events: none;
`;

const ItemCheckInfo = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 0.85rem;
  color: #333;
`;

const ItemCheckMeta = styled.div`
  display: flex;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.15rem;
`;

const RefundTotal = styled.div`
  text-align: right;
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  border-top: 1px solid #e0e0e0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const ModalCancel = styled.button`
  padding: 0.5rem 1.25rem;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #333;

  &:hover {
    background: #e0e0e0;
  }
`;

const ModalSubmit = styled.button`
  padding: 0.5rem 1.25rem;
  background: #c62828;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;

  &:hover {
    background: #b71c1c;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

export default MyOrderHistory;

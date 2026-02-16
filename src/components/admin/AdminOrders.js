import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { getFirestore, collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

const STATUS_TABS = ['all', 'pending', 'paid', 'shipped', 'refund_requested', 'return_approved', 'refunded', 'failed'];

const AdminOrders = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [updatingId, setUpdatingId] = useState(null);
  const [processingRefund, setProcessingRefund] = useState(null);
  const [archiving, setArchiving] = useState(false);

  const handleApproveRefund = async (orderId) => {
    if (!window.confirm('Approve this return? The customer will be asked to ship the item back.')) return;
    setProcessingRefund(orderId);
    try {
      const functions = getFunctions(getApp(), 'us-central1');
      const api = httpsCallable(functions, 'api');
      await api({ endpoint: 'approveRefund', orderId });
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'return_approved' } : o))
      );
    } catch (error) {
      console.error('Error approving return:', error);
      const msg = error?.details?.message || error?.message || 'Failed to approve return';
      alert(msg);
    } finally {
      setProcessingRefund(null);
    }
  };

  const handleProcessRefund = async (orderId) => {
    if (!window.confirm('Process the Stripe refund for this order? This will send money back to the customer.')) return;
    setProcessingRefund(orderId);
    try {
      const functions = getFunctions(getApp(), 'us-central1');
      const api = httpsCallable(functions, 'api');
      await api({ endpoint: 'processRefund', orderId });
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'refunded' } : o))
      );
    } catch (error) {
      console.error('Error processing refund:', error);
      const msg = error?.details?.message || error?.message || 'Failed to process refund';
      alert(msg);
    } finally {
      setProcessingRefund(null);
    }
  };

  const handleDenyRefund = async (orderId) => {
    const reason = window.prompt('Reason for denying this return (optional):');
    if (reason === null) return; // user cancelled
    setProcessingRefund(orderId);
    try {
      const functions = getFunctions(getApp(), 'us-central1');
      const api = httpsCallable(functions, 'api');
      await api({ endpoint: 'denyRefund', orderId, denyReason: reason });
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'paid' } : o))
      );
    } catch (error) {
      console.error('Error denying refund:', error);
      alert(error.message || 'Failed to deny refund');
    } finally {
      setProcessingRefund(null);
    }
  };

  const handleArchiveSelected = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!window.confirm(`Archive ${count} order${count > 1 ? 's' : ''}? They will be moved to archivedOrders and removed from this list.`)) return;
    setArchiving(true);
    try {
      const functions = getFunctions(getApp(), 'us-central1');
      const api = httpsCallable(functions, 'api');
      await api({ endpoint: 'archiveOrders', orderIds: Array.from(selectedIds) });
      setAllOrders((prev) => prev.filter((o) => !selectedIds.has(o.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error archiving orders:', error);
      const msg = error?.details?.message || error?.message || 'Failed to archive orders';
      alert(msg);
    } finally {
      setArchiving(false);
    }
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllOrders(results);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const orders = activeTab === 'all'
    ? allOrders
    : allOrders.filter((o) => o.status === activeTab);

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const db = getFirestore();
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };
      if (newStatus === 'shipped') {
        updateData.shippedAt = serverTimestamp();
      }
      await updateDoc(doc(db, 'orders', orderId), updateData);
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(orders.map((o) => o.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const exportCSV = () => {
    const selected = orders.filter((o) => selectedIds.has(o.id));
    if (selected.length === 0) return;

    const headers = ['Name', 'Email', 'Address Line 1', 'Address Line 2', 'City', 'State', 'Zip', 'Country', 'Phone'];

    const escapeCSV = (val) => {
      const str = String(val || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = selected.map((order) => {
      const s = order.shippingInfo || {};
      const name = [s.firstName, s.lastName].filter(Boolean).join(' ');
      return [
        name,
        s.email,
        s.address,
        s.addressLine2,
        s.city,
        s.state,
        s.zipCode,
        s.country,
        s.phone,
      ].map(escapeCSV).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getItemsSummary = (items) => {
    if (!items || items.length === 0) return 'No items';
    if (items.length === 1) return items[0].name;
    return `${items[0].name} +${items.length - 1} more`;
  };

  return (
    <PageWrapper>
    <Container>
      <Header>
        <Title>Admin Orders</Title>
        <HeaderActions>
          <BulkActions>
            <SmallButton onClick={selectAll}>Select All</SmallButton>
            <SmallButton onClick={deselectAll}>Deselect All</SmallButton>
          </BulkActions>
          {selectedIds.size > 0 && (
            <ArchiveButton onClick={handleArchiveSelected} disabled={archiving}>
              {archiving ? 'Archiving...' : `Archive Selected (${selectedIds.size})`}
            </ArchiveButton>
          )}
          <ExportButton onClick={exportCSV} disabled={selectedIds.size === 0}>
            Export CSV ({selectedIds.size})
          </ExportButton>
        </HeaderActions>
      </Header>

      <Tabs>
        {STATUS_TABS.map((tab) => {
          const tabLabels = { refund_requested: 'Returns', return_approved: 'Awaiting Item', refunded: 'Refunded' };
          const label = tabLabels[tab] || (tab.charAt(0).toUpperCase() + tab.slice(1));
          const count = tab === 'all' ? allOrders.length : allOrders.filter((o) => o.status === tab).length;
          return (
            <Tab key={tab} $active={activeTab === tab} onClick={() => setActiveTab(tab)} $highlight={tab === 'refund_requested' && count > 0}>
              {label} {count > 0 && `(${count})`}
            </Tab>
          );
        })}
      </Tabs>

      {loading ? (
        <LoadingWrapper>
          <LoadingSpinner />
          <p>Loading orders...</p>
        </LoadingWrapper>
      ) : orders.length === 0 ? (
        <EmptyState>No orders found</EmptyState>
      ) : (
        <OrderList>
          {orders.map((order) => (
            <OrderCard key={order.id}>
              <CardTop>
                <Checkbox
                  type="checkbox"
                  checked={selectedIds.has(order.id)}
                  onChange={() => toggleSelect(order.id)}
                />
                <OrderMeta>
                  <OrderId>#{order.id.slice(0, 8)}</OrderId>
                  <OrderDate>{formatDate(order.createdAt)}</OrderDate>
                </OrderMeta>
                <StatusBadge $status={order.status}>
                  {order.status === 'refund_requested' ? 'Return Requested' : order.status === 'return_approved' ? 'Awaiting Item' : order.status === 'refunded' ? 'Refunded' : order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                </StatusBadge>
              </CardTop>

              <CardBody>
                <InfoRow>
                  <InfoLabel>Customer</InfoLabel>
                  <InfoValue>
                    {order.shippingInfo
                      ? `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`.trim() || '-'
                      : '-'}
                  </InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Email</InfoLabel>
                  <InfoValue>{order.shippingInfo?.email || '-'}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Items</InfoLabel>
                  <InfoValue>{getItemsSummary(order.items)}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Total</InfoLabel>
                  <InfoValue>${(order.total || 0).toFixed(2)}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Address</InfoLabel>
                  <InfoValue>
                    {order.shippingInfo
                      ? [
                          order.shippingInfo.address,
                          order.shippingInfo.addressLine2,
                          order.shippingInfo.city,
                          order.shippingInfo.state,
                          order.shippingInfo.zipCode,
                          order.shippingInfo.country,
                        ].filter(Boolean).join(', ')
                      : '-'}
                  </InfoValue>
                </InfoRow>
              </CardBody>

              {order.status === 'refund_requested' && (
                <RefundSection>
                  <RefundLabel>Return Requested</RefundLabel>
                  <RefundReason>Reason: {order.refundReason || 'No reason provided'}</RefundReason>
                  {order.returnItems && order.items && (
                    <ReturnItemsList>
                      <ReturnItemsHeader>
                        Items to return ({order.returnItems.length} of {order.items.length}):
                      </ReturnItemsHeader>
                      {order.returnItems.map((idx) => {
                        const item = order.items[idx];
                        if (!item) return null;
                        return (
                          <ReturnItemRow key={idx}>
                            <span>{item.name}</span>
                            <ReturnItemMeta>
                              {item.selectedSize && <span>{item.selectedSize}</span>}
                              <span>Qty: {item.quantity || 1}</span>
                              <span>${(item.price || 0).toFixed(2)}</span>
                            </ReturnItemMeta>
                          </ReturnItemRow>
                        );
                      })}
                      <RefundAmountRow>
                        Refund amount: <strong>
                          {order.refundAmount != null && order.refundAmount < order.total
                            ? `$${order.refundAmount.toFixed(2)} (partial)`
                            : 'Full order'}
                        </strong>
                      </RefundAmountRow>
                    </ReturnItemsList>
                  )}
                  <RefundActions>
                    <ApproveButton
                      onClick={() => handleApproveRefund(order.id)}
                      disabled={processingRefund === order.id}
                    >
                      {processingRefund === order.id ? 'Processing...' : 'Approve Return'}
                    </ApproveButton>
                    <DenyButton
                      onClick={() => handleDenyRefund(order.id)}
                      disabled={processingRefund === order.id}
                    >
                      Deny
                    </DenyButton>
                  </RefundActions>
                </RefundSection>
              )}

              {order.status === 'return_approved' && (
                <RefundSection>
                  <RefundLabel>Return Approved — Awaiting Item</RefundLabel>
                  <RefundReason>Reason: {order.refundReason || 'No reason provided'}</RefundReason>
                  {order.returnItems && order.items && (
                    <ReturnItemsList>
                      <ReturnItemsHeader>
                        Items to return ({order.returnItems.length} of {order.items.length}):
                      </ReturnItemsHeader>
                      {order.returnItems.map((idx) => {
                        const item = order.items[idx];
                        if (!item) return null;
                        return (
                          <ReturnItemRow key={idx}>
                            <span>{item.name}</span>
                            <ReturnItemMeta>
                              {item.selectedSize && <span>{item.selectedSize}</span>}
                              <span>Qty: {item.quantity || 1}</span>
                              <span>${(item.price || 0).toFixed(2)}</span>
                            </ReturnItemMeta>
                          </ReturnItemRow>
                        );
                      })}
                      <RefundAmountRow>
                        Refund amount: <strong>
                          {order.refundAmount != null && order.refundAmount < order.total
                            ? `$${order.refundAmount.toFixed(2)} (partial)`
                            : 'Full order'}
                        </strong>
                      </RefundAmountRow>
                    </ReturnItemsList>
                  )}
                  <RefundActions>
                    <ApproveButton
                      onClick={() => handleProcessRefund(order.id)}
                      disabled={processingRefund === order.id}
                    >
                      {processingRefund === order.id ? 'Processing...' : 'Process Refund'}
                    </ApproveButton>
                  </RefundActions>
                </RefundSection>
              )}

              <CardFooter>
                <StatusSelect
                  value={order.status || 'pending'}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  disabled={updatingId === order.id || order.status === 'refund_requested' || order.status === 'return_approved' || order.status === 'refunded'}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="refund_requested">Return Requested</option>
                  <option value="return_approved">Awaiting Item</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </StatusSelect>
                {updatingId === order.id && <UpdatingText>Saving...</UpdatingText>}
              </CardFooter>
            </OrderCard>
          ))}
        </OrderList>
      )}
    </Container>
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #f3f3f3;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 1rem;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem;
  }
`;

const Container = styled.div`
  width: 100%;
  max-width: 960px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.25rem;
    border-radius: 8px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 520px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h1`
  font-size: 1.75rem;
  color: var(--secondary-color, #333);
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 520px) {
    flex-wrap: wrap;
  }
`;

const BulkActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SmallButton = styled.button`
  background: none;
  border: 1px solid #ddd;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #555;
  transition: all 0.2s;

  &:hover {
    border-color: #999;
    color: #333;
  }
`;

const ExportButton = styled.button`
  background: #044947;
  color: white;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: #033735;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  @media (max-width: 520px) {
    width: 100%;
    padding: 0.6rem;
    text-align: center;
  }
`;

const ArchiveButton = styled.button`
  background: #6d4c41;
  color: white;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: #4e342e;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  @media (max-width: 520px) {
    width: 100%;
    padding: 0.6rem;
    text-align: center;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #eee;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Tab = styled.button`
  background: none;
  border: none;
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${(p) => (p.$active ? '#044947' : '#888')};
  border-bottom: 2px solid ${(p) => (p.$active ? '#044947' : 'transparent')};
  margin-bottom: -2px;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    color: #044947;
  }

  ${(p) => p.$highlight && `
    color: #e65100;
    font-weight: 700;
  `}

  @media (max-width: 520px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
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

  @media (max-width: 520px) {
    padding: 1rem;
    border-radius: 8px;
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #044947;
  cursor: pointer;
  flex-shrink: 0;
`;

const OrderMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const OrderId = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: var(--secondary-color, #333);
  font-family: monospace;
  margin-right: 0.75rem;

  @media (max-width: 520px) {
    font-size: 0.85rem;
    display: block;
    margin-right: 0;
  }
`;

const OrderDate = styled.span`
  font-size: 0.8rem;
  color: #999;

  @media (max-width: 520px) {
    font-size: 0.75rem;
  }
`;

const StatusBadge = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  text-transform: capitalize;
  flex-shrink: 0;

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

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem 0;
  border-top: 1px solid #f0f0f0;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  @media (max-width: 520px) {
    flex-direction: column;
    gap: 0.15rem;
  }
`;

const InfoLabel = styled.span`
  font-size: 0.85rem;
  color: #999;
  flex-shrink: 0;
  min-width: 80px;
`;

const InfoValue = styled.span`
  font-size: 0.85rem;
  color: #333;
  font-weight: 500;
  text-align: right;
  word-break: break-word;

  @media (max-width: 520px) {
    text-align: left;
  }
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
`;

const StatusSelect = styled.select`
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 520px) {
    flex: 1;
  }
`;

const UpdatingText = styled.span`
  font-size: 0.8rem;
  color: #999;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #888;
  background: #f9f9f9;
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
  border-top: 3px solid var(--secondary-color, #044947);
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const RefundSection = styled.div`
  padding: 0.75rem;
  margin-top: 0.5rem;
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 8px;
`;

const RefundLabel = styled.div`
  font-size: 0.85rem;
  font-weight: 700;
  color: #e65100;
  margin-bottom: 0.25rem;
`;

const RefundReason = styled.div`
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.75rem;
  font-style: italic;
`;

const RefundActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ApproveButton = styled.button`
  padding: 0.4rem 1rem;
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.2s;

  &:hover {
    background: #1b5e20;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const DenyButton = styled.button`
  padding: 0.4rem 1rem;
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ReturnItemsList = styled.div`
  margin: 0.5rem 0 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #fffde7;
  border-radius: 6px;
  border: 1px solid #fff9c4;
`;

const ReturnItemsHeader = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.4rem;
`;

const ReturnItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0;
  font-size: 0.85rem;
  color: #333;

  & + & {
    border-top: 1px solid #f0f0f0;
  }
`;

const ReturnItemMeta = styled.div`
  display: flex;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: #888;
`;

const RefundAmountRow = styled.div`
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.85rem;
  color: #333;
  text-align: right;
`;

export default AdminOrders;

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { getFirestore, collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const STATUS_TABS = ['all', 'pending', 'paid', 'shipped', 'failed'];

const AdminOrders = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [updatingId, setUpdatingId] = useState(null);

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
          <ExportButton onClick={exportCSV} disabled={selectedIds.size === 0}>
            Export CSV ({selectedIds.size})
          </ExportButton>
        </HeaderActions>
      </Header>

      <Tabs>
        {STATUS_TABS.map((tab) => (
          <Tab key={tab} $active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Tab>
        ))}
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
                  {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
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

              <CardFooter>
                <StatusSelect
                  value={order.status || 'pending'}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  disabled={updatingId === order.id}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
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

export default AdminOrders;

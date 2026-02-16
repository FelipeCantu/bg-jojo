import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import styled from 'styled-components';
import SEO from './SEO';

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--background-alt);
  padding: 1rem;

  @media (max-width: 480px) {
    padding: 0;
  }
`;

const SuccessCard = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-width: 28rem;
  width: 100%;
  text-align: center;
  word-break: break-word;

  @media (max-width: 480px) {
    max-width: 100%;
    border-radius: 0;
    box-shadow: none;
  }
`;

const SuccessIcon = styled.svg`
  height: 4rem;
  width: 4rem;
  color: var(--success-color);
  margin: 0 auto 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.5rem;
`;

const Message = styled.p`
  color: var(--text-light);
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const OrderInfo = styled.div`
  background-color: var(--background-alt);
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
  overflow-wrap: break-word;
`;

const OrderId = styled.span`
  color: var(--info-color);
  font-weight: 500;
  font-family: monospace;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const HomeButton = styled.button`
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background-color: var(--secondary-color);
  color: white;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  &:hover {
    background-color: var(--secondary-color-dark);
  }
`;

export default function SuccessPage() {
  // Extract query parameters
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  // Confirm order payment via Cloud Function
  useEffect(() => {
    const confirmOrder = async () => {
      if (!sessionId || !orderId) return;

      try {
        const functions = getFunctions(getApp(), 'us-central1');
        const api = httpsCallable(functions, 'api');
        await api({
          endpoint: 'confirmOrderPayment',
          orderId,
          paymentIntentId: sessionId,
        });
      } catch (error) {
        console.error('Error confirming order:', error);
      }
    };

    confirmOrder();
  }, [sessionId, orderId]);

  const handleCopyOrderId = () => {
    if (!orderId) return;
    navigator.clipboard.writeText(orderId);
    alert('Order ID copied to clipboard!');
  };

  return (
    <PageContainer>
      <SEO title="Order Successful" noindex path="/success" />
      <SuccessCard>
        <SuccessIcon
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </SuccessIcon>

        <Title>Payment Successful!</Title>

        <Message>
          Thank you for your purchase. We've sent a confirmation to your email.
          <br />
          <strong>Save your Order ID</strong> for reference.
        </Message>

        <OrderInfo>
          <p>
            Order ID:{' '}
            <OrderId onClick={handleCopyOrderId} title="Click to copy">
              {orderId || 'Processing...'}
            </OrderId>
          </p>
        </OrderInfo>

        <HomeButton onClick={() => (window.location.href = '/')}>
          Return Home
        </HomeButton>
      </SuccessCard>
    </PageContainer>
  );
}
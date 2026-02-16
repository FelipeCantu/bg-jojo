import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import styled from 'styled-components';

export default function DonationSuccess() {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const sessionId = searchParams.get('session_id');
  const donationId = searchParams.get('donation_id');

  const [donation, setDonation] = useState(null);

  useEffect(() => {
    const confirmDonation = async () => {
      if (!donationId) return;

      try {
        const db = getFirestore();
        const donationRef = doc(db, 'donations', donationId);
        const donationSnap = await getDoc(donationRef);

        if (donationSnap.exists()) {
          const data = donationSnap.data();
          setDonation(data);

          // Confirm payment via Cloud Function (verifies with Stripe)
          if (data.status === 'pending') {
            const functions = getFunctions(getApp(), 'us-central1');
            const api = httpsCallable(functions, 'api');
            await api({
              endpoint: 'confirmDonationCheckout',
              donationId,
              sessionId: sessionId || null,
            });
            // Update local state
            setDonation(prev => ({
              ...prev,
              status: data.frequency === 'monthly' ? 'active' : 'paid',
            }));
          }
        }
      } catch (error) {
        console.error('Error confirming donation:', error);
      }
    };

    confirmDonation();
  }, [sessionId, donationId]);

  const isSubscription = donation?.frequency === 'monthly';

  return (
    <PageContainer>
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

        <Title>Thank You for Your Donation!</Title>

        <Message>
          {isSubscription
            ? 'Your monthly donation is now active. You will be charged automatically each month.'
            : 'Your generous contribution has been received. Thank you for supporting our mission!'}
        </Message>

        {donation?.amount && (
          <DonationInfo>
            <p>
              Amount: <strong>${donation.amount.toFixed(2)}</strong>
              {isSubscription && ' /month'}
            </p>
          </DonationInfo>
        )}

        {donationId && (
          <DonationInfo>
            <p>
              Donation ID: <DonationIdText>{donationId}</DonationIdText>
            </p>
          </DonationInfo>
        )}

        <HomeButton onClick={() => (window.location.href = '/')}>
          Return Home
        </HomeButton>
      </SuccessCard>
    </PageContainer>
  );
}

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fb9e8a;
  padding: 3rem 1rem;
`;

const SuccessCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  max-width: 28rem;
  width: 100%;
  text-align: center;
`;

const SuccessIcon = styled.svg`
  height: 4rem;
  width: 4rem;
  color: #054944;
  margin: 0 auto 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #054944;
  margin-bottom: 0.5rem;
`;

const Message = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const DonationInfo = styled.div`
  background: #fcd3c1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  color: #cc4200;
  font-size: 0.95rem;
`;

const DonationIdText = styled.span`
  font-family: monospace;
  font-size: 0.85rem;
  word-break: break-all;
`;

const HomeButton = styled.button`
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #054944;
  color: white;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: background-color 0.2s;

  &:hover {
    background: #cc4200;
  }
`;

import React, { useState } from 'react';
import styled from 'styled-components';
import Sponsorship from './Sponsorship';
import { Link } from 'react-router-dom';
import DonationCheckout from './DonationCheckout';

const Donate = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);

  const donationOptions = [
    { amount: "$10", value: 10, description: "1 free meal" },
    { amount: "$50", value: 50, description: "5 educational and recreational books" },
    { amount: "$100", value: 100, description: "900 pcs of educational stickers for suicide prevention" },
    { amount: "$250", value: 250, description: "Will contribute to one case of essential oils for the aroma therapy program" },
    { amount: "$500", value: 500, description: "Facilitate educational/recreational mental health and suicide prevention events" },
    { amount: "$1,000", value: 1000, description: "Supply art supplies (paint, canvases, brushes, etc.) for our art therapy program" },
    { amount: "$2,000", value: 2000, description: "20 hours of free therapy for the community" },
    { amount: "$5,000", value: 5000, description: "Will contribute to holding a dedicated mental health clinic for suicide prevention in Saratoga Springs, Utah" },
  ];

  const handleStartDonation = (amount = null) => {
    setSelectedAmount(amount);
    setShowCheckout(true);
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setSelectedAmount(null);
  };

  return (
    <BackgroundWrapper>
      <Container>
        <Title>Donate</Title>
        <Subtitle>Empowering Jojo to Prevent Suicide and Elevate Mental Health Awareness</Subtitle>
        <StartButton as="button" onClick={() => handleStartDonation()}>
          Start Today
        </StartButton>

        <DonationList>
          {donationOptions.map((option, index) => (
            <DonationItem
              key={index}
              onClick={() => handleStartDonation(option.value)}
              $clickable
            >
              <Amount>{option.amount}</Amount>
              <Description>{option.description}</Description>
            </DonationItem>
          ))}
        </DonationList>

        <AltPaymentLink to="/supporting-givebackjojo">
          Prefer Venmo or Zelle?
        </AltPaymentLink>

        <LearnMore to="/YourGift">Learn More</LearnMore>
        <Divider />
        <Sponsorship />
      </Container>

      {showCheckout && (
        <DonationCheckout
          preselectedAmount={selectedAmount}
          onClose={handleCloseCheckout}
        />
      )}
    </BackgroundWrapper>
  );
};

// Styled Components
const BackgroundWrapper = styled.div`
  background: #fb9e8a;
  padding: 1rem;
  min-height: 100vh;
  
  @media (min-width: 768px) {
    padding: 3rem 2rem;
  }

  @media (max-width: 768px) {
    padding: 0;
  }
`;

const Container = styled.div`
  text-align: center;
  padding: 1.5rem;
  background: #fcd3c1;
  border-radius: 10px;
  max-width: 1200px;
  margin: 0 auto;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  
  @media (min-width: 768px) {
    padding: 3rem;
  }

  @media (max-width: 768px) {
    width: 100%;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    padding: 1.5rem;
  }
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: bold;
  color: #cc4200;
  margin-bottom: 0.5rem;
  line-height: 1.2;
  
  @media (min-width: 768px) {
    font-size: 3rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #cc4200;
  margin: 0 auto 1.5rem;
  max-width: 800px;
  line-height: 1.4;
  
  @media (min-width: 768px) {
    font-size: 1.25rem;
    margin-bottom: 2rem;
  }
`;

const StartButton = styled.button`
  background: #cc4200;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-block;
  text-decoration: none;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 300px;

  &:hover {
    background: #054944;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  @media (min-width: 768px) {
    padding: 1rem 2rem;
    font-size: 1.1rem;
    width: auto;
  }
`;

const DonationList = styled.div`
  margin: 2rem auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  max-width: 800px;
  
  @media (min-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
`;

const DonationItem = styled.div`
  background: #f8ddd2;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: transform 0.3s ease;
  text-align: center;
  cursor: ${(p) => (p.$clickable ? 'pointer' : 'default')};

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    text-align: left;
    padding: 1.25rem;
  }
`;

const Amount = styled.span`
  font-size: 1.25rem;
  font-weight: bold;
  color: #a73602;
  
  @media (min-width: 768px) {
    font-size: 1.5rem;
    min-width: 100px;
  }
`;

const Description = styled.p`
  font-size: 0.9rem;
  color: #cc4200;
  margin: 0;
  line-height: 1.4;
  
  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const LearnMore = styled(Link)`
  display: inline-block;
  margin: 1.5rem auto 0;
  font-size: 1rem;
  color: #cc4200;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 300px;
  text-align: center;
  
  &:hover {
    text-decoration: underline;
    background-color: rgba(204, 66, 0, 0.1);
  }
  
  @media (min-width: 768px) {
    font-size: 1.1rem;
    margin-top: 2rem;
    width: auto;
  }
`;

const AltPaymentLink = styled(Link)`
  display: inline-block;
  margin: 1rem auto 0;
  font-size: 0.9rem;
  color: #054944;
  text-decoration: underline;
  font-weight: 500;

  &:hover {
    color: #cc4200;
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 2px;
  background: rgba(0, 0, 0, 0.1);
  margin: 2rem auto;
  max-width: 800px;
  
  @media (min-width: 768px) {
    margin: 4rem auto;
  }
`;

export default Donate;
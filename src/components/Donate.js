import React from 'react';
import styled from 'styled-components';
import Sponsorship from './Sponsorship';
import { Link } from 'react-router-dom';
import { DonationCheckoutInline } from './DonationCheckout';
import SEO from './SEO';

const Donate = () => {
  return (
    <BackgroundWrapper>
      <SEO
        title="Donate"
        description="Your donation provides free therapy, art supplies, essential oils, and educational resources. 100% goes to suicide prevention and mental health awareness."
        path="/donate"
      />
      <Container>
        <Title>Donate</Title>
        <Subtitle>Empowering Jojo to Prevent Suicide and Elevate Mental Health Awareness</Subtitle>

        <FormSection>
          <DonationCheckoutInline />
        </FormSection>

        <LinksStack>
          <AltPaymentLink to="/supporting-givebackjojo">
            Prefer Venmo or Zelle?
          </AltPaymentLink>
          <LearnMore to="/YourGift">Learn More</LearnMore>
        </LinksStack>
        <Divider />
        <Sponsorship />
      </Container>
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

const FormSection = styled.div`
  max-width: 700px;
  margin: 0 auto 2rem;
  text-align: left;
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);

  @media (min-width: 768px) {
    padding: 2rem 2.5rem;
  }
`;

const LinksStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const LearnMore = styled(Link)`
  display: inline-block;
  font-size: 1rem;
  color: #cc4200;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    text-decoration: underline;
    background-color: rgba(204, 66, 0, 0.1);
  }

  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
`;

const AltPaymentLink = styled(Link)`
  display: inline-block;
  font-size: 0.95rem;
  color: #054944;
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.2s;

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

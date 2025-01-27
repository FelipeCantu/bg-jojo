import React from 'react';
import styled from 'styled-components';
import Sponsorship from './Sponsorship';
import { Link } from 'react-router-dom';

const Donate = () => {
    const donationOptions = [
        { amount: "$10", description: "1 free meal" },
        { amount: "$50", description: "5 educational and recreational books" },
        { amount: "$100", description: "900 pcs of educational stickers for suicide prevention" },
        { amount: "$250", description: "Will contribute to one case of essential oils for the aroma therapy program" },
        { amount: "$500", description: "Facilitate educational/recreational mental health and suicide prevention events" },
        { amount: "$1,000", description: "Supply art supplies (paint, canvases, brushes, etc.) for our art therapy program" },
        { amount: "$2,000", description: "20 hours of free therapy for the community" },
        { amount: "$5,000", description: "Will contribute to holding a dedicated mental health clinic for suicide prevention in Saratoga Springs, Utah" },
    ];

    return (
        <BackgroundWrapper>
            <Container>
                <Title>Donate</Title>
                <Subtitle>Empowering Jojo to Prevent Suicide and Elevate Mental Health Awareness</Subtitle>
                <StartButton to="/SupportingGiveBackJojo">Start Today</StartButton>
                <DonationList>
                    {donationOptions.map((option, index) => (
                        <DonationItem key={index}>
                            <Amount>{option.amount}</Amount>
                            <Description>{option.description}</Description>
                        </DonationItem>
                    ))}
                </DonationList>
                <LearnMore to="/YourGift">Learn More</LearnMore>

                {/* Divider Bar */}
                <Divider />

                <Sponsorship />
            </Container>
        </BackgroundWrapper>
    );
};

// Styled Components
const BackgroundWrapper = styled.div`
  background: #fb9e8a;  /* Background Color Behind Everything */
  padding: 60px 0;
`;

const Container = styled.div`
  text-align: center;
  padding: 40px;
  background: #fcd3c1; /* Keeps Content Readable */
  border-radius: 10px;
  max-width: 80%;
  margin: auto;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  font-size: 50px;
  font-weight: bold;
  color: #cc4200;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #cc4200;
  margin: 10px 0 20px;
`;

const StartButton = styled(Link)`  /* Styled as a Link component */
  background: #cc4200;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
  display: inline-block;
  text-decoration: none;
  &:hover {
    background: #003f52;
  }
`;

const DonationList = styled.div`
  margin: 30px 0;
  text-align: left;
`;

const DonationItem = styled.div`
  background: #f8ddd2;  /* Keeps Each Box Readable */
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 5px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
`;

const Amount = styled.span`
  font-size: 18px;
  font-weight: bold;
  color: #a73602;
`;

const Description = styled.p`
  font-size: 14px;
  color: #cc4200;
  margin: 0;
`;

const LearnMore = styled(Link)`
  display: block;
  margin-top: 20px;
  font-size: 16px;
  color: #cc4200;
  text-decoration: none;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

// Divider Bar
const Divider = styled.div`
  width: 100%;
  height: 3px;
  background: black;
  margin: 50px 0;
`;

export default Donate;

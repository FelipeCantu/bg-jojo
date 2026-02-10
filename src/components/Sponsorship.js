import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Sponsorship = () => {

  const navigate = useNavigate();
  const handleStartToday = () => {
    navigate('/getinvolved');
  };

  const sponsorshipLevels = [
    {
      title: "Reaching Out",
      amount: "$1,000",
      perks: [
        "10 exclusive Give Back JoJo stickers",
        "5 Give Back JoJo T-Shirts",
        "Recognition at 1 Give Back JoJo event",
        "Recognition on our website",
        "1 booth at a Give Back JoJo event",
      ],
    },
    {
      title: "Lend a Hand",
      amount: "$2,500",
      perks: [
        "20 exclusive Give Back JoJo stickers",
        "10 Give Back JoJo T-Shirts",
        "Recognition at 1 Give Back JoJo event",
        "Recognition on our website",
        "1 booth at a Give Back JoJo event",
        "Recognition on our brochures/flyers",
        "Recognition on an IG/FB post",
      ],
    },
    {
      title: "Positive Reinforcements",
      amount: "$5,000",
      perks: [
        "30 exclusive Give Back JoJo stickers",
        "15 Give Back JoJo T-Shirts",
        "Recognition at 1 Give Back JoJo event",
        "Recognition on our website",
        "1 booth at a Give Back JoJo event",
        "Recognition on our brochures/flyers",
        "Recognition on an IG/FB post",
        "Recognition on 1 banner at a Give Back JoJo event",
      ],
    },
    {
      title: "Connect & Support",
      amount: "$10,000",
      perks: [
        "50 exclusive Give Back JoJo stickers",
        "25 Give Back JoJo T-Shirts",
        "Recognition at 3 Give Back JoJo events",
        "Recognition on our website",
        "1 booth at a Give Back JoJo event",
        "Recognition on our brochures/flyers",
        "Recognition on an IG/FB post",
        "Recognition on banners at 3 Give Back JoJo events",
        "Opportunity for a speech at 1 Give Back JoJo event",
        "1 performance at a Give Back JoJo event",
      ],
    },
    {
      title: "Save a Life",
      amount: "$25,000",
      perks: [
        "100 exclusive Give Back JoJo stickers",
        "50 Give Back JoJo T-Shirts",
        "Recognition at all Give Back JoJo events",
        "Recognition on our website",
        "1 booth at all Give Back JoJo events",
        "Recognition on our brochures/flyers",
        "Recognition on an IG/FB post",
        "Recognition on all banners on Give Back JoJo events",
        "Opportunity for a speech at all Give Back JoJo events",
        "1 performance at all Give Back JoJo events",
        "Name/Logo on Billboard(s)",
      ],
    },
  ];

  return (
    <Container>
      <Title>Jojo's Generosity</Title>
      <Subtitle>Subscribe bi-annually to get a featured display at our clinic</Subtitle>

      {/* Images Section */}
      <ImagesContainer>
        <Image src="https://static.wixstatic.com/media/1db9c9_04d3b595327944f8a47f1c385f9180d3~mv2.png/v1/fill/w_603,h_340,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Untitled-1.png" alt="Donation Event" />
        <Image src="https://static.wixstatic.com/media/1db9c9_fffbca1af6ec4bee8f085876fe68959f~mv2.png/v1/crop/x_2,y_232,w_1910,h_848/fill/w_691,h_307,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Untitled-2.png" alt="Mental Health Support" />
      </ImagesContainer>

      <Button onClick={handleStartToday}>Start Today</Button>
      {/* Sponsorship Levels Grid */}
      <SponsorshipGrid>
        {sponsorshipLevels.map((level, index) => (
          <SponsorshipItem key={index}>
            <Amount>{level.amount}</Amount>
            <SponsorshipTitle>{level.title}</SponsorshipTitle>
            <PerksList>
              {level.perks.map((perk, i) => (
                <Perk key={i}>✔ {perk}</Perk>
              ))}
            </PerksList>
          </SponsorshipItem>
        ))}
      </SponsorshipGrid>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  text-align: center;
  padding: 40px;
  background: #f8ddd2;
  border-radius: 10px;
  max-width: 1100px;
  margin: auto;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 20px 10px;
    border-radius: 0;
    max-width: 100%;
    box-shadow: none;
  }
`;

const Title = styled.h2`
  font-size: 28px;
  font-weight: bold;
  color: #003f52;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #003f52;
  margin: 10px 0 20px;
`;

// Images Container
const ImagesContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const Image = styled.img`
  width: 45%;
  max-width: 400px;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Button = styled.button`
  background: #003f52;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
  margin-bottom: 20px;
  &:hover {
    background: #a73602;
  }
`;

const SponsorshipGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 30px 0;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SponsorshipItem = styled.div`
  background: #fcd3c1;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
  text-align: left;
`;

const Amount = styled.span`
  font-size: 20px;
  font-weight: bold;
  color: #003f52;
`;

const SponsorshipTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  margin: 10px 0;
  color: #003f52;
`;

const PerksList = styled.ul`
  list-style: none;
  padding: 0;
`;

const Perk = styled.li`
  font-size: 14px;
  color: #003f52;
  margin: 5px 0;
`;

export default Sponsorship;

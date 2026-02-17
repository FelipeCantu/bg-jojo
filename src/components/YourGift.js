import React from 'react';
import styled from 'styled-components';

import { ReactComponent as Path } from '../assets/path.svg';
import { ReactComponent as BookIcon } from '../assets/book.svg';
import { ReactComponent as StickerIcon } from '../assets/stickers.svg';
import { ReactComponent as OilIcon } from '../assets/oils.svg';
import { ReactComponent as EventIcon } from '../assets/events.svg';
import { ReactComponent as ArtIcon } from '../assets/art.svg';
import SEO from './SEO';

const YourGift = () => {
  const giftOptions = [
    { amount: "$10", title: "Free Meal", description: "Being hungry for an extended period can cause feelings of depression and hopelessness. Your contribution will provide someone with relief to eat for 1 meal.", icon: <Path width="40" height="40" /> },
    { amount: "$50", title: "Books", description: "To provide a safe space for all, our recreational areas will include a service for readers. Your contribution will allow a combination of 5 entertaining and/or educational books for suicide prevention.", icon: <BookIcon width="40" height="40" /> },
    { amount: "$100", title: "Stickers", description: "What better way to spread awareness than having stickers for our cause? This donation will be providing 900 pcs of educational stickers for suicide prevention, will support local artists, and will make mental health awareness accessible to any and all.", icon: <StickerIcon width="40" height="40" /> },
    { amount: "$250", title: "Essential Oils", description: "To induce an environment that is comforting and safe, our aroma therapy program needs essential oils. Your donation will allow access to 1 case for our services.", icon: <OilIcon width="40" height="40" /> },
    { amount: "$500", title: "Events", description: "To bring the community together and to spread awareness for mental health and suicide prevention, your contribution will assist us in hosting events in recreational/educational activities.", icon: <EventIcon width="40" height="40" /> },
    { amount: "$1,000", title: "Art Supplies", description: "Our main form of free and accessible therapy is through art therapy. To do this we need gallons of acrylic paint, sets of brushes and pencils, and canvases. Your donation will make this possible.", icon: <ArtIcon width="40" height="40" /> },
    { amount: "$2,000", title: "Free Therapy", description: "Our lovely therapists work hard to ensure everyone is feeling safe and appreciated. Your donation will allow 20 hours of their hard work to be recognized for their diligence and time.", icon: <Path width="40" height="40" /> },
    { amount: "$5,000", title: "Mental Health Clinic", description: "Hosting an event is wonderful for spreading awareness, but what would be even more amazing is to have a space that can offer our services on a daily basis. Not only will you be helping Give Back JoJo, but you are also saving lives.", icon: <BookIcon width="40" height="40" /> },
  ];

  return (
    <BackgroundWrapper>
      <SEO
        title="Your Gift — How Donations Help"
        description="See how your donation saves lives. From $10 meals to $5,000 mental health clinics, every contribution makes a difference in suicide prevention."
        path="/yourgift"
      />
      <Container>
        <Title>Your Gift</Title>
        <Subtitle>Learn more about how your donation helps Give Back Jojo prevent suicide and raise awareness for mental health.</Subtitle>
        <GiftList>
          {giftOptions.map((gift, index) => (
            <GiftItem key={index}>
              <GiftAmount>
                {gift.icon} {/* Insert icon here */}
                {gift.amount}
              </GiftAmount>
              <GiftTitle>
                {gift.title}
              </GiftTitle>
              <GiftDescription>{gift.description}</GiftDescription>
            </GiftItem>
          ))}
        </GiftList>
      </Container>
    </BackgroundWrapper>
  );
};

// Styled Components
const BackgroundWrapper = styled.div`
  background: #fb9e8a; /* Background color behind everything */
  padding: 60px 0;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

const Container = styled.div`
  text-align: center;
  padding: 40px;
  background: #fcd3c1; /* Keeps content readable */
  border-radius: 10px;
  max-width: 80%;
  margin: auto;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
   @media (max-width: 768px) {
        max-width: 100%;
        width: 100%;
        margin: 0;
        border-radius: 0;
    }
`;

const Title = styled.h2`
  font-size: 28px;
  font-weight: bold;
  color: #cc4200;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #cc4200;
  margin: 10px 0 20px;
`;

const GiftList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Responsive grid */
  gap: 20px;
  margin-top: 30px;
`;

const GiftItem = styled.div`
  background: #f8ddd2;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
  text-align: left;
`;

const GiftAmount = styled.span`
  font-size: 18px;
  font-weight: bold;
  color: #cc4200;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const GiftTitle = styled.h3`
  font-size: 20px;
  margin: 10px 0;
  color: #cc4200;
  display: flex;
  align-items: center;
`;

const GiftDescription = styled.p`
  font-size: 14px;
  color: #cc4200;
`;

export default YourGift;

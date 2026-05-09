import React from 'react';
import styled from 'styled-components';
import { FaFacebookF, FaInstagram, FaYoutube, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import SEO from './SEO';

const Contact = () => {
  return (
    <PageWrapper>
      <SEO
        title="Contact Us"
        description="Get in touch with Give Back Jojo. Reach us by email or find us on social media."
        path="/contact"
      />

      <Hero />

      <ContentWrapper>
        <Card>
          <Heading>Contact Us</Heading>
          <Subheading>We'd love to hear from you.</Subheading>

          <InfoGrid>
            <InfoItem>
              <IconCircle>
                <FaEnvelope />
              </IconCircle>
              <InfoLabel>Email</InfoLabel>
              <InfoValue>
                <a href="mailto:givebackjojo@gmail.com">givebackjojo@gmail.com</a>
              </InfoValue>
            </InfoItem>

            <InfoItem>
              <IconCircle>
                <FaMapMarkerAlt />
              </IconCircle>
              <InfoLabel>Location</InfoLabel>
              <InfoValue>Saratoga Springs, Utah</InfoValue>
            </InfoItem>
          </InfoGrid>

          <Divider />

          <SocialHeading>Find us on social media</SocialHeading>
          <SocialRow>
            <SocialIcon
              href="https://www.facebook.com/profile.php?id=61564086892164"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </SocialIcon>

            <SocialIcon
              href="https://www.instagram.com/givebackjojo/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </SocialIcon>

            <SocialIcon
              href="https://www.youtube.com/watch?v=bqnwdX3x_l0"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <FaYoutube />
            </SocialIcon>
          </SocialRow>
        </Card>
      </ContentWrapper>
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  width: 100%;
  background: #f8ddd2;
  min-height: 100vh;
`;

const Hero = styled.div`
  background: url('https://static.wixstatic.com/media/08854068a2e04004a83a1b525ba62365.jpg/v1/crop/x_0,y_235,w_5472,h_1966/fill/w_980,h_352,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Flamingos%20and%20Macaroons.jpg') no-repeat center top/cover;
  height: 260px;
  width: 100%;
`;

const ContentWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 0 1rem 4rem;
  margin-top: -80px;
`;

const Card = styled.div`
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 640px;
  position: relative;
  z-index: 2;
  text-align: center;

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`;

const Heading = styled.h2`
  font-size: 28px;
  font-weight: bold;
  color: #003f52;
  margin-bottom: 0.25rem;
`;

const Subheading = styled.p`
  font-size: 16px;
  color: #003f52;
  margin-bottom: 2rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const IconCircle = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #003f52;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
`;

const InfoLabel = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #003f52;
  font-weight: 600;
`;

const InfoValue = styled.div`
  font-size: 0.95rem;
  color: #333;

  a {
    color: #003f52;
    text-decoration: none;
    &:hover {
      color: var(--primary-color);
      text-decoration: underline;
    }
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #fcd3c1;
  margin: 2rem 0;
`;

const SocialHeading = styled.p`
  color: #003f52;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 1.25rem;
`;

const SocialRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
`;

const SocialIcon = styled.a`
  color: var(--text-color);
  font-size: 1.5rem;
  transition: color 0.3s ease;

  &:hover {
    color: var(--primary-color);
  }
`;

export default Contact;

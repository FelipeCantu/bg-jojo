import React from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram, faYoutube } from "@fortawesome/free-brands-svg-icons";

const Footer = () => {
  return (
    <FooterContainer>
      <CrisisAlert>
        <CrisisText>
          If you or someone you know is in crisis, reach out to your local crisis line, 
          text or call the 988 Suicide and Crisis Lifeline at 988, 
          or visit <CrisisLink href="https://988lifeline.org" target="_blank" rel="noopener noreferrer">988lifeline.org</CrisisLink> for more details.
        </CrisisText>
      </CrisisAlert>
      
      <FooterContent>
        <SocialMedia>
          <SocialLink 
            href="https://www.facebook.com/profile.php?id=61564086892164" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <FontAwesomeIcon icon={faFacebookF} />
          </SocialLink>
          <SocialLink 
            href="https://www.instagram.com/givebackjojo/" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <FontAwesomeIcon icon={faInstagram} />
          </SocialLink>
          <SocialLink 
            href="https://www.youtube.com/watch?v=bqnwdX3x_l0" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="YouTube"
          >
            <FontAwesomeIcon icon={faYoutube} />
          </SocialLink>
        </SocialMedia>

        <FooterLinks>
          <FooterLink href="/about">About Us</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
          <FooterLink href="/privacy">Privacy Policy</FooterLink>
          <FooterLink href="/terms">Terms of Service</FooterLink>
        </FooterLinks>

        <Copyright>
          © {new Date().getFullYear()} Give Back Jojo. All rights reserved.
        </Copyright>
      </FooterContent>
    </FooterContainer>
  );
};

// Styled Components
const FooterContainer = styled.footer`
  background-color: var(--primary-color);
  color: var(--text-color);
  position: relative;
`;

const CrisisAlert = styled.div`
  background-color: #ff5252;
  color: white;
  padding: 1rem;
  text-align: center;
  font-weight: 500;
  width: 100%;
`;

const CrisisText = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
  max-width: 1200px;
  margin: 0 auto;
`;

const CrisisLink = styled.a`
  color: white;
  text-decoration: underline;
  font-weight: 600;
  
  &:hover {
    color: #ffebee;
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 3rem 1rem;
`;

const SocialMedia = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
  padding-top: 20px;
`;

const SocialLink = styled.a`
  font-size: 1.5rem;
  color: var(--text-color);
  transition: all 0.3s ease;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  
  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-0.25rem);
  }
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
    width: 2.5rem;
    height: 2.5rem;
  }
`;

const FooterLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  margin: 1rem 0;
  
  @media (max-width: 480px) {
    gap: 1rem;
    flex-direction: column;
    align-items: center;
  }
`;

const FooterLink = styled.a`
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  position: relative;
  
  &:hover {
    color: white;
    
    &::after {
      width: 100%;
    }
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -0.25rem;
    left: 0;
    width: 0;
    height: 2px;
    background: white;
    transition: width 0.3s ease;
  }
`;

const Copyright = styled.p`
  font-size: 0.9rem;
  opacity: 0.9;
  text-align: center;
  margin-top: 1rem;
`;

export default Footer;
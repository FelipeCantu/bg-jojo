import React from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram, faYoutube } from "@fortawesome/free-brands-svg-icons";

const Footer = () => {
  return (
    <FooterContainer>
      <SocialMedia>
        <SocialLink href="https://www.facebook.com/profile.php?id=61564086892164" target="_blank" aria-label="Facebook">
          <FontAwesomeIcon icon={faFacebookF} />
        </SocialLink>
        <SocialLink href="https://www.instagram.com/givebackjojo/" target="_blank" aria-label="Instagram">
          <FontAwesomeIcon icon={faInstagram} />
        </SocialLink>
        <SocialLink href="https://www.youtube.com/watch?v=bqnwdX3x_l0" target="_blank" aria-label="YouTube">
          <FontAwesomeIcon icon={faYoutube} />
        </SocialLink>
      </SocialMedia>
      <Copyright>© {new Date().getFullYear()} Give Back Jojo All rights reserved.</Copyright>
    </FooterContainer>
  );
};

export default Footer;

const FooterContainer = styled.footer`
  background-color: orange;
  color: black;
  padding: 20px 0;
  text-align: center;
`;

const SocialMedia = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 10px;
`;

const SocialLink = styled.a`
  font-size: 24px;
  color: black;
  transition: color 0.3s ease-in-out, transform 0.3s ease-in-out;

  &:hover {
    color: white;
    transform: scale(1.5);
  }
`;

const Copyright = styled.p`
  font-size: 14px;
  opacity: 0.8;
`;

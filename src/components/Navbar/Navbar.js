import React from 'react';
import Menu from './Menu';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import LoginButton from './LoginButton';

const Navbar = () => {
  return (
    <Nav>
      <NavContent>
        <LogoLink to="/Home">
          <Logo src={require('../../assets/jojologo.png')} alt="Logo" />
        </LogoLink>

        <NavLinks>
          <StyledLink to="/Home">Home</StyledLink>
          <StyledLink to="/Donate">Donate</StyledLink>
          <StyledLink to="/About">About</StyledLink>
          <StyledLink to="/Hotlines">Hotlines</StyledLink>
          <StyledLink to="/events">Events</StyledLink>

          <MoreLink>
            More
            <DropdownMenu>
              <StyledLink to="/Articles">Articles</StyledLink>
              <StyledLink to="/Tributes">Remembering Loved Ones</StyledLink>
              <StyledLink to="/GetInvolved">Get Involved</StyledLink>
            </DropdownMenu>
          </MoreLink>
        </NavLinks>

        <MobileMenu>
          <Menu />
        </MobileMenu>

        <NavbarLoginContainer>
          <LoginButton hideInNavbar={false} />
        </NavbarLoginContainer>
      </NavContent>
    </Nav>
  );
};

// Styled components
const Nav = styled.nav`
  position: sticky;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70px; /* Reduced from 90px */
  z-index: 1000;
  background-color: var(--primary-color);
  padding: 0 1rem;
  box-shadow: var(--box-shadow);
  
  @media (max-width: 768px) {
    height: 60px; /* Thinner navbar on mobile */
    padding: 0.5rem 1rem;
    justify-content: space-between; /* Align logo left and menu right */
    flex-direction: row; /* Keep horizontal layout */
  }
`;

const NavContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  
  @media (max-width: 768px) {
    flex-direction: row; /* Keep horizontal layout */
    gap: 0;
    justify-content: space-between; /* Push logo left and menu right */
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  
  @media (max-width: 768px) {
    margin-right: auto; /* Push logo to the far left */
  }
`;

const Logo = styled.img`
  height: 60px; /* Reduced from 80px */
  width: auto;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  @media (max-width: 768px) {
    height: 50px; /* Reduced from 70px */
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const StyledLink = styled(Link)`
  color: var(--text-color);
  text-decoration: none;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
  
  &:hover {
    color: white;
    background-color: rgba(0, 0, 0, 0.1);
    text-decoration: none;
  }
  
  &.active {
    font-weight: bold;
    color: white;
    background-color: rgba(0, 0, 0, 0.2);
  }
`;

const MoreLink = styled.div`
  position: relative;
  cursor: pointer;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color);
  border-radius: var(--border-radius);
  
  &:hover {
    color: white;
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background-color: var(--primary-color);
  box-shadow: var(--box-shadow);
  border-radius: var(--border-radius);
  z-index: 1001;
  min-width: 200px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  
  ${MoreLink}:hover & {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  
  ${StyledLink} {
    display: block;
    padding: 0.75rem 1rem;
    border-radius: 0;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }
    
    &:first-child {
      border-top-left-radius: var(--border-radius);
      border-top-right-radius: var(--border-radius);
    }
    
    &:last-child {
      border-bottom-left-radius: var(--border-radius);
      border-bottom-right-radius: var(--border-radius);
    }
  }
`;

const MobileMenu = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
    margin-left: auto; /* Push menu to the far right */
  }
`;

const NavbarLoginContainer = styled.div`
  display: none;
  
  @media (min-width: 769px) {
    display: flex;
    align-items: center;
    margin-left: 1rem;
  }
`;

export default Navbar;
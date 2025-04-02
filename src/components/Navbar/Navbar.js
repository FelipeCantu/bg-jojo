import React from 'react';
import Menu from './Menu';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import LoginButton from './LoginButton';

// First define base styled components that don't depend on others
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
  }
  
  &.active {
    font-weight: bold;
    color: white;
    background-color: rgba(0, 0, 0, 0.2);
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: var(--border-radius);
  z-index: 1001;
  min-width: 220px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: all 0.2s ease-out;
  
  ${StyledLink} {
    display: block;
    padding: 0.75rem 1.25rem;
    border-radius: 0;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.15);
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

// Then define components that depend on the base ones
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
    
    > ${DropdownMenu} {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
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

// Then define the remaining components
const Nav = styled.nav`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70px;
  z-index: 1000;
  background-color: var(--primary-color);
  padding: 0 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  @media (max-width: 768px) {
    height: 80px;
    padding: 1rem 1.5rem;
    justify-content: space-between;
  }
`;

const NavContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  
  @media (max-width: 768px) {
    flex-direction: row;
    gap: 0;
    justify-content: space-between;
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  z-index: 1002;
  
  @media (max-width: 768px) {
    margin-right: auto;
  }
`;

const Logo = styled.img`
  height: 60px;
  width: auto;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  @media (max-width: 768px) {
    height: 65px;
  }
`;

const MobileMenu = styled.div`
  display: none;
  z-index: 1002;
  
  @media (max-width: 768px) {
    display: block;
    margin-left: auto;
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

// Main component
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

export default Navbar;
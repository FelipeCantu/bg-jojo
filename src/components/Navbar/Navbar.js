import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import Menu from './Menu';
import LoginButton from './LoginButton';
import NotificationBell from './NotificationBell'



const Navbar = () => {
  return (
    <>

      <Nav>
        <NavContent>
          <LogoLink to="/home">
            <Logo src={require('../../assets/jojologo.png')} alt="Logo" />
          </LogoLink>

          <NavLinks>
            <StyledLink to="/home">Home</StyledLink>
            <StyledLink to="/donate">Donate</StyledLink>
            <StyledLink to="/hotlines">Hotlines</StyledLink>
            <StyledLink to="/events">Events</StyledLink>
            <StyledLink to="/about">About Us</StyledLink>

            <MoreLink>
              More
              <DropdownMenu>
                <StyledLink to="/getinvolved">Get Involved</StyledLink>
                <StyledLink to="/articles">Articles</StyledLink>
                <StyledLink to="/tributes">Remembering Loved Ones</StyledLink>
                <StyledLink to="/products">Shop</StyledLink>
              </DropdownMenu>
            </MoreLink>
          </NavLinks>

          <MobileMenu>
            <Menu />
          </MobileMenu>

          <NavbarLoginContainer>
            <NotificationBell />
            <LoginButton hideInNavbar={false} />
          </NavbarLoginContainer>
        </NavContent>
      </Nav>
    </>
  );
};


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
`;

const StyledLink = styled(Link)`
  color: var(--text-color);
  text-decoration: none;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 900;
  font-family: var(--font-heading);
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
  
  &:hover {
    background-color: var(--accent-pink);
  }
  
  &.active {
    background-color: var(--accent-pink);
  }

  ${DropdownMenu} & {
    display: block;
    padding: 0.75rem 1.25rem;
    border-radius: 0;
    
    &:hover {
      background-color: var(--accent-pink);
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

const MoreLink = styled.div`
  position: relative;
  cursor: pointer;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 900;
  font-family: var(--font-heading);
  color: var(--text-color);
  border-radius: var(--border-radius);
  
  &:hover {
    background-color: var(--accent-pink);
    
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
    gap: 1rem; // Add gap between NotificationBell and LoginButton
  }
`;

export default Navbar;
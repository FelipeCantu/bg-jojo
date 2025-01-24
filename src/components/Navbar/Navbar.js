import React from 'react';
import Menu from './Menu';
import styled from 'styled-components';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <Nav>
      <NavContent>
        <Logo src={require('../../assets/jojologo.png')} alt="Logo" />
        
        {/* Links are shown only on larger screens */}
        <NavLinks>
          <StyledLink to="/Home">Home</StyledLink>
          <StyledLink to="/About">About</StyledLink>
          <StyledLink to="/Hotlines">Hotlines</StyledLink>
          <StyledLink to="/GetInvolved">Get Involved</StyledLink>
          <StyledLink to="/Events">Events</StyledLink>

          {/* "More" dropdown */}
          <MoreLink>
            More
            <DropdownMenu>
              <StyledLink to="/Articles">Articles</StyledLink>
              <StyledLink to="/Remembering">Remembering Loved Ones</StyledLink>
            </DropdownMenu>
          </MoreLink>
        </NavLinks>

        {/* Hamburger menu is shown only on small screens */}
        <MobileMenu>
          <Menu />
        </MobileMenu>

        <Icons>
          <LoginButton>
            <UserCircleIcon />
            <p>Login</p>
          </LoginButton>
        </Icons>
      </NavContent>
    </Nav>
  );
};

const Nav = styled.div`
  position: sticky;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70px;
  z-index: 999;
  background-color: orange;
  padding-top: 10px;
  @media (max-width: 768px) {
    height: 120px;
    padding-top: 0;
  }
`;

const NavContent = styled.div`
  display: flex;
  justify-content: space-between; /* Align items */
  width: 85%;
  align-items: center;
  @media (max-width: 768px) {
    flex-direction: column; /* Stack elements on smaller screens */
    align-items: flex-start; /* Align to left */
  }
`;

const Logo = styled.img`
  height: 100px;
  width: auto;
  @media (max-width: 768px) {
    height: 80px; /* Slightly smaller logo on small screens */
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 20px;
  @media (max-width: 768px) {
    display: none; /* Hide navbar links on small screens */
  }
`;

const StyledLink = styled(Link)`
  color: black;
  text-decoration: none;
  padding: 10px 20px;
  font-size: 16px;
  display: flex;
  &:hover {
    text-decoration: underline;
    color: white;
  }
`;

const MoreLink = styled.div`
  position: relative;
  cursor: pointer;
  padding: 10px 20px;
  font-size: 16px;
  
  &:hover {
    color: white;
  }

  &:hover > div {
    display: block; /* Show the dropdown menu on hover */
  }
`;

const DropdownMenu = styled.div`
  display: none; /* Hide by default */
  position: absolute;
  top: 100%; /* Position directly below the "More" link */
  left: 0;
  background-color: orange;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 99999; /* Ensure dropdown is above other content */
  width: max-content; /* Make the dropdown width adjust to the content */
  
  a {
    display: block;
    padding: 10px 20px;
    color: black;
    text-decoration: none;
    &:hover {
      background-color: #ddd; /* Add hover effect to dropdown links */
      color: white;
    }
  }
`;

const MobileMenu = styled.div`
  @media (min-width: 769px) {
    display: none; /* Hide the mobile menu on larger screens */
  }
`;

const Icons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoginButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: black;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease-in-out;

  &:hover {
    color: white;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

export default Navbar;

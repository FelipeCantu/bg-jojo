import React from 'react';
import Menu from './Menu';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import LoginButton from './LoginButton';  // Import LoginButton

const Navbar = () => {
  return (
    <Nav>
      <NavContent>
        {/* Wrap the Logo with Link for navigation */}
        <LogoLink to="/Home">
          <Logo src={require('../../assets/jojologo.png')} alt="Logo" />
        </LogoLink>
        
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
              <StyledLink to="/Tributes">Remembering Loved Ones</StyledLink>
            </DropdownMenu>
          </MoreLink>
        </NavLinks>

        {/* Hamburger menu is shown only on small screens */}
        <MobileMenu>
          <Menu />
        </MobileMenu>

        <Icons>
          <LoginButton />  {/* Use LoginButton here */}
        </Icons>
      </NavContent>
    </Nav>
  );
};

// Styled components
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

const LogoLink = styled(Link)`
  text-decoration: none; /* Remove default link styling */
  cursor: pointer;
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
  display: block;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: orange;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 99999;
  width: max-content;
  opacity: 0;
  transform: translateY(-15px);
  visibility: hidden;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease-in-out, visibility 0.4s linear;

  ${MoreLink}:hover & {
    opacity: 1;
    transform: translateY(0);
    visibility: visible;
  }

  a {
    display: block;
    padding: 12px 20px;
    color: black;
    text-decoration: none;
    transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;

    &:hover {
      background-color: black;
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

export default Navbar;

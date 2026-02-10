import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import LoginButton from './LoginButton';

const Sidebar = ({ open, setOpen }) => {
  const handleLinkClick = () => setOpen(false);

  return (
    <SidebarContainer open={open}>
      <SidebarContent>
        <SidebarLoginContainer>
          <LoginButton hideInNavbar={false} closeSidebar={handleLinkClick} />
        </SidebarLoginContainer>
        <NavLinks>
          <StyledLink to="/home" end onClick={handleLinkClick}>Home</StyledLink>
          <StyledLink to="/donate" end onClick={handleLinkClick}>Donate</StyledLink>
          <StyledLink to="/about" end onClick={handleLinkClick}>About</StyledLink>
          <StyledLink to="/hotlines" end onClick={handleLinkClick}>Hotlines</StyledLink>
          <StyledLink to="/getinvolved" end onClick={handleLinkClick}>Get Involved</StyledLink>
          <StyledLink to="/events" end onClick={handleLinkClick}>Events</StyledLink>
          <StyledLink to="/articles" end onClick={handleLinkClick}>Articles</StyledLink>
          <StyledLink to="/tributes" end onClick={handleLinkClick}>Remembering Loved Ones</StyledLink>
          <StyledLink to="/products" end onClick={handleLinkClick}>Shop</StyledLink>
        </NavLinks>
      </SidebarContent>
    </SidebarContainer>
  );
};

const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  left: ${({ open }) => (open ? '0' : '-100%')};
  width: 100%;
  height: 100vh;
  background-color: #fff;
  box-shadow: 2px 0px 5px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  z-index: 999;
  display: flex;
  justify-content: center; /* Center horizontally */
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
  max-width: 400px;
  height: 100%;
  padding: 20px 0;
`;

const NavLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  margin-top: 30px;
`;

const StyledLink = styled(NavLink)`
  && {
    color: black;
    text-decoration: none;
    background-color: transparent;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }
  padding: 12px;
  font-size: 16px;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
  transition: all 0.2s ease;

  &&:visited,
  &&:focus,
  &&:focus-visible {
    color: black;
    outline: none;
    background-color: transparent;
  }

  &&:hover {
    color: white;
    background-color: #333;
  }

  &&.active {
    color: white;
    background-color: #333;
    font-weight: 600;
  }
`;

const SidebarLoginContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

export default Sidebar;
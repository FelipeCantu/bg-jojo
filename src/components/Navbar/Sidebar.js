import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
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
          <StyledLink to="/Home" onClick={handleLinkClick}>Home</StyledLink>
          <StyledLink to="/Donate" onClick={handleLinkClick}>Donate</StyledLink>
          <StyledLink to="/About" onClick={handleLinkClick}>About</StyledLink>
          <StyledLink to="/Hotlines" onClick={handleLinkClick}>Hotlines</StyledLink>
          <StyledLink to="/GetInvolved" onClick={handleLinkClick}>Get Involved</StyledLink>
          <StyledLink to="/Events" onClick={handleLinkClick}>Events</StyledLink>
          <StyledLink to="/Articles" onClick={handleLinkClick}>Articles</StyledLink>
          <StyledLink to="/Tributes" onClick={handleLinkClick}>Remembering Loved Ones</StyledLink>
          <StyledLink to="/Products" onClick={handleLinkClick}>Product</StyledLink>
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

const StyledLink = styled(Link)`
  color: black;
  text-decoration: none;
  padding: 12px;
  font-size: 16px;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
  transition: all 0.2s ease;
  
  &:hover {
    color: white;
    background-color: #333;
  }
`;

const SidebarLoginContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

export default Sidebar;
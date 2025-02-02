import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import LoginButton from './LoginButton';

const Sidebar = ({ open, setOpen }) => {
  // Close the sidebar when a link is clicked
  const handleLinkClick = () => {
    setOpen(false); // Close the sidebar
  };

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
        </NavLinks>
      </SidebarContent>
    </SidebarContainer>
  );
};

const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  left: ${({ open }) => (open ? '0' : '-150%')}; /* Sidebar is off-screen when closed */
  width: 100%;
  height: 100vh;
  background-color: #fff;
  box-shadow: 2px 0px 5px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: left 0.3s ease; /* Smooth transition */
  z-index: 999;
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  margin-right: 10%;
`;

const NavLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 30px;
  justify-content: center;
  align-items: center;
`;

const StyledLink = styled(Link)`
  color: black;
  text-decoration: none;
  padding: 10px;
  font-size: 16px;
  border-bottom: 1px solid #f0f0f0;
  width: 100%;
  text-align: center;
  &:hover {
    color: white;
    background-color: #333;
  }
`;

const SidebarLoginContainer = styled.div`
  top: 0;
  margin-bottom: 20px;
`;

export default Sidebar;

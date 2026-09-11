import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
// LOGIN DISABLED: uncomment to bring login back
// import LoginButton from './LoginButton';

const Sidebar = ({ open, setOpen }) => {
  const handleLinkClick = () => setOpen(false);

  return (
    <SidebarContainer open={open}>
      <SidebarContent>
        {/* LOGIN DISABLED: uncomment to bring back the sidebar login button
        <SidebarLoginContainer>
          <LoginButton hideInNavbar={false} closeSidebar={handleLinkClick} />
        </SidebarLoginContainer>
        */}
        <NavLinks>
          <StyledLink to="/home" end onClick={handleLinkClick}>Home</StyledLink>
          <StyledExternalLink href="https://www.zeffy.com/en-US/donation-form/jojos-generosity" target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>Donate</StyledExternalLink>
          <StyledLink to="/about" end onClick={handleLinkClick}>About</StyledLink>
          <StyledLink to="/hotlines" end onClick={handleLinkClick}>Hotlines</StyledLink>
          <StyledLink to="/getinvolved" end onClick={handleLinkClick}>Get Involved</StyledLink>
          <StyledLink to="/events" end onClick={handleLinkClick}>Events</StyledLink>
          <StyledLink to="/articles" end onClick={handleLinkClick}>Articles</StyledLink>
          <StyledLink to="/tributes" end onClick={handleLinkClick}>Remembering Loved Ones</StyledLink>
          <StyledExternalLink href="https://www.zeffy.com/en-US/ticketing/give-back-swag" target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>Shop</StyledExternalLink>
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
  /* Sits above the floating Donate/Shop action bar (z-index 1050) so that
     when the sidebar is open, it fully covers the pills instead of them
     poking through on top of it. Stays below the X toggle (z-index 9999
     in Menu.jsx) so the close button always remains visible/clickable. */
  z-index: 1060;
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
  /* Extra top padding clears the X toggle button (which sits ~15-41px from
     the top of the screen) so the first link doesn't sit underneath it. */
  padding: 90px 0 20px;
`;

const NavLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  margin-top: 10px;
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

const StyledExternalLink = styled.a`
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
  cursor: pointer;

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
`;

// LOGIN DISABLED: uncomment to bring back the sidebar login container styling
// const SidebarLoginContainer = styled.div`
//   width: 100%;
//   display: flex;
//   justify-content: center;
//   margin-bottom: 20px;
// `;

export default Sidebar;
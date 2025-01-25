import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const Sidebar = ({ open }) => {
  return (
    <SidebarWrapper open={open}>
      <nav>
        <Ul>
          {/* Add the original links here */}
          <li><StyledLink to="/Home">Home</StyledLink></li>
          <li><StyledLink to="/About">About</StyledLink></li>
          <li><StyledLink to="/Hotlines">Hotlines</StyledLink></li>
          <li><StyledLink to="/GetInvolved">Get Involved</StyledLink></li>
          <li><StyledLink to="/Events">Events</StyledLink></li>

          {/* Add the new dropdown links */}
          <li><StyledLink to="/Articles">Articles</StyledLink></li>
          <li><StyledLink to="/Tributes">Remembering Loved Ones</StyledLink></li>
        </Ul>
      </nav>
    </SidebarWrapper>
  );
};

const SidebarWrapper = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  background-color: orange;
  height: 100%;
  width: 300px;
  transform: ${({ open }) => (open ? 'translateX(0)' : 'translateX(100%)')}; /* Slide in/out */
  transition: transform 0.3s ease-in-out;
  z-index: 999;
`;

const Ul = styled.ul`
  list-style: none;
  padding-top: 50px; /* Add some padding for better positioning */
`;

const StyledLink = styled(Link)`
  display: block;
  margin: 15px;
  padding: 10px;
  color: black;
  text-decoration: none;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 16px;
  :hover {
    color: white;
  }
`;

export default Sidebar;

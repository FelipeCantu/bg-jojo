import React from 'react'
import Menu from './Menu'
import styled from 'styled-components'
import {
  UserCircleIcon
} from '@heroicons/react/24/solid'


const Navbar = () => {
  return (
    <Nav>
      <NavContent>
      <Logo src={require('../../assets/jojologo.png')} alt="Logo" />
        <Menu />
        <Icons>
          <LoginButton>
            <UserCircleIcon />
            <p>Login</p>
          </LoginButton>
        </Icons>
      </NavContent>
    </Nav>
  );
}

const Nav = styled.div`
  position: sticky;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70px;
  background-color: orange;
  padding-top: 10px;
  @media (max-width: 768px) {
    height: 120px;
  }
`

const NavContent = styled.div `
   display: flex;
  justify-content: space-around;
  width: 85%; 
  // background-color: yellow;
  top: 0;
  ul {
    // background-color: purple;
  }
  a {
   color: black;
  text-decoration: none;
  padding: 10px 20px;
  font-size: 16px;
  display: flex;
  
  &:hover {
    text-decoration: underline;
    color: white;
  }
`


const Logo = styled.img`
  height: 100px; 
  width: auto;
  // background-color: red;
`

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
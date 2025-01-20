import React from 'react'
import Menu from './Menu'
import styled from 'styled-components'
import {
  UserCircleIcon
} from '@heroicons/react/24/outline'


const Navbar = () => {
  return (
    <Nav>
      <NavContent>
      <Logo src={require('../../assets/jojologo.png')} alt="Logo" />
        <Menu />
        <Icons>
          <div>
            <UserCircleIcon />
            <p>Login</p>
          </div>
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
  // background-color: red;
  // width: 50px;
  height: 50px;
  div {
    width: auto;
    height: 45px;
    padding: 5px;
    color: black;
    display: flex;
        &:hover {
    color: white;

  }
  }
`

export default Navbar;
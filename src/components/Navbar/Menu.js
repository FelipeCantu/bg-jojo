import React, { useState } from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';

const Menu = () => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => {
    setOpen(!open);
    console.log('Sidebar is open:', !open); // Check if the state is toggling correctly
  };

  return (
    <>
      <StyledMenu open={open} onClick={toggleMenu}>
        <div />
        <div />
        <div />
      </StyledMenu>
      <Sidebar open={open} setOpen={setOpen} />
    </>
  );
};

const StyledMenu = styled.div`
  width: 2rem;
  height: 2rem;
  position: fixed;
  top: 10px;
  right: 15px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  cursor: pointer;

  div {
    width: 2rem;
    height: 0.25rem;
    background-color: ${({ open }) => (open ? '#000' : '#000')};
    border-radius: 10px;
    transform-origin: 1px;
    transition: all 0.3s linear;

    &:nth-child(1) {
      transform: ${({ open }) => (open ? 'rotate(45deg)' : 'rotate(0)')};
    }
    &:nth-child(2) {
      transform: ${({ open }) => (open ? 'translateX(100%)' : 'translateX(0)')};
      opacity: ${({ open }) => (open ? 0 : 1)};
    }
    &:nth-child(3) {
      transform: ${({ open }) => (open ? 'rotate(-45deg)' : 'rotate(0)')};
    }
  }
`;

export default Menu;

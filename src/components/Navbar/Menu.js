import React, { useState } from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';

const Menu = () => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => {
    setOpen(!open);
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
  width: 1.6rem;
  height: 1.6rem;
  position: sticky;
  top: 15px;
  left: calc(100% - 40px); /* Positions from left edge instead */
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  cursor: pointer;
  margin-right: 15px; /* Additional adjustment */

  div {
    width: 1.6rem;
    height: 0.2rem;
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
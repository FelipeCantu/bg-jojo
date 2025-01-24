import React, { useState } from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';

const Menu = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <StyledMenu open={open} onClick={() => setOpen(!open)}>
                <div />
                <div />
                <div />
            </StyledMenu>
            <Sidebar open={open} />
        </>
    );
};

const StyledMenu = styled.div`
  width: 2rem;
  height: 2rem;
  position: fixed; /* Fixes the position to stay on screen */
  top: 10px; /* Keeps it at the top */
  right: 15px; /* Keeps it on the right */
  z-index: 9999; /* Ensures it stays above everything */
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

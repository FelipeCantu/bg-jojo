import React, { useState } from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';

const Menu = () => {
    const [open, setOpen] = useState(false)

    return (
        <>
            <StyledMenu open={open} onClick={() => setOpen(!open)}>
                <div />
                <div />
                <div />
            </StyledMenu>
            <Sidebar open={open} />
        </>
    )
};

const StyledMenu = styled.div`
width: 2rem;
height: 2rem;
position: absolute;
top: 5px;
right: 10px;
z-index: 1;
display: none;
@media (max-width: 768px) {
  display: flex;
  justify-content: space-around;
  flex-flow: column nowrap;
}
div {
  width: 2rem;
  height: 0.25rem;
  background-color: ${({ open }) => open ? '#000' : '#000'};
  border-radius: 10px;
  transform-origin: 1px;
  transition: all 0.3s linear;
  &:nth-child(1) {
    transform: ${({ open }) => open ? 'rotate(45deg)' : 'rotate(0)'};
  }
  &:nth-child(2) {
    transform: ${({ open }) => open ? 'translateX(100%)' : 'translateX(0)'};
    opacity: ${({ open }) => open ? 0 : 1};
  }
  &:nth-child(3) {
    transform: ${({ open }) => open ? 'rotate(-45deg)' : 'rotate(0)'};
  }
}
`

export default Menu;
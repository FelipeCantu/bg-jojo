import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import MyAccount from '../settings/MyAccount';
import MyWallet from '../settings/MyWallet';
import MyAddress from '../settings/MyAddress';
import MySettings from '../settings/MySettings';
import styled from 'styled-components';

const AccountSettings = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navRef = useRef(null);
  const touchStartRef = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle horizontal scroll for mobile
  const handleScroll = (direction) => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  // Handle touch swipe gestures
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    const touchEnd = e.touches[0].clientX;
    const touchDiff = touchStartRef.current - touchEnd;

    if (touchDiff > 50) {
      handleScroll('right'); // Swipe right
    } else if (touchDiff < -50) {
      handleScroll('left'); // Swipe left
    }
  };

  return (
    <ContainerWrapper>
      <Container>
        <h1>Account Settings</h1>
        <NavbarWrapper>
          {isMobile && (
            <ScrollButton onClick={() => handleScroll('left')}>‹</ScrollButton>
          )}
          <Navbar ref={navRef} isMobile={isMobile} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
            <NavItem to="account" className={({ isActive }) => isActive ? "active" : ""}>
              My Account
            </NavItem>
            <NavItem to="wallet">My Wallet</NavItem>
            <NavItem to="address">My Address</NavItem>
            <NavItem to="settings">Settings</NavItem>
          </Navbar>
          {isMobile && (
            <ScrollButton onClick={() => handleScroll('right')}>›</ScrollButton>
          )}
        </NavbarWrapper>

        <Routes>
          <Route index element={<Navigate to="account" replace />} />
          <Route path="account" element={<MyAccount />} />
          <Route path="wallet" element={<MyWallet />} />
          <Route path="address" element={<MyAddress />} />
          <Route path="settings" element={<MySettings />} />
        </Routes>
      </Container>
    </ContainerWrapper>
  );
};

const ContainerWrapper = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url(https://i.pinimg.com/736x/ac/62/36/ac623639e4368a63a9442e558cdadc06.jpg) no-repeat bottom center/cover;
  background-size: cover;
  padding: 0 15px;
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
  }
`;

const Container = styled.div`
  padding: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
  // overflow: hidden;
`;

const NavbarWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  // overflow: hidden;
`;

const Navbar = styled.nav`
  display: flex;
  justify-content: space-around; /* Space out items evenly */
  align-items: center;
  padding: 15px 0;
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  gap: 3rem;
  flex-wrap: nowrap;
  scroll-behavior: smooth;
  margin: 0 2rem;

  @media (max-width: 768px) {
    gap: 5rem;
    margin: 0 1rem;
  }

  &::-webkit-scrollbar {
    display: none;
  }
`;

const NavItem = styled(NavLink)`
  text-decoration: none;
  color: #2d1f0f;
  font-size: 1.2rem;
  font-weight: normal;
  position: relative;
  padding-bottom: 12px;
  flex-shrink: 0;

  &.active::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -16px;
    width: 100%;
    height: 4px;
    background-color: #0d3b2e;
  }

  @media (max-width: 768px) {
    // font-size: 1rem;
  }
`;

const ScrollButton = styled.button`
  background: rgba(153, 153, 153, 0.7); /* Semi-transparent gray */
  color: white;
  border: none;
  padding: 5px 10px;
  font-size: 1.5rem;
  cursor: pointer;
  position: absolute;
  z-index: 2;
  top: 50%;
  transform: translateY(-50%);
  
  &:first-of-type {
    left: 10px;
  }
  &:last-of-type {
    right: 10px;
  }

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

export default AccountSettings;

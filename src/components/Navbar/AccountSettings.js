import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import MyAccount from '../settings/MyAccount';
import MyWallet from '../settings/MyWallet';
import MyAddress from '../settings/MyAddress';
import MySettings from '../settings/MySettings';
import styled from 'styled-components';

const AccountSettings = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navRef = useRef(null);
  const touchStartRef = useRef(0);
  const location = useLocation();
  const indicatorRef = useRef(null);
  const navItemsRef = useRef([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const updateIndicatorPosition = useCallback((immediate = false) => {
    if (isAnimating) return;
    
    const path = location.pathname.split('/').pop() || 'account';
    const activeIndex = ['account', 'wallet', 'address', 'settings'].indexOf(path);
    
    if (activeIndex >= 0 && navItemsRef.current[activeIndex] && indicatorRef.current) {
      const activeElement = navItemsRef.current[activeIndex];
      const { offsetLeft, offsetWidth } = activeElement;

      if (immediate) {
        // No animation for immediate updates
        indicatorRef.current.style.transition = 'none';
        indicatorRef.current.style.left = `${offsetLeft}px`;
        indicatorRef.current.style.width = `${offsetWidth}px`;
      } else {
        // Enable smooth animation
        setIsAnimating(true);
        indicatorRef.current.style.transition = 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        indicatorRef.current.style.left = `${offsetLeft}px`;
        indicatorRef.current.style.width = `${offsetWidth}px`;
        
        // Reset animation state after transition completes
        const onTransitionEnd = () => {
          setIsAnimating(false);
          indicatorRef.current.removeEventListener('transitionend', onTransitionEnd);
        };
        indicatorRef.current.addEventListener('transitionend', onTransitionEnd);
      }

      // Center the active item on mobile
      if (isMobile && navRef.current) {
        const containerWidth = navRef.current.offsetWidth;
        const itemCenter = offsetLeft + (offsetWidth / 2);
        const scrollPosition = itemCenter - (containerWidth / 2);
        
        navRef.current.scrollTo({
          left: scrollPosition,
          behavior: immediate ? 'auto' : 'smooth'
        });
      }
    }
  }, [location.pathname, isMobile, isAnimating]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      updateIndicatorPosition(true); // Immediate update on resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicatorPosition]);

  useEffect(() => {
    updateIndicatorPosition();
  }, [location.pathname, updateIndicatorPosition]);

  const handleScroll = (direction) => {
    if (navRef.current && !isAnimating) {
      navRef.current.scrollBy({ 
        left: direction === 'left' ? -200 : 200, 
        behavior: 'smooth' 
      });
    }
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    const touchEnd = e.touches[0].clientX;
    const touchDiff = touchStartRef.current - touchEnd;

    if (touchDiff > 50) {
      handleScroll('right');
    } else if (touchDiff < -50) {
      handleScroll('left');
    }
  };

  return (
    <ContainerWrapper>
      <Container>
        <h1>Account Settings</h1>
        <NavbarWrapper>
          {isMobile && (
            <ScrollButton 
              onClick={() => handleScroll('left')}
              disabled={isAnimating}
            >
              ‹
            </ScrollButton>
          )}
          <Navbar 
            ref={navRef} 
            isMobile={isMobile} 
            onTouchStart={handleTouchStart} 
            onTouchMove={handleTouchMove}
          >
            <NavItem 
              ref={el => navItemsRef.current[0] = el}
              to="account" 
              className={({ isActive }) => isActive ? "active" : ""}
            >
              My Account
            </NavItem>
            <NavItem 
              ref={el => navItemsRef.current[1] = el}
              to="wallet" 
              className={({ isActive }) => isActive ? "active" : ""}
            >
              My Wallet
            </NavItem>
            <NavItem 
              ref={el => navItemsRef.current[2] = el}
              to="address" 
              className={({ isActive }) => isActive ? "active" : ""}
            >
              My Address
            </NavItem>
            <NavItem 
              ref={el => navItemsRef.current[3] = el}
              to="settings" 
              className={({ isActive }) => isActive ? "active" : ""}
            >
              Settings
            </NavItem>
            <ActiveIndicator ref={indicatorRef} />
          </Navbar>
          {isMobile && (
            <ScrollButton 
              onClick={() => handleScroll('right')}
              disabled={isAnimating}
            >
              ›
            </ScrollButton>
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
  background: #f3f3f3;
  background-size: cover;
  padding: 0 2rem 2rem;
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
`;

const NavbarWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
`;

const Navbar = styled.nav`
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 15px 0;
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  gap: 3rem;
  flex-wrap: nowrap;
  scroll-behavior: smooth;
  margin: 0 2rem;
  position: relative;

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
  transition: color 0.3s ease;

  &.active {
    color: #0d3b2e;
    font-weight: bold;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ActiveIndicator = styled.div`
  position: absolute;
  bottom: 0;
  height: 4px;
  background-color: #0d3b2e;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  left: 0;
  width: 0;
  border-radius: 2px;
  will-change: left, width;
`;

const ScrollButton = styled.button`
  background: rgba(153, 153, 153, 0.7);
  color: white;
  border: none;
  padding: 5px 10px;
  font-size: 1.5rem;
  cursor: pointer;
  position: absolute;
  z-index: 2;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 4px;
  transition: opacity 0.2s ease;
  
  &:first-of-type {
    left: 10px;
  }
  &:last-of-type {
    right: 10px;
  }

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }

  ${props => props.disabled && `
    opacity: 0.5;
    cursor: not-allowed;
  `}
`;

export default AccountSettings;
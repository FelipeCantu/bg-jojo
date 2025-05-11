import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import MyAccount from '../settings/MyAccount';
import MyWallet from '../settings/MyWallet';
import MyAddress from '../settings/MyAddress';
import MySettings from '../settings/MySettings';
import styled, { css } from 'styled-components';

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
        indicatorRef.current.style.transition = 'none';
        indicatorRef.current.style.left = `${offsetLeft}px`;
        indicatorRef.current.style.width = `${offsetWidth}px`;
      } else {
        setIsAnimating(true);
        indicatorRef.current.style.transition = 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        indicatorRef.current.style.left = `${offsetLeft}px`;
        indicatorRef.current.style.width = `${offsetWidth}px`;
        
        const onTransitionEnd = () => {
          setIsAnimating(false);
          indicatorRef.current.removeEventListener('transitionend', onTransitionEnd);
        };
        indicatorRef.current.addEventListener('transitionend', onTransitionEnd);
      }

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
      updateIndicatorPosition(true);
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
        <Title>Account Settings</Title>
        <NavbarWrapper>
          {isMobile && (
            <ScrollButton 
              onClick={() => handleScroll('left')}
              disabled={isAnimating}
              aria-label="Scroll left"
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
              aria-label="Scroll right"
            >
              ›
            </ScrollButton>
          )}
        </NavbarWrapper>

        <ContentArea>
          <Routes>
            <Route index element={<Navigate to="account" replace />} />
            <Route path="account" element={<MyAccount />} />
            <Route path="wallet" element={<MyWallet />} />
            <Route path="address" element={<MyAddress />} />
            <Route path="settings" element={<MySettings />} />
          </Routes>
        </ContentArea>
      </Container>
    </ContainerWrapper>
  );
};

const ContainerWrapper = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: #f3f3f3;
  padding: 0;
  overflow: hidden;
  width: 100%;
  
  @media (min-width: 768px) {
    padding: 2rem 0;
    align-items: center;
  }

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
  padding: 1rem;
  width: 100%;
  height: 100vh;
  margin: 0;
  background: rgba(255, 255, 255, 0.95);
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  @media (min-width: 768px) {
    padding: 2rem;
    max-width: 1200px;
    height: auto;
    min-height: auto;
    border-radius: 8px;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2d1f0f;
  padding: 0 0.5rem;
  
  @media (min-width: 768px) {
    font-size: 2rem;
    padding: 0;
    margin-bottom: 1.5rem;
  }
`;

const NavbarWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  margin-bottom: 0;
`;

const Navbar = styled.nav`
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0;
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  gap: 3rem;
  flex-wrap: nowrap;
  scroll-behavior: smooth;
  margin: 0 2rem;
  position: relative;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    gap: 5rem;
    margin: 0 1rem;
    padding: 0;
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
  margin: 0;

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
  border-radius: 2px 2px 0 0;
  will-change: left, width;
  margin: 0;
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

  ${props => props.disabled && css`
    opacity: 0.5;
    cursor: not-allowed;
  `}
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 0.5rem;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  @media (min-width: 768px) {
    padding: 0;
    overflow-y: visible;
  }
`;

export default AccountSettings;
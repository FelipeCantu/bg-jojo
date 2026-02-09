import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import MyAccount from '../settings/MyAccount';
import MyWallet from '../settings/MyWallet';
import MyAddress from '../settings/MyAddress';
import MySettings from '../settings/MySettings';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

const pageVariants = {
  initial: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 1
  }),
  in: {
    x: 0,
    opacity: 1
  },
  out: (direction) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 1
  })
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3
};

const tabs = ['account', 'wallet', 'address', 'settings'];

const AccountSettings = () => {
  const [isMobile] = useState(window.innerWidth < 768);
  const navRef = useRef(null);
  const touchStartRef = useRef(0);
  const location = useLocation();

  useEffect(() => {
    if (navRef.current) {
      const activeLink = navRef.current.querySelector('a.active');
      if (activeLink) {
        const container = navRef.current;
        const scrollLeft = activeLink.offsetLeft - (container.offsetWidth / 2) + (activeLink.offsetWidth / 2);

        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [location.pathname]);

  const getTabIndex = (path) => {
    const currentTab = tabs.find(tab => path.endsWith(tab));
    return currentTab ? tabs.indexOf(currentTab) : 0;
  };

  const [visualDirection, setVisualDirection] = useState(0);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const prevIndex = getTabIndex(prevPathRef.current);
    const currIndex = getTabIndex(location.pathname);
    setVisualDirection(currIndex - prevIndex);
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  const handleScroll = (direction) => {
    if (navRef.current) {
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
              aria-label="Scroll left"
            >
              ‹
            </ScrollButton>
          )}
          <LayoutGroup>
            <Navbar
              ref={navRef}
              isMobile={isMobile}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
            >
              <NavItem
                to="account"
                className={({ isActive }) => isActive ? "active" : ""}
              >
                My Account
                {location.pathname.endsWith('/account') && (
                  <Underline
                    layoutId="underline"
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </NavItem>
              <NavItem
                to="wallet"
                className={({ isActive }) => isActive ? "active" : ""}
              >
                My Wallet
                {location.pathname.endsWith('/wallet') && (
                  <Underline
                    layoutId="underline"
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </NavItem>
              <NavItem
                to="address"
                className={({ isActive }) => isActive ? "active" : ""}
              >
                My Address
                {location.pathname.endsWith('/address') && (
                  <Underline
                    layoutId="underline"
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </NavItem>
              <NavItem
                to="settings"
                className={({ isActive }) => isActive ? "active" : ""}
              >
                My Settings
                {location.pathname.endsWith('/settings') && (
                  <Underline
                    layoutId="underline"
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </NavItem>
            </Navbar>
          </LayoutGroup>
          {isMobile && (
            <ScrollButton
              onClick={() => handleScroll('right')}
              aria-label="Scroll right"
            >
              ›
            </ScrollButton>
          )}
        </NavbarWrapper>

        <ContentArea>
          <AnimatePresence initial={false} mode="popLayout" custom={visualDirection}>
            <Routes location={location} key={location.pathname}>
              <Route index element={<Navigate to="account" replace />} />
              <Route path="account" element={
                <PageWrapper
                  custom={visualDirection}
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <MyAccount />
                </PageWrapper>
              } />
              <Route path="wallet" element={
                <PageWrapper
                  custom={visualDirection}
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <MyWallet />
                </PageWrapper>
              } />
              <Route path="address" element={
                <PageWrapper
                  custom={visualDirection}
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <MyAddress />
                </PageWrapper>
              } />
              <Route path="settings" element={
                <PageWrapper
                  custom={visualDirection}
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <MySettings />
                </PageWrapper>
              } />
            </Routes>
          </AnimatePresence>
        </ContentArea>
      </Container>
    </ContainerWrapper >
  );
};

const ContainerWrapper = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--background-alt);
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
  border-radius: 0 0 8px 8px; 
  
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
  color: var(--secondary-color);
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
  overflow: hidden; // Contain the indicator
`;

const Navbar = styled.nav`
  display: flex;
  justify-content: space-around; // Keep original desktop style
  align-items: center;
  padding: 0;
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  gap: 3rem; // Keep original gap
  flex-wrap: nowrap;
  scroll-behavior: smooth;
  position: relative;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    justify-content: flex-start;
    padding: 0 1rem 12px;
    margin-bottom: 1.5rem;
    gap: 1.5rem;
  }
`;

const Underline = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background-color: var(--secondary-color);
  border-radius: 2px 2px 0 0;
`;

const NavItem = styled(NavLink)`
  text-decoration: none;
  color: var(--text-color);
  font-size: 1.2rem;
  font-weight: normal;
  position: relative;
  padding-bottom: 12px;
  flex-shrink: 0;
  transition: color 0.3s ease;
  margin: 0;
  
  &.active {
    color: var(--secondary-color);
    font-weight: bold;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0 0.5rem 12px; // Add horizontal padding only for mobile
    min-width: max-content; // Prevent text wrapping
  }
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
    overflow-x: hidden;
    position: relative;
    display: grid;
    grid-template-columns: 100%;
    grid-template-rows: 1fr;
    align-items: start;
  }
`;

const PageWrapper = styled(motion.div)`
  width: 100%;
  height: auto;
  grid-column: 1;
  grid-row: 1;
`;

export default AccountSettings;
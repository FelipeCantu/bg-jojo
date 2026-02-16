import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import MyAccount from '../settings/MyAccount';
import MyWallet from '../settings/MyWallet';
import MyAddress from '../settings/MyAddress';
import MySettings from '../settings/MySettings';
import MyOrderHistory from '../settings/MyOrderHistory';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

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

const tabs = ['account', 'wallet', 'orders', 'address', 'settings'];

const AccountSettings = () => {
  const [isMobile] = useState(window.innerWidth < 768);
  const navRef = useRef(null);
  const touchStartRef = useRef(0);
  const location = useLocation();
  const tabRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, ready: false });
  const activeTab = tabs.find(tab => location.pathname.endsWith(tab)) || 'account';

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

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeTab];
      if (activeEl && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const tabRect = activeEl.getBoundingClientRect();
        setIndicatorStyle({
          left: tabRect.left - navRect.left + navRef.current.scrollLeft,
          width: tabRect.width,
          ready: true,
        });
      }
    };
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

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
            <Navbar
              ref={navRef}
              isMobile={isMobile}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
            >
              <NavItem
                to="account"
                ref={el => { tabRefs.current.account = el; }}
                className={({ isActive }) => isActive ? "active" : ""}
              >
                My Account
              </NavItem>
              <NavItem
                to="wallet"
                ref={el => { tabRefs.current.wallet = el; }}
                className={({ isActive }) => isActive ? "active" : ""}
              >
                My Wallet
              </NavItem>
              <NavItem
                to="orders"
                ref={el => { tabRefs.current.orders = el; }}
                className={({ isActive }) => isActive ? "active" : ""}
              >
                My Orders
              </NavItem>
              <NavItem
                to="address"
                ref={el => { tabRefs.current.address = el; }}
                className={({ isActive }) => isActive ? "active" : ""}
              >
                My Address
              </NavItem>
              <NavItem
                to="settings"
                ref={el => { tabRefs.current.settings = el; }}
                className={({ isActive }) => isActive ? "active" : ""}
              >
                My Settings
              </NavItem>
              <Underline
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                  opacity: indicatorStyle.ready ? 1 : 0,
                }}
              />
            </Navbar>
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
              <Route path="orders" element={
                <PageWrapper
                  custom={visualDirection}
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <MyOrderHistory />
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
  overflow: hidden;

  @media (max-width: 768px) {
    margin-left: -1rem;
    margin-right: -1rem;
    width: calc(100% + 2rem);
    border-bottom: 1px solid #eee;
  }
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
    padding: 0 1rem 10px;
    margin-bottom: 0;
    gap: 1.5rem;
  }
`;

const Underline = styled.div`
  position: absolute;
  bottom: 0;
  height: 4px;
  background-color: var(--secondary-color);
  border-radius: 2px 2px 0 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
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
  padding: 1rem 0.5rem 0;
  scrollbar-width: none;
  min-height: 0;

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
    align-items: stretch;
  }
`;

const PageWrapper = styled(motion.div)`
  width: 100%;
  min-height: 500px;
  grid-column: 1;
  grid-row: 1;
`;

export default AccountSettings;
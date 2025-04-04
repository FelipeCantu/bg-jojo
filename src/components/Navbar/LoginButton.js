import React, { useState, useEffect, useRef } from 'react';
import { UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import { signInWithGoogle, logOut } from '../../firebaseconfig';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebaseconfig';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const LoginButton = ({ hideInNavbar, closeSidebar }) => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleNavigation = (path) => {
    navigate(path);
    setDropdownOpen(false);
    if (closeSidebar) closeSidebar();
  };

  return (
    <Icons>
      {user ? (
        <UserProfile ref={dropdownRef}>
          <ProfileContainer onClick={toggleDropdown}>
            <UserImage 
              src={user.photoURL || '/default-user.png'} 
              alt="User" 
              onError={(e) => {
                e.target.src = '/default-user.png';
              }}
            />
            <UserName>{user.displayName || 'User'}</UserName>
            <ChevronIcon $isOpen={dropdownOpen} />
          </ProfileContainer>
          {dropdownOpen && (
            <DropdownMenu>
              <DropdownItem onClick={() => handleNavigation('/profile')}>
                Profile
              </DropdownItem>
              <DropdownItem onClick={() => handleNavigation('/notifications')}>
                Notifications
              </DropdownItem>
              <DropdownItem onClick={() => handleNavigation('/account-settings')}>
                Account Settings
              </DropdownItem>
              <DropdownItem onClick={() => handleNavigation('/subscriptions')}>
                Subscriptions
              </DropdownItem>
              <Divider />
              <DropdownItem $danger onClick={logOut}>
                Logout
              </DropdownItem>
            </DropdownMenu>
          )}
        </UserProfile>
      ) : (
        !hideInNavbar && (
          <LoginContainer onClick={signInWithGoogle}>
            <UserCircleIcon />
            <LoginText>Login</LoginText>
          </LoginContainer>
        )
      )}
    </Icons>
  );
};

// Styled Components
const Icons = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const LoginContainer = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-color);
  
  &:hover {
    background-color: rgb(243, 86, 134);
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: currentColor;
  }
`;

const LoginText = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
`;

const UserProfile = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
`;

const ProfileContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgb(243, 86, 134);
  }
`;

const UserImage = styled.img`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
`;

const UserName = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 768px) {
    max-width: 80px;
  }
`;

const ChevronIcon = styled(ChevronDownIcon)`
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s ease;
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  color: currentColor;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--background);
  box-shadow: var(--box-shadow);
  border-radius: var(--border-radius);
  padding: 0.5rem 0;
  z-index: 1000;
  min-width: 200px;
  animation: ${fadeIn} 0.2s ease-out forwards;
  margin-top: 0.5rem;
`;

const DropdownItem = styled.div`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${props => props.$danger ? 'var(--error-color, #e53e3e)' : 'var(--text-color)'};
  
  &:hover {
    // background-color: rgba(0, 0, 0, 0.05);
    color: ${props => props.$danger ? 'var(--error-color, #e53e3e)' : 'var(--secondary-color)'};
  }
  
  &:active {
    // background-color: rgba(0, 0, 0, 0.1);
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: var(--border-color, #e2e8f0);
  margin: 0.5rem 0;
`;

export default LoginButton;
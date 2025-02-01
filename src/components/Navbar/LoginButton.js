import React, { useState, useEffect, useRef } from 'react';
import { UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import { signInWithGoogle, logOut } from '../../firebaseconfig';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebaseconfig';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom'; // Use useNavigate for navigation

const LoginButton = ({ hideInNavbar }) => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); // Reference for dropdown menu
  const navigate = useNavigate(); // Hook for navigation

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Cleanup the listener when component is unmounted
  }, []);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  // Close dropdown when clicking outside
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

  const navigateToProfile = () => {
    navigate('/profile'); // Navigate to Profile page
    setDropdownOpen(false); // Close dropdown
  };

  const navigateToNotifications = () => {
    navigate('/notifications'); // Navigate to Notifications page
    setDropdownOpen(false);
  };

  const navigateToSettings = () => {
    navigate('/account-settings'); // Navigate to Account Settings
    setDropdownOpen(false);
  };

  return (
    <Icons>
      {user ? (
        <UserProfile ref={dropdownRef}>
          <UserImage src={user.photoURL} alt="User" onClick={toggleDropdown} />
          <UserName>{user.displayName}</UserName>
          <ChevronDownIcon
            style={{
              width: '16px',
              height: '16px',
              transition: 'transform 0.3s',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', // Rotate when dropdown is open
            }}
            onClick={toggleDropdown}
          />
          {dropdownOpen && (
            <DropdownMenu>
              <DropdownItem onClick={navigateToProfile}>Profile</DropdownItem>
              <DropdownItem onClick={navigateToNotifications}>Notifications</DropdownItem>
              <DropdownItem onClick={navigateToSettings}>Account Settings</DropdownItem>
              <DropdownItem onClick={() => { navigate('/subscriptions'); setDropdownOpen(false); }}>
                Subscriptions
              </DropdownItem>
              <Divider />
              <DropdownItem onClick={logOut}>Logout</DropdownItem>
            </DropdownMenu>
          )}
        </UserProfile>
      ) : (
        !hideInNavbar && (
          <LoginContainer onClick={signInWithGoogle}>
            <UserCircleIcon style={{ width: '20px', height: '20px', marginRight: '8px' }} />
            <p>Login</p>
          </LoginContainer>
        )
      )}
    </Icons>
  );
};

// Styled Components for LoginButton
const Icons = styled.div`
  display: flex;
  align-items: center;
`;

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  cursor: pointer;
`;

const UserImage = styled.img`
  width: 35px;
  height: 35px;
  border-radius: 50%;
`;

const UserName = styled.p`
  font-size: 14px;
  font-weight: bold;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 40px;
  right: 0;
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 10px;
  border-radius: 5px;
  z-index: 999;
  width: 200px;
`;

const DropdownItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  &:hover {
    background-color: #f0f0f0;
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: #ddd;
  margin: 8px 0;
`;

export default LoginButton;

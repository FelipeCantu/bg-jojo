import React, { useState, useEffect } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { signInWithGoogle, logOut } from '../../firebaseconfig';
import { onAuthStateChanged } from 'firebase/auth'; 
import { auth } from '../../firebaseconfig';
import styled from 'styled-components';

const LoginButton = ({ hideInNavbar }) => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Cleanup the listener when component is unmounted
  }, []);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <Icons>
      {user ? (
        <UserProfile>
          <UserImage src={user.photoURL} alt="User" onClick={toggleDropdown} />
          <UserName>{user.displayName}</UserName>
          {dropdownOpen && (
            <DropdownMenu>
              <DropdownItem onClick={logOut}>Logout</DropdownItem>
            </DropdownMenu>
          )}
        </UserProfile>
      ) : (
        !hideInNavbar && (  // Only render the Login button in the Navbar if not logged in
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
`;

const DropdownItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  &:hover {
    background-color: #f0f0f0;
  }
`;

export default LoginButton;
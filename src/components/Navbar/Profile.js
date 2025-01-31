import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseconfig';
import { onAuthStateChanged } from 'firebase/auth';
import styled from 'styled-components';

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  if (!user) {
    return <Message>Please log in to view your profile.</Message>;
  }

  return (
    <ProfileContainer>
      <ProfileCard>
        <ProfileImage src={user.photoURL} alt="User" />
        <UserInfo>
          <UserName>{user.displayName}</UserName>
          <UserEmail>{user.email}</UserEmail>
        </UserInfo>
      </ProfileCard>
    </ProfileContainer>
  );
};

// Styled Components
const ProfileContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f4f4f4;
`;

const ProfileCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 350px;
`;

const ProfileImage = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 15px;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.h2`
  font-size: 20px;
  margin: 5px 0;
`;

const UserEmail = styled.p`
  font-size: 14px;
  color: gray;
`;

const Message = styled.p`
  text-align: center;
  font-size: 18px;
  margin-top: 20px;
`;

export default Profile;

import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseconfig';
import { onAuthStateChanged } from 'firebase/auth';
import styled from 'styled-components';
// import AbstractCloud from '../../assets/cloudsabstract.svg';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [joinDate, setJoinDate] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Convert Firebase timestamp to readable date
        const creationDate = new Date(currentUser.metadata.creationTime);
        setJoinDate(creationDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }));
      }
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
          <JoinDate>Joined on: {joinDate}</JoinDate>
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
  position: relative; /* Needed for the overlay */
  background-image: url(https://i.pinimg.com/736x/ac/62/36/ac623639e4368a63a9442e558cdadc06.jpg);
  background-size: cover;
  background-position: bottom;
  background-repeat: no-repeat;

  /* Overlay */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5); /* Adjust the opacity for desired darkness */
    z-index: 1; /* Ensures overlay is above background but below content */
  }

  /* Ensures content is above overlay */
  > * {
    position: relative;
    z-index: 2;
  }
`;


const ProfileCard = styled.div`
  background: rgba(255, 255, 255, 0.9); /* Add transparency */
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

const JoinDate = styled.p`
  font-size: 14px;
  color: gray;
  margin-top: 10px;
`;

const Message = styled.p`
  text-align: center;
  font-size: 18px;
  margin-top: 20px;
`;

export default Profile;

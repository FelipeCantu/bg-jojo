import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styled from 'styled-components';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [joinDate, setJoinDate] = useState('');
  const [bio, setBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const creationDate = new Date(currentUser.metadata.creationTime);
        setJoinDate(
          creationDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        );

        // Fetch bio from Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setBio(userSnap.data().bio || '');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleBioChange = (e) => {
    setBio(e.target.value);
  };

  const handleSaveBio = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { bio }, { merge: true });
      console.log('Bio saved successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving bio:', error);
    }
  };

  if (!user) {
    return <Message>Please log in to view your profile.</Message>;
  }

  return (
    <ProfileContainer>
      <ProfileCard>
        <ProfileContent>
          <ProfileImage src={user.photoURL} alt="User" />
          <UserInfo>
            <UserName>{user.displayName}</UserName>
            <UserEmail>{user.email}</UserEmail>
            <JoinDate>Joined on: {joinDate}</JoinDate>
          </UserInfo>

          <BioSection>
            <BioLabel>About Yourself</BioLabel>
            {isEditing ? (
              <>
                <BioTextarea
                  value={bio}
                  onChange={handleBioChange}
                  placeholder="Tell us about yourself..."
                />
                <SaveBioButton onClick={handleSaveBio}>Save</SaveBioButton>
              </>
            ) : (
              <BioDisplay onClick={() => setIsEditing(true)}>
                {bio || 'Click to add a bio...'}
              </BioDisplay>
            )}
          </BioSection>
        </ProfileContent>
      </ProfileCard>
    </ProfileContainer>
  );
};

const ProfileContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f4f4f4;
`;

const ProfileCard = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 400px;
  width: 100%;
`;

const ProfileContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ProfileImage = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 15px;
`;

const UserInfo = styled.div`
  text-align: center;
`;

const UserName = styled.h2`
  margin: 8px 0;
`;

const UserEmail = styled.p`
  color: gray;
`;

const JoinDate = styled.p`
  font-size: 14px;
  color: #888;
`;

const BioSection = styled.div`
  margin-top: 20px;
  width: 100%;
`;

const BioLabel = styled.label`
  font-size: 16px;
  margin-bottom: 8px;
`;

const BioTextarea = styled.textarea`
  width: 100%;
  height: 100px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 14px;
  resize: none;
`;

const SaveBioButton = styled.button`
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #024a47;
  color: white;
  font-size: 14px;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #013d3b;
  }
`;

const BioDisplay = styled.div`
  background: #f3f3f3;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
`;

const Message = styled.p`
  text-align: center;
  font-size: 18px;
`;

export default Profile;

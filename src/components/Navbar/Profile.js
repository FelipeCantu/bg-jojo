import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styled from 'styled-components';
import { FaCamera } from 'react-icons/fa';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [joinDate, setJoinDate] = useState('');
  const [bio, setBio] = useState('');
  const [banner, setBanner] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log("User:", currentUser); // Debugging: Check user data
        setUser(currentUser);
        const creationDate = new Date(currentUser.metadata.creationTime);
        setJoinDate(
          creationDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        );

        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setBio(userSnap.data().bio || '');
          setBanner(userSnap.data().banner || ''); // Ensure banner is fetched correctly
        } else {
          console.error('User data not found in Firestore');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleBioChange = (e) => setBio(e.target.value);

  const handleSaveBio = async () => {
    if (!user || !user.uid) {
      console.error('User or user.uid is undefined');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { bio, banner }, { merge: true });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving bio:', error);
    }
  };

  const handleBannerChange = async (event) => {
    if (!user || !user.uid) {
      console.error('User or user.uid is undefined');
      return;
    }

    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setBanner(reader.result);
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { banner: reader.result }, { merge: true });
        } catch (error) {
          console.error('Error updating banner:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteBanner = async () => {
    if (!user || !user.uid) {
      console.error('User or user.uid is undefined');
      return;
    }

    try {
      setBanner('');
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { banner: '' }, { merge: true });
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  if (!user) return <Message>Please log in to view your profile.</Message>;

  return (
    <ProfileContainer>
      <ProfileCard>
        <Banner style={{ backgroundImage: banner ? `url(${banner})` : 'none', backgroundColor: banner ? 'transparent' : '#D3D3D3' }}>
        <BannerEditIconWithText>
            <BannerEditIcon>
              <label htmlFor="banner-upload">
                <FaCamera />
              </label>
              <input id="banner-upload" type="file" accept="image/*" onChange={handleBannerChange} hidden />
              <HoverText>Change Photo</HoverText>
            </BannerEditIcon>
            {banner && (
              <DeleteBannerButton onClick={handleDeleteBanner}>Delete Photo</DeleteBannerButton>
            )}
          </BannerEditIconWithText>
          <UserInfo>
            <ProfileImage src={user.photoURL} alt="User" />
            <div>
              <UserName>{user.displayName}</UserName>
              <UserEmail>{user.email}</UserEmail>
              <JoinDate>Joined on: {joinDate}</JoinDate>
            </div>
          </UserInfo>
        </Banner>
        <ProfileContent>
          <BioSection>
            <BioLabel>About Yourself</BioLabel>
            {isEditing ? (
              <>
                <BioTextarea value={bio} onChange={handleBioChange} placeholder="Tell us about yourself..." />
                <SaveBioButton onClick={handleSaveBio}>Save</SaveBioButton>
              </>
            ) : (
              <BioDisplay onClick={() => setIsEditing(true)}>
                {bio || 'Click to add a bio...'}
              </BioDisplay>
            )}
          </BioSection>
        </ProfileContent>
        <ProfileHeader>
        <h1>Profile View</h1>
      </ProfileHeader>
      </ProfileCard>
    </ProfileContainer>
  );
};

const ProfileContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: url(https://i.pinimg.com/736x/ac/62/36/ac623639e4368a63a9442e558cdadc06.jpg) no-repeat bottom center/cover;
  min-height: 100vh;
`;

const ProfileHeader = styled.div`
  width: 100%;
  text-align: center;
  background-color: #024a47;
  color: white;
  font-size: 24px;
  font-weight: bold;
  bottom: 0;
`;

const ProfileCard = styled.div`
  background: white;
  width: 1000px;
  min-height: 800px;
  margin-top: 0;
`;

const Banner = styled.div`
  width: 100%;
  height: 250px;
  background-size: cover;
  background-position: center;
  position: relative;
  background-color: #D3D3D3; /* Default gray color */
`;

const BannerEditIcon = styled.div`
  position: absolute;
  top: 10px; /* Move to top left */
  left: 10px;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent; /* No background by default */
  transition: background 0.3s ease-in-out; /* Smooth background transition */

  label {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  input {
    display: none;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.7); /* Apply background when hovered */
  }
`;

const HoverText = styled.div`
  position: absolute;
  top: 50%;
  left: 100%;
  transform: translateY(-50%); /* Center the text vertically */
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  font-size: 14px;
  border-radius: 5px;
  visibility: hidden; /* Hide text by default */
  opacity: 0;
  white-space: nowrap; /* Prevent the text from wrapping */
  transition: opacity 0.3s ease-in-out, left 0.3s ease-in-out; /* Smooth slide effect */
`;

const BannerEditIconWithText = styled.div`
  position: relative;
  display: flex; /* Make the icon and text align horizontally */
  align-items: center;

  &:hover ${HoverText} {
    visibility: visible;
    opacity: 1;
    left: 120%; /* Slide the text to the right on hover */
  }
`;

const DeleteBannerButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ff4d4d;
  color: white;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background-color: #e04343;
  }
`;

const UserInfo = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
`;

const ProfileImage = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
`;

const UserName = styled.h2`
  margin: 0;
  font-size: 18px;
`;

const UserEmail = styled.p`
  margin: 0;
  font-size: 14px;
`;

const JoinDate = styled.p`
  margin: 0;
  font-size: 12px;
`;

const ProfileContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const BioSection = styled.div`
  margin-top: 20px;
`;

const BioLabel = styled.label`
  font-size: 16px;
  margin-bottom: 8px;
`;

const BioTextarea = styled.textarea`
  width: 100%;
  height: 200px;
  font-size: 14px;
  resize: none;
`;

const SaveBioButton = styled.button`
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #024a47;
  color: white;
  border: none;
  cursor: pointer;
`;

const BioDisplay = styled.div`
  background: #f3f3f3;
  padding: 10px;
  cursor: pointer;
`;

const Message = styled.p`
  text-align: center;
  font-size: 18px;
`;

export default Profile;

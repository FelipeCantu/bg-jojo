import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styled from 'styled-components';
import { FaCamera } from 'react-icons/fa';
import UserArticles from './UserArticles';
import { client } from '../../sanityClient'; // Assuming you've set up Sanity client

const Profile = () => {
  const [user, setUser] = useState(null);
  const [joinDate, setJoinDate] = useState('');
  const [bio, setBio] = useState('');
  const [banner, setBanner] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setBio(userSnap.data().bio || '');
          setBanner(userSnap.data().banner || '');
        } else {
          console.error('User data not found in Firestore');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleBioChange = (e) => setBio(e.target.value);

  const handleSaveBio = async () => {
    if (!user || !user.uid || isSaving) return;
    setIsSaving(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { bio, banner }, { merge: true });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving bio:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBannerChange = async (event) => {
    if (!user || !user.uid) return;

    const file = event.target.files[0];
    if (!file) return;

    try {
      // Upload banner image to Sanity
      const imageAsset = await client.assets.upload('image', file);
      const imageUrl = imageAsset.url;

      // Set the banner state
      setBanner(imageUrl);

      // Save the banner URL in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { banner: imageUrl }, { merge: true });

      console.log('Banner URL saved to Firestore');
    } catch (error) {
      console.error('Error uploading banner to Sanity:', error);
    }
  };

  const handleDeleteBanner = async () => {
    if (!user || !user.uid) return;

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
        <Banner
          style={{
            backgroundImage: banner ? `url(${banner})` : 'none',
            backgroundColor: banner ? 'transparent' : '#D3D3D3',
          }}
        >
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
            <ProfileImage src={user.photoURL} alt={`${user.displayName}'s profile`} />
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
                <SaveBioButton onClick={handleSaveBio} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </SaveBioButton>
              </>
            ) : (
              <BioDisplay onClick={() => setIsEditing(true)}>
                {bio || 'Click to add a bio...'}
              </BioDisplay>
            )}
          </BioSection>
          {user?.uid && <UserArticles userId={user.uid} />}
          {!user?.uid && <p>No articles yet.</p>}
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
  @media (max-width: 768px) {
    width: 100%;
    margin: 20px;
  }
`;

const Banner = styled.div`
  width: 100%;
  height: 250px;
  background-size: cover;
  background-position: center;
  position: relative;
  background-color: #d3d3d3;
`;

const BannerEditIcon = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: background 0.3s ease-in-out;

  label {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  input {
    display: none;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }
`;

const HoverText = styled.div`
  position: absolute;
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  font-size: 14px;
  border-radius: 5px;
  visibility: hidden;
  opacity: 0;
  white-space: nowrap;
  transition: opacity 0.3s ease-in-out, left 0.3s ease-in-out;
`;

const BannerEditIconWithText = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  &:hover ${HoverText} {
    visibility: visible;
    opacity: 1;
    left: 120%;
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

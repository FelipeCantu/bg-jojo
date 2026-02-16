import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styled from 'styled-components';
import { FaCamera, FaCog, FaShoppingCart, FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import UserArticles from './UserArticles';
import { client } from '../../sanityClient'; // Assuming you've set up Sanity client
import AuthForm from '../AuthForm';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [joinDate, setJoinDate] = useState('');
  const [bio, setBio] = useState('');
  const [banner, setBanner] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

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

  if (!user) {
    return (
      <AuthForm
        title="Sign in to View Profile"
        subtitle="Manage your bio, articles, and settings"
        redirectTo="/profile"
      />
    );
  }

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
          <MainGrid>
            <LeftColumn>
              <SectionTitle>About Yourself</SectionTitle>
              <BioSection>
                {isEditing ? (
                  <>
                    <BioTextarea
                      value={bio}
                      onChange={handleBioChange}
                      placeholder="Tell us about yourself..."
                      maxLength={500}
                    />
                    <CharacterCount exceeded={bio.length > 500}>
                      {bio.length}/500 characters
                    </CharacterCount>
                    <ButtonGroup>
                      <SaveBioButton onClick={handleSaveBio} disabled={isSaving || bio.length > 500}>
                        {isSaving ? 'Saving...' : 'Save'}
                      </SaveBioButton>
                      <CancelButton onClick={() => setIsEditing(false)}>
                        Cancel
                      </CancelButton>
                    </ButtonGroup>
                  </>
                ) : (
                  <BioDisplay onClick={() => setIsEditing(true)}>
                    {bio}
                  </BioDisplay>
                )}
              </BioSection>
            </LeftColumn>

            <RightColumn>
              <SectionTitle>Quick Actions</SectionTitle>
              <DashboardGrid>
                <DashboardCard onClick={() => navigate('/account-settings/orders')}>
                  <IconWrapper><FaShoppingCart /></IconWrapper>
                  <h3>Orders</h3>
                  <p>Purchase history</p>
                </DashboardCard>

                <DashboardCard onClick={() => navigate('/notifications')}>
                  <IconWrapper><FaBell /></IconWrapper>
                  <h3>Notifications</h3>
                  <p>View updates</p>
                </DashboardCard>

                <DashboardCard onClick={() => navigate('/account-settings')}>
                  <IconWrapper><FaCog /></IconWrapper>
                  <h3>Settings</h3>
                  <p>Manage account</p>
                </DashboardCard>
              </DashboardGrid>
            </RightColumn>
          </MainGrid>
        </ProfileContent>
        <ArticlesSection>
          <SectionTitle>My Articles</SectionTitle>
          {user?.uid && <UserArticles userId={user.uid} />}
          {!user?.uid && <p>No articles yet.</p>}
        </ArticlesSection>
      </ProfileCard>
    </ProfileContainer >
  );
};

const ProfileContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #f3f3f3;
  min-height: 100vh;
  padding-top: 0; // Ensure there's no extra space at the top
`;

const ProfileCard = styled.div`
  background: white;
  width: 1000px;
  min-height: 800px;
  margin-top: 0; // Ensure no margin pushing it down
  position: relative; // Optional, in case of unwanted gaps
  top: 0; // Ensure it sticks to the top
  @media (max-width: 768px) {
    width: 100%;
    margin: 0; // Remove margin for mobile view as well
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
  padding: 20px;
`;

const MainGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const LeftColumn = styled.div`
  width: 100%;
`;

const RightColumn = styled.div`
  width: 100%;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0f0f0;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const DashboardCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-color: #024a47;
  }

  h3 {
    font-size: 1rem;
    margin: 0.5rem 0 0.25rem;
    color: #333;
  }

  p {
    font-size: 0.85rem;
    color: #666;
    margin: 0;
  }
`;

const IconWrapper = styled.div`
  font-size: 1.5rem;
  color: #024a47;
  margin-bottom: 0.5rem;
`;

const ArticlesSection = styled.div`
  padding: 20px;
  border-top: 1px solid #eee;
`;

const BioSection = styled.div`
  width: 100%;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 1.5rem;
`;



const BioTextarea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 15px;
  font-size: 16px;
  line-height: 1.6;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  resize: vertical;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #024a47;
    box-shadow: 0 0 0 2px rgba(2, 74, 71, 0.2);
    outline: none;
  }
  
  &::placeholder {
    color: #aaa;
  }
`;

const BioDisplay = styled.div`
  width: 100%;
  min-height: 150px;
  padding: 15px;
  font-size: 16px;
  line-height: 1.6;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: pre-wrap;
  word-break: break-word;
  
  &:hover {
    background: #f0f0f0;
    border-color: #ccc;
  }
  
  &:empty:before {
    content: 'Click to add a bio...';
    color: #aaa;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

const SaveBioButton = styled.button`
  padding: 10px 20px;
  background-color: #024a47;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #01332f;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const CharacterCount = styled.div`
  font-size: 14px;
  color: ${props => props.exceeded ? '#ff4d4d' : '#666'};
  text-align: right;
  margin-top: 5px;
`;



export default Profile;
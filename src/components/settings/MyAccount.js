import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../../firebaseconfig';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import styled from 'styled-components';
import { FaCamera, FaUser, FaEnvelope } from 'react-icons/fa';

const MyAccount = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.displayName || '');
        setEmail(currentUser.email || '');
        setPhotoURL(currentUser.photoURL || '');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (user) {
      try {
        let imageURL = photoURL;

        if (selectedImage) {
          const formData = new FormData();
          formData.append("image", selectedImage);

          const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.REACT_APP_IMGBB_API_KEY}`, {
            method: "POST",
            body: formData,
          });

          const data = await response.json();
          imageURL = data.data.url;
        }

        await updateProfile(user, {
          displayName: name,
          photoURL: imageURL,
        });

        setPhotoURL(imageURL);
        alert("Profile updated successfully");
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("Error updating profile");
      }
    }
  };



  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <Container>
      {user ? (
        <>
          <Header>
            <Title>Profile Details</Title>
            <Subtitle>Manage your public profile and private information</Subtitle>
          </Header>

          <MainGrid>
            <ProfileSection>
              <ImageWrapper onClick={triggerFileInput}>
                <ProfileImagePreview
                  src={selectedImage ? URL.createObjectURL(selectedImage) : photoURL || 'https://via.placeholder.com/150'}
                  alt="Profile"
                />
                <Overlay>
                  <FaCamera />
                  <span>Change Photo</span>
                </Overlay>
              </ImageWrapper>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files[0])}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <ChangeInfo>Click image to upload new photo</ChangeInfo>
            </ProfileSection>

            <FormSection onSubmit={handleSave}>
              <FormGroup>
                <Label>Display Name</Label>
                <InputWrapper>
                  <IconWrapper><FaUser /></IconWrapper>
                  <StyledInput
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </InputWrapper>
              </FormGroup>

              <FormGroup>
                <Label>Email Address</Label>
                <InputWrapper className="disabled">
                  <IconWrapper><FaEnvelope /></IconWrapper>
                  <StyledInput type="email" value={email} readOnly />
                </InputWrapper>
                <HelperText>Email cannot be changed directly for security reasons.</HelperText>
              </FormGroup>

              <SaveButton type="submit">Save Changes</SaveButton>
            </FormSection>
          </MainGrid>

        </>
      ) : (
        <Message>You need to be logged in to view and update your account settings.</Message>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 2rem;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2.5rem;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  color: var(--secondary-color);
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: var(--text-muted);
  font-size: 1rem;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  border: 4px solid white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    
    div {
      opacity: 1;
    }
  }
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  svg {
    font-size: 1.5rem;
    margin-bottom: 5px;
  }
  
  span {
    font-size: 0.8rem;
    font-weight: 500;
  }
`;

const ProfileImagePreview = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ChangeInfo = styled.p`
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
`;

const FormSection = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: var(--secondary-color);
  font-size: 0.95rem;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  &.disabled {
    opacity: 0.7;
    background: #f8f9fa;
    border-radius: 8px;
  }
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  color: var(--text-color);
  background: transparent;

  &:focus {
    border-color: var(--secondary-color);
    box-shadow: 0 0 0 3px rgba(2, 74, 71, 0.1);
    outline: none;
  }
`;

const HelperText = styled.span`
  font-size: 0.85rem;
  color: var(--text-muted);
`;

const SaveButton = styled.button`
  margin-top: 1rem;
  padding: 12px 24px;
  background-color: var(--secondary-color);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;

  &:hover {
    background-color: var(--secondary-color-dark);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(2, 74, 71, 0.2);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;



const Message = styled.p`
  font-size: 1.1rem;
  color: var(--text-muted);
  text-align: center;
  padding: 2rem;
`;



export default MyAccount;

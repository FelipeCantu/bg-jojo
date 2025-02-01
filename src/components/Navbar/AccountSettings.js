import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseconfig';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import styled from 'styled-components';

const AccountSettings = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

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
        await updateProfile(user, {
          displayName: name,
          photoURL: selectedImage || photoURL, // Use selected image if uploaded
        });
        alert('Profile updated successfully');
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  return (
    <ContainerWrapper>
      <Container>
        <Title>Account Settings</Title>
        {user ? (
          <Form onSubmit={handleSave}>
            <Field>
              <Label>Profile Picture</Label>
              <ProfileImagePreview src={selectedImage || photoURL || 'https://via.placeholder.com/150'} alt="Profile" />
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(URL.createObjectURL(e.target.files[0]))}
              />
            </Field>
            <Field>
              <Label>Name</Label>
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
            </Field>
            <Field>
              <Label>Email</Label>
              <Input type="email" value={email} readOnly />
            </Field>
            <SaveButton type="submit">Save Changes</SaveButton>
          </Form>
        ) : (
          <p>You need to be logged in to view and update your account settings.</p>
        )}
      </Container>
    </ContainerWrapper>
  );
};

// Styled Components
const ContainerWrapper = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url(https://i.pinimg.com/736x/ac/62/36/ac623639e4368a63a9442e558cdadc06.jpg) no-repeat bottom center/cover;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6); /* Dark overlay */
  }
`;

const Container = styled.div`
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
`;

const Title = styled.h2`
  font-size: 2rem;
  margin-bottom: 20px;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 1rem;
  margin-bottom: 8px;
  color: #555;
`;

const Input = styled.input`
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
  background-color: #fff;
`;

const ProfileImagePreview = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
`;

const SaveButton = styled.button`
  padding: 12px;
  background-color: #007bff;
  color: white;
  font-size: 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

export default AccountSettings;

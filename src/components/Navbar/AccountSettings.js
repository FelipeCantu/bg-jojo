import React, { useState, useEffect } from 'react';
import { auth, updateUserProfile } from '../../firebaseconfig'; // Import firebase functions
import { onAuthStateChanged } from 'firebase/auth';
import styled from 'styled-components';

const AccountSettings = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  // Fetch user data when the component mounts
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
      await updateUserProfile(user, { displayName: name, photoURL });
      alert('Profile updated successfully');
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
              <ProfileImagePreview src={photoURL || 'https://via.placeholder.com/150'} alt="Profile" />
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoURL(URL.createObjectURL(e.target.files[0]))}
              />
            </Field>
            <Field>
              <Label>Name</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
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

const ContainerWrapper = styled.div`
   position: relative;
   min-height: 100vh;
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: flex-start;
   overflow: hidden;
`

// Styled Components for AccountSettings
const Container = styled.div`
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
  margin-bottom: 10px;
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

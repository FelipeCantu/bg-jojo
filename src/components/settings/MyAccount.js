import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseconfig';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import styled from 'styled-components';

const MyAccount = () => {
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
    <Container>
      {user ? (
        <Form onSubmit={handleSave}>
          <Field>
            <Label>Profile Picture</Label>
            <ProfileImagePreview
              src={selectedImage || photoURL || 'https://via.placeholder.com/150'}
              alt="Profile"
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedImage(URL.createObjectURL(e.target.files[0]))}
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
  );
};

const Container = styled.div`
  padding: 2rem;
  width: 95%;
  max-width: 1400px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 1rem; /* Reduce padding for smaller screens */
    width: 90%;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  width: 90%;
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
  width: 100%; /* Make input fields responsive */

  @media (max-width: 768px) {
    padding: 0.6rem; /* Slightly reduce padding on smaller screens */
  }
`;

const ProfileImagePreview = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    width: 120px;
    height: 120px; /* Resize profile image on smaller screens */
  }
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

  @media (max-width: 768px) {
    font-size: 0.9rem; /* Smaller button font size on mobile */
    padding: 10px; /* Adjust button padding for mobile */
  }
`;

export default MyAccount;

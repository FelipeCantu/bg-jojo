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
        let imageURL = photoURL; // Keep existing profile picture
        
        if (selectedImage) {
          // Upload to an external image hosting service (e.g., Cloudinary, Imgur)
          const formData = new FormData();
          formData.append("image", selectedImage);
          
          const response = await fetch("https://api.imgbb.com/1/upload?key=6e5b0f17c571cd2f53589d0b3c8c869f", {
            method: "POST",
            body: formData,
          });
          
          const data = await response.json();
          imageURL = data.data.url; // Get uploaded image URL
        }
        
        await updateProfile(user, {
          displayName: name,
          photoURL: imageURL,
        });
        
        setPhotoURL(imageURL); // Update UI with new photo URL
        alert("Profile updated successfully");
      } catch (error) {
        console.error("Error updating profile:", error);
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
              src={selectedImage ? URL.createObjectURL(selectedImage) : photoURL || 'https://via.placeholder.com/150'}
              alt="Profile"
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedImage(e.target.files[0])}
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
        <Message>You need to be logged in to view and update your account settings.</Message>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 2rem;
  width: 90%;
  max-width: 1200px;
  min-height: 100vh;
  margin: 0 auto;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
  overflow: hidden;
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    padding: 1rem;
    max-width: 100%;
    max-height: 100vh;
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
  align-items: flex-start;
  width: 100%;
`;

const Label = styled.label`
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
`;

const Input = styled.input`
  padding: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #fff;
  width: 100%;
  box-sizing: border-box;
  transition: border 0.3s ease;
  
  &:focus {
    border-color: #024a47;
    outline: none;
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`;

const ProfileImagePreview = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
  border: 4px solid #024a47;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    width: 120px;
    height: 120px;
  }
`;

const SaveButton = styled.button`
  padding: 12px;
  background-color: #024a47;
  color: white;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  margin-bottom: 10px;
  &:hover {
    background-color: #013d3b;
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;
    padding: 10px;
    
  }
`;

const Message = styled.p`
  font-size: 1.1rem;
  color: #333;
  text-align: center;
  font-weight: 600;
`;

export default MyAccount;

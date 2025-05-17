import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseconfig';
import { onAuthStateChanged, updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import styled from 'styled-components';

const MyAccount = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
          
          const response = await fetch("https://api.imgbb.com/1/upload?key=6e5b0f17c571cd2f53589d0b3c8c869f", {
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

  const handleDeleteAccount = async () => {
    if (!password) {
      alert("Please enter your password");
      return;
    }

    setIsDeleting(true);
    
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Delete user account
      await deleteUser(user);
      
      alert("Account deleted successfully");
      window.location.href = '/'; // Redirect to home page
    } catch (error) {
      console.error("Error deleting account:", error);
      setIsDeleting(false);
      
      if (error.code === 'auth/wrong-password') {
        alert("Incorrect password");
      } else if (error.code === 'auth/requires-recent-login') {
        alert("Session expired. Please log in again.");
      } else {
        alert("Error deleting account: " + error.message);
      }
    }
  };

  return (
    <Container>
      {user ? (
        <>
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

          <DeleteAccountButton onClick={() => setShowDeleteModal(true)}>
            Delete My Account
          </DeleteAccountButton>

          {showDeleteModal && (
            <ModalOverlay>
              <DeleteModal>
                <h3>Delete Account Permanently?</h3>
                <WarningText>
                  This will remove ALL your data including:
                  <ul>
                    <li>Profile information</li>
                    <li>Account credentials</li>
                    <li>All stored user data</li>
                  </ul>
                  This action cannot be undone.
                </WarningText>
                
                <PasswordInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                />
                
                <ModalButtons>
                  <CancelButton 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setPassword('');
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </CancelButton>
                  <ConfirmDeleteButton 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || !password}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                  </ConfirmDeleteButton>
                </ModalButtons>
              </DeleteModal>
            </ModalOverlay>
          )}
        </>
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
    max-height: 100%;
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

const DeleteAccountButton = styled.button`
  padding: 12px;
  background-color: transparent;
  color: #e74c3c;
  border: 1px solid #e74c3c;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  margin-top: 20px;
  
  &:hover {
    background-color: #f8d7da;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const DeleteModal = styled.div`
  background-color: white;
  padding: 25px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  text-align: center;
`;

const WarningText = styled.div`
  color: #d32f2f;
  background-color: #ffebee;
  padding: 15px;
  border-radius: 5px;
  margin: 15px 0;
  text-align: left;
  
  ul {
    margin: 10px 0 0 20px;
  }
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: 1px solid #d32f2f;
  border-radius: 5px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #b71c1c;
  }
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background-color: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

const ConfirmDeleteButton = styled.button`
  padding: 10px 20px;
  background-color: ${props => props.disabled ? '#cccccc' : '#d32f2f'};
  color: white;
  border: none;
  border-radius: 5px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.3s;

  &:hover:not(:disabled) {
    background-color: #b71c1c;
  }
`;

export default MyAccount;

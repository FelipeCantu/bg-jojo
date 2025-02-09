import React, { useState, useEffect } from "react";
import styled from "styled-components";

import { db, doc, getDoc, updateDoc } from "../../firestore";
import { useAuth } from "../../AuthContext"; // Assuming you have auth context for user

const MyAddresses = () => {
  const { currentUser } = useAuth(); // Get logged-in user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({ street: "", city: "", zip: "", isDefault: false });

  useEffect(() => {
    if (currentUser) {
      loadAddresses();
    }
  }, [currentUser]);

  const loadAddresses = async () => {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        setAddresses(docSnap.data().addresses || []);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    }
  };

  const saveToFirestore = async (updatedAddresses) => {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { addresses: updatedAddresses });
      setAddresses(updatedAddresses);
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let updatedAddresses;

    if (isEditing) {
      updatedAddresses = [...addresses];
      updatedAddresses[editingIndex] = form;
    } else {
      updatedAddresses = [...addresses, form];
    }

    await saveToFirestore(updatedAddresses);

    setForm({ street: "", city: "", zip: "", isDefault: false });
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = async (index) => {
    const updatedAddresses = addresses.filter((_, i) => i !== index);
    await saveToFirestore(updatedAddresses);
  };

  const handleEdit = (index) => {
    setForm(addresses[index]);
    setIsEditing(true);
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleSetDefault = async (index) => {
    const updatedAddresses = addresses.map((address, i) => ({
      ...address,
      isDefault: i === index, // Only the selected one becomes default
    }));
    await saveToFirestore(updatedAddresses);
  };

  return (
    <Container>
      <Title>My Addresses</Title>
      <Description>Add and manage the addresses you use often.</Description>
      {addresses.length === 0 ? (
        <Message>You haven't saved any addresses yet.</Message>
      ) : (
        <AddressList>
          {addresses.map((address, index) => (
            <AddressItem key={index} isDefault={address.isDefault}>
              <AddressText>{address.street}</AddressText>
              <AddressText>{address.city}, {address.zip}</AddressText>
              {address.isDefault && <DefaultLabel>Default</DefaultLabel>}
              <Actions>
                <EditButton onClick={() => handleEdit(index)}>Edit</EditButton>
                <DeleteButton onClick={() => handleDelete(index)}>Delete</DeleteButton>
                {!address.isDefault && (
                  <SetDefaultButton onClick={() => handleSetDefault(index)}>Set as Default</SetDefaultButton>
                )}
              </Actions>
            </AddressItem>
          ))}
        </AddressList>
      )}
      <AddButton onClick={() => setIsModalOpen(true)}>Add New Address</AddButton>

      {isModalOpen && (
        <Modal>
          <ModalContent>
            <h3>{isEditing ? "Edit Address" : "Add a New Address"}</h3>
            <Form onSubmit={handleSubmit}>
              <Label>Street Address</Label>
              <Input
                type="text"
                name="street"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                required
              />
              <Label>City</Label>
              <Input
                type="text"
                name="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
              <Label>Zip Code</Label>
              <Input
                type="text"
                name="zip"
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                required
              />
              <ModalActions>
                <CancelButton type="button" onClick={() => setIsModalOpen(false)}>Cancel</CancelButton>
                <SaveButton type="submit">{isEditing ? "Save Changes" : "Save Address"}</SaveButton>
              </ModalActions>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

const Container = styled.div`
  max-width: 90%;
  margin: 30px auto;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  text-align: center;
  font-family: 'Roboto', sans-serif;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  color: #333;
  font-weight: bold;
  margin-bottom: 10px;
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 20px;
`;

const Message = styled.p`
  font-size: 1rem;
  color: #888;
  margin-bottom: 20px;
`;

const AddButton = styled.button`
  background-color: #024a47;
  color: white;
  padding: 12px 18px;
  border: none;
  // border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #013d3b;
    transform: scale(1.05);
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3;
`;

const ModalContent = styled.div`
  background-color: #fff;
  padding: 30px;
  border-radius: 12px;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Label = styled.label`
  font-size: 1rem;
  color: #333;
  margin-bottom: 6px;
`;

const Input = styled.input`
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #0288d1;
    outline: none;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-between;
`;

const CancelButton = styled.button`
  background-color: #b0bec5;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #90a4ae;
  }
`;

const SaveButton = styled.button`
  background-color: #0288d1;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0277bd;
  }
`;

const AddressList = styled.div`
  margin-top: 30px;
`;

const AddressItem = styled.div`
  background-color: ${(props) => (props.isDefault ? "#e8f5e9" : "#f5f5f5")};
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
`;

const AddressText = styled.p`
  color: #333;
  margin: 0;
  font-size: 1rem;
`;

const DefaultLabel = styled.span`
  color: #388e3c;

  padding: 4px 10px;

  font-size: 0.9rem;
  font-weight: bold;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
`;

const EditButton = styled.button`
  color: #0288d1;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
  color: #0277bd;
  }
`;

const DeleteButton = styled.button`
  color: #d32f2f;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    color: #c62828;
  }
`;

const SetDefaultButton = styled.button`
  background-color: #388e3c;
  color: white;
  padding: 8px 16px;
  border: none;
  // border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    background-color: #2e7d32;
  }
`;

export default MyAddresses;

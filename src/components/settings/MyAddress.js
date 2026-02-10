import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";

import { db, doc, getDoc, updateDoc } from "../../firestore";
import { useAuth } from "../../context/AuthContext";
const MyAddresses = () => {
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({ street: "", city: "", zip: "", isDefault: false });

  const loadAddresses = useCallback(async () => {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        setAddresses(docSnap.data().addresses || []);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadAddresses();
    }
  }, [currentUser, loadAddresses]);

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
    if (window.confirm("Are you sure you want to delete this address?")) {
      const updatedAddresses = addresses.filter((_, i) => i !== index);
      await saveToFirestore(updatedAddresses);
    }
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
      isDefault: i === index,
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
              <AddressContent>
                <AddressText>{address.street}</AddressText>
                <AddressText>{address.city}, {address.zip}</AddressText>
                {address.isDefault && <DefaultLabel>Default</DefaultLabel>}
              </AddressContent>
              <Actions>
                <ActionButton onClick={() => handleEdit(index)}>
                  <ActionIcon>✏️</ActionIcon>
                  <ActionText>Edit</ActionText>
                </ActionButton>
                <ActionButton onClick={() => handleDelete(index)}>
                  <ActionIcon>🗑️</ActionIcon>
                  <ActionText>Delete</ActionText>
                </ActionButton>
                {!address.isDefault && (
                  <DefaultButton onClick={() => handleSetDefault(index)}>
                    <ActionIcon>⭐</ActionIcon>
                    <ActionText>Set Default</ActionText>
                  </DefaultButton>
                )}
              </Actions>
            </AddressItem>
          ))}
        </AddressList>
      )}

      <AddButton onClick={() => setIsModalOpen(true)}>+ Add New Address</AddButton>

      {isModalOpen && (
        <Modal onClick={() => setIsModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>{isEditing ? "Edit Address" : "Add a New Address"}</h3>
              <CloseButton onClick={() => setIsModalOpen(false)}>×</CloseButton>
            </ModalHeader>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Street Address</Label>
                <Input
                  type="text"
                  name="street"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  required
                  placeholder="123 Main St"
                />
              </FormGroup>

              <FormRow>
                <FormGroup style={{ flex: 2 }}>
                  <Label>City</Label>
                  <Input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                    placeholder="New York"
                  />
                </FormGroup>

                <FormGroup style={{ flex: 1 }}>
                  <Label>Zip Code</Label>
                  <Input
                    type="text"
                    name="zip"
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                    required
                    placeholder="10001"
                  />
                </FormGroup>
              </FormRow>

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

// Styled Components with orange color scheme
const Container = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0 0 20px;
  padding: 15px;
  border-radius: 8px;
  min-height: 100vh;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  background-color: #fff;
  font-family: 'Roboto', sans-serif;

  @media (min-width: 768px) {
    max-width: 90%;
    padding: 20px;
    margin: 0 auto 30px; 
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  color: #333;
  font-weight: bold;
  margin-bottom: 8px;

  @media (min-width: 768px) {
    font-size: 1.75rem;
    margin-bottom: 10px;
  }
`;

const Description = styled.p`
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 20px;

  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
`;

const Message = styled.p`
  font-size: 0.95rem;
  color: #888;
  margin-bottom: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
`;

const AddButton = styled.button`
  background-color: var(--secondary-color); 
  color: white;
  padding: 12px 18px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  &:hover {
    background-color: var(--secondary-color-dark); 
  }

  @media (min-width: 768px) {
    width: auto;
    padding: 12px 24px;
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
  z-index: 1000;
  padding: 15px;
  box-sizing: border-box;
`;

const ModalContent = styled.div`
  background-color: #fff;
  padding: 20px;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    font-size: 1.3rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 15px;
  flex-direction: column;

  @media (min-width: 480px) {
    flex-direction: row;
  }
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
  transition: border-color 0.2s ease;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const CancelButton = styled.button`
  background-color: #f0f0f0;
  color: #333;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const SaveButton = styled.button`
  background-color: var(--secondary-color); 
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: var(--secondary-color-dark); 
  }
`;

const AddressList = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AddressItem = styled.div`
  background-color: ${(props) => (props.isDefault ? "#fff4e5" : "#f9f9f9")};
  padding: 15px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid ${(props) => (props.isDefault ? "#ffe0b2" : "#eee")};
`;

const AddressContent = styled.div`
  flex: 1;
`;

const AddressText = styled.p`
  color: #333;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;

  &:first-child {
    font-weight: 500;
  }
`;

const DefaultLabel = styled.span`
  display: inline-block;
  background-color: var(--primary-color);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-top: 8px;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
`;

const ActionButton = styled.button`
  background-color: #f5f5f5;
  color: #333;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const DefaultButton = styled(ActionButton)`
  background-color: #fff4e5;
  color: #e69500;

  &:hover {
    background-color: #ffe0b2;
  }
`;

const ActionIcon = styled.span`
  font-size: 0.9rem;
`;

const ActionText = styled.span`
  @media (max-width: 480px) {
    display: none;
  }
`;

export default MyAddresses;
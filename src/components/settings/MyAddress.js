import React from "react";
import styled from "styled-components";

const MyAddresses = () => {
  return (
    <Container>
      <Title>My Addresses</Title>
      <Description>Add and manage the addresses you use often.</Description>
      <Message>You haven't saved any addresses yet.</Message>
      <AddButton>Add New Address</AddButton>
    </Container>
  );
};

const Container = styled.div`
  max-width: 95%;
  margin: auto;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #333;
`;

const Description = styled.p`
  font-size: 1rem;
  color: #666;
  margin-bottom: 20px;
`;

const Message = styled.p`
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 20px;
`;

const AddButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
  
  &:hover {
    background-color: #0056b3;
  }
`;


export default MyAddresses;

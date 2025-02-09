import React, { useState } from "react";
import styled from "styled-components";

const Wallet = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [defaultCardId, setDefaultCardId] = useState(null);
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const handleSave = () => {
    if (cardholderName && cardNumber && expiry && cvv) {
      const newMethod = {
        id: Date.now(),
        cardholderName,
        cardNumber: `**** **** **** ${cardNumber.slice(-4)}`,
        expiry,
      };

      setPaymentMethods([...paymentMethods, newMethod]);

      if (paymentMethods.length === 0) {
        setDefaultCardId(newMethod.id); // Set the first card as default
      }

      // Clear form & close modal
      setCardholderName("");
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setIsModalOpen(false);
    }
  };

  const handleDelete = (id) => {
    setPaymentMethods(paymentMethods.filter((method) => method.id !== id));

    // If deleting default card, reset default
    if (defaultCardId === id) {
      setDefaultCardId(paymentMethods.length > 1 ? paymentMethods[1].id : null);
    }
  };

  const handleSetDefault = (id) => {
    setDefaultCardId(id);
  };

  return (
    <WalletContainer>
      <Title>Wallet</Title>
      <Description>Save your payment details for faster checkout.</Description>
      <AddButton onClick={() => setIsModalOpen(true)}>+ Add Payment Method</AddButton>

      {paymentMethods.length > 0 && (
        <SavedMethods>
          {paymentMethods.map((method, index) => (
            <div key={method.id}>
              {index !== 0 && <Divider />}
              <CardInfo>
                <div>
                  <CardHolder>
                    {method.cardholderName} {method.id === defaultCardId && <DefaultTag>Default</DefaultTag>}
                  </CardHolder>
                  <CardNumber>{method.cardNumber}</CardNumber>
                  <Expiry>Expires: {method.expiry}</Expiry>
                </div>
                <ButtonContainer>
                  <SetDefaultButton onClick={() => handleSetDefault(method.id)} disabled={method.id === defaultCardId}>
                    Set as Default
                  </SetDefaultButton>
                  <DeleteButton onClick={() => handleDelete(method.id)}>Delete</DeleteButton>
                </ButtonContainer>
              </CardInfo>
            </div>
          ))}
        </SavedMethods>
      )}

      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Add Payment Method</ModalTitle>
            <Form>
              <Input
                type="text"
                placeholder="Cardholder Name"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
              <Row>
                <Input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="CVV"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                />
              </Row>
              <ButtonContainer>
                <SaveButton onClick={handleSave}>Save</SaveButton>
                <CancelButton onClick={() => setIsModalOpen(false)}>Cancel</CancelButton>
              </ButtonContainer>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}
    </WalletContainer>
  );
};

// Styles
const WalletContainer = styled.div`
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

const AddButton = styled.button`
  background-color: #024a47;
  color: white;
  padding: 10px 15px;
  border: none;
  // border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background-color: #013d3b;
  }
`;

// Saved Payment Methods
const SavedMethods = styled.div`
  margin-top: 20px;
  text-align: left;
  padding: 10px;
`;

const Divider = styled.hr`
  border: none;
  height: 1px;
  background-color: #ddd;
  margin: 10px 0;
`;

const CardInfo = styled.div`
  background: #f9f9f9;
  padding: 10px;
  border-radius: 5px;
`;

const CardHolder = styled.p`
  font-weight: bold;
  margin-bottom: 5px;
`;

const CardNumber = styled.p`
  font-size: 1rem;
  color: #555;
`;

const Expiry = styled.p`
  font-size: 0.9rem;
  color: #777;
`;

// Modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background: white;
  padding: 25px;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ModalTitle = styled.h3`
  margin-bottom: 15px;
  color: #333;
`;

const Form = styled.div`
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
  box-sizing: border-box;
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 15px;
`;

const SaveButton = styled.button`
  background-color: #024a47;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  flex: 1;
  margin-right: 5px;

  &:hover {
    background-color: #013d3b;
  }
`;

const CancelButton = styled.button`
  background-color: #ccc;
  color: black;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  flex: 1;

  &:hover {
    background-color: #aaa;
  }
`;

const DefaultTag = styled.span`
  background-color: #024a47;
  color: white;
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 8px;
`;

const SetDefaultButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  font-size: 0.9rem;
  cursor: pointer;

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }
`;

const DeleteButton = styled.button`
  background-color: #ff4d4d;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    background-color: #cc0000;
  }
`;


export default Wallet;

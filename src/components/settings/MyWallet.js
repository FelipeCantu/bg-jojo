import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { db, collection, doc, addDoc, getDocs, deleteDoc } from "../../firestore";
import { useAuth } from "../../AuthContext"; // Import useAuth

const Wallet = () => {
  const { currentUser, loading } = useAuth(); // Use useAuth to get current user and loading state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [defaultCardId, setDefaultCardId] = useState(null);
  const [form, setForm] = useState({ cardholderName: "", cardNumber: "", expiry: "", cvv: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!currentUser || loading) return;

    const fetchPaymentMethods = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const paymentMethodsRef = collection(userRef, "paymentMethods");
        const querySnapshot = await getDocs(paymentMethodsRef);
        const methods = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPaymentMethods(methods);
      } catch (error) {
        console.error("Error fetching payment methods: ", error);
      }
    };

    fetchPaymentMethods();
  }, [currentUser, loading]);

  if (loading) {
    return <div>Loading user data...</div>;
  }

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!form.cardholderName || !/^[a-zA-Z\s]+$/.test(form.cardholderName)) {
      newErrors.cardholderName = "Cardholder Name is required and must contain only letters and spaces.";
      isValid = false;
    }

    if (!form.cardNumber || !/^\d{16}$/.test(form.cardNumber)) {
      newErrors.cardNumber = "Card Number must be 16 digits.";
      isValid = false;
    }

    if (!form.expiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry)) {
      newErrors.expiry = "Expiry must be in MM/YY format.";
      isValid = false;
    }

    if (!form.cvv || !/^\d{3}$/.test(form.cvv)) {
      newErrors.cvv = "CVV must be 3 digits.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!currentUser) {
      console.error("No user is logged in.");
      return;
    }
  
    if (validateForm()) {
      const newMethod = {
        cardholderName: form.cardholderName,
        cardNumber: `**** **** **** ${form.cardNumber.slice(-4)}`,
        expiry: form.expiry,
      };
  
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const paymentMethodsRef = collection(userRef, "paymentMethods");
        const docRef = await addDoc(paymentMethodsRef, newMethod);
  
        // Fetch updated list to ensure the new card is included
        const querySnapshot = await getDocs(paymentMethodsRef);
        const updatedMethods = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPaymentMethods(updatedMethods);
  
        if (updatedMethods.length === 1) {
          setDefaultCardId(docRef.id);
        }
  
        setForm({ cardholderName: "", cardNumber: "", expiry: "", cvv: "" });
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    }
  };
  

  const handleDelete = async (id) => {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const paymentMethodsRef = doc(userRef, "paymentMethods", id);
      await deleteDoc(paymentMethodsRef);
      setPaymentMethods(paymentMethods.filter((method) => method.id !== id));

      if (defaultCardId === id) {
        setDefaultCardId(paymentMethods.length > 1 ? paymentMethods[1].id : null);
      }
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleSetDefault = (id) => {
    setDefaultCardId(id);
  };

  if (!currentUser) {
    return <div>Please log in to manage your payment methods.</div>;
  }

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
                value={form.cardholderName}
                onChange={(e) => setForm({ ...form, cardholderName: e.target.value })}
              />
              {errors.cardholderName && <Error>{errors.cardholderName}</Error>}

              <Input
                type="text"
                placeholder="Card Number"
                value={form.cardNumber}
                onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
              />
              {errors.cardNumber && <Error>{errors.cardNumber}</Error>}

              <Row>
                <Input
                  type="text"
                  placeholder="MM/YY"
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                />
                {errors.expiry && <Error>{errors.expiry}</Error>}
                <Input
                  type="text"
                  placeholder="CVV"
                  value={form.cvv}
                  onChange={(e) => setForm({ ...form, cvv: e.target.value })}
                />
                {errors.cvv && <Error>{errors.cvv}</Error>}
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

// Styles (unchanged)
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
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background-color: #013d3b;
  }
`;

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
  z-index: 3;
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
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
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
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    background-color: #013d3b;
  }
`;

const CancelButton = styled.button`
  background-color: #ccc;
  color: #333;
  padding: 10px 15px;
  border: none;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    background-color: #bbb;
  }
`;

const DefaultTag = styled.span`
  font-size: 0.8rem;
  color: green;
  font-weight: bold;
  margin-left: 10px;
`;

const DeleteButton = styled.button`
  background-color: red;
  color: white;
  padding: 5px 10px;
  border: none;
  font-size: 0.8rem;
  cursor: pointer;

  &:hover {
    background-color: darkred;
  }
`;

const SetDefaultButton = styled.button`
  background-color: #024a47;
  color: white;
  padding: 5px 10px;
  border: none;
  font-size: 0.8rem;
  cursor: pointer;
  margin-right: 10px;

  &:hover {
    background-color: #013d3b;
  }

  &:disabled {
    background-color: #ddd;
    cursor: not-allowed;
  }
`;

const Error = styled.p`
  color: red;
  font-size: 0.9rem;
  margin-top: -5px;
`;

export default Wallet;

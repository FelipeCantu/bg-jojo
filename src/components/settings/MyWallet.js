import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import InputMask from "react-input-mask";
import { db, collection, doc, addDoc, getDocs, deleteDoc } from "../../firestore";
import { useAuth } from "../../AuthContext";
import toast from "react-hot-toast";
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import Cards from 'react-credit-cards-2';

const Wallet = () => {
  const { currentUser, loading } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [defaultCardId, setDefaultCardId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [focused, setFocused] = useState("");
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm();

  useEffect(() => {
    if (!currentUser || loading) return;

    const fetchPaymentMethods = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const paymentMethodsRef = collection(userRef, "paymentMethods");
        const querySnapshot = await getDocs(paymentMethodsRef);
        const methods = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          isDefault: doc.id === defaultCardId
        }));
        setPaymentMethods(methods);
      } catch (error) {
        toast.error("Error loading payment methods");
        console.error("Error fetching payment methods: ", error);
      }
    };

    fetchPaymentMethods();
  }, [currentUser, loading, defaultCardId]);

  const onSubmit = async (data) => {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const paymentMethodsRef = collection(userRef, "paymentMethods");
      
      const newMethod = {
        cardholderName: data.cardholderName,
        cardNumber: data.cardNumber.replace(/\s/g, ''),
        expiry: data.expiry,
        cvc: data.cvc,
        isDefault: paymentMethods.length === 0
      };

      const docRef = await addDoc(paymentMethodsRef, newMethod);

      if (paymentMethods.length === 0) {
        setDefaultCardId(docRef.id);
      }

      toast.success("Payment method added successfully!");
      setIsModalOpen(false);
      reset();
    } catch (error) {
      toast.error("Failed to add payment method");
      console.error("Error adding document: ", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this payment method?")) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        await deleteDoc(doc(userRef, "paymentMethods", id));
        setPaymentMethods(paymentMethods.filter(method => method.id !== id));
        toast.success("Payment method deleted");
        
        if (defaultCardId === id) {
          setDefaultCardId(paymentMethods.length > 1 ? paymentMethods[1].id : null);
        }
      } catch (error) {
        toast.error("Failed to delete payment method");
        console.error("Error deleting document: ", error);
      }
    }
  };

  const handleSetDefault = (id) => {
    setDefaultCardId(id);
    toast.success("Default payment method updated");
  };

  if (loading) {
    return <Loading>Loading payment methods...</Loading>;
  }

  if (!currentUser) {
    return <Message>Please log in to manage your payment methods.</Message>;
  }

  return (
    <WalletContainer>
      <Title>Wallet</Title>
      <Description>Manage your saved payment methods</Description>
      
      {paymentMethods.length > 0 ? (
        <CardsList>
          {paymentMethods.map((method) => (
            <CardItem key={method.id} isDefault={method.id === defaultCardId}>
              <CardPreview>
                <Cards
                  number={`•••• •••• •••• ${method.cardNumber.slice(-4)}`}
                  name={method.cardholderName}
                  expiry={method.expiry}
                  cvc="•••"
                  focused={focused}
                />
              </CardPreview>
              
              <CardDetails>
                <CardHolder>
                  {method.cardholderName}
                  {method.id === defaultCardId && <DefaultBadge>Default</DefaultBadge>}
                </CardHolder>
                <CardNumber>•••• •••• •••• {method.cardNumber.slice(-4)}</CardNumber>
                <Expiry>Expires: {method.expiry}</Expiry>
                
                <CardActions>
                  {method.id !== defaultCardId && (
                    <SetDefaultButton onClick={() => handleSetDefault(method.id)}>
                      <StarIcon /> Set as Default
                    </SetDefaultButton>
                  )}
                  <DeleteButton onClick={() => handleDelete(method.id)}>
                      <DeleteIcon /> Delete
                  </DeleteButton>
                </CardActions>
              </CardDetails>
            </CardItem>
          ))}
        </CardsList>
      ) : (
        <EmptyState>No payment methods saved yet</EmptyState>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent>
          <ModalTitle>Add New Payment Method</ModalTitle>
          
          <Form onSubmit={handleSubmit(onSubmit)}>
            <CardPreviewContainer>
              <Cards
                number={watch("cardNumber", "").replace(/\s/g, '') || "•••• •••• •••• ••••"}
                name={watch("cardholderName", "") || "FULL NAME"}
                expiry={watch("expiry", "") || "••/••"}
                cvc={watch("cvc", "") || "•••"}
                focused={focused}
              />
            </CardPreviewContainer>

            <FormGroup>
              <Label>Cardholder Name</Label>
              <Input
                {...register("cardholderName", { required: "Cardholder name is required" })}
                onFocus={() => setFocused("name")}
                placeholder="John Doe"
              />
              {errors.cardholderName && <Error>{errors.cardholderName.message}</Error>}
            </FormGroup>

            <FormGroup>
              <Label>Card Number</Label>
              <InputMask 
                mask="9999 9999 9999 9999"
                {...register("cardNumber", { 
                  required: "Card number is required",
                  validate: value => value.replace(/\s/g, '').length === 16 || "Invalid card number"
                })}
                onFocus={() => setFocused("number")}
              >
                {(inputProps) => <Input {...inputProps} placeholder="1234 5678 9012 3456" />}
              </InputMask>
              {errors.cardNumber && <Error>{errors.cardNumber.message}</Error>}
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>Expiry Date</Label>
                <InputMask
                  mask="99/99"
                  {...register("expiry", {
                    required: "Expiry date is required",
                    pattern: {
                      value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                      message: "Invalid expiry date (MM/YY)"
                    }
                  })}
                  onFocus={() => setFocused("expiry")}
                >
                  {(inputProps) => <Input {...inputProps} placeholder="MM/YY" />}
                </InputMask>
                {errors.expiry && <Error>{errors.expiry.message}</Error>}
              </FormGroup>

              <FormGroup>
                <Label>CVV</Label>
                <Input
                  type="text"
                  {...register("cvc", {
                    required: "CVV is required",
                    minLength: { value: 3, message: "CVV must be 3 digits" },
                    maxLength: { value: 4, message: "CVV must be 3-4 digits" }
                  })}
                  onFocus={() => setFocused("cvc")}
                  placeholder="123"
                />
                {errors.cvc && <Error>{errors.cvc.message}</Error>}
              </FormGroup>
            </FormRow>

            <ButtonGroup>
              <CancelButton type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </CancelButton>
              <SaveButton type="submit">
                Save Card
              </SaveButton>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>

      <AddButton onClick={() => setIsModalOpen(true)}>
        <PlusIcon /> Add Payment Method
      </AddButton>
    </WalletContainer>
  );
};

// Styled Components
const WalletContainer = styled.div`
  max-width: 95%;
  margin: 0 auto;
  padding: 2rem;
  // min-height: 100vh;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const Title = styled.h2`
  font-size: 1.75rem;
  color: #333;
  margin: 0 0 0.5rem 0;
  padding: 0;
`;

const Description = styled.p`
  color: #666;
  margin: 0 0 2rem 0;
  padding: 0;
`;

const CardsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
`;

const CardItem = styled.div`
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: ${(props) => (props.isDefault ? "#fff4e5" : "#f9f9f9")};
  border-radius: 10px;
  border: 1px solid ${(props) => (props.isDefault ? "#ffe0b2" : "#eee")};
  transition: all 0.2s;
  margin: 0;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const CardPreview = styled.div`
  width: 300px;
  margin: 0;
  
  @media (max-width: 600px) {
    width: 100%;
  }
`;

const CardDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
`;

const CardHolder = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardNumber = styled.p`
  color: #555;
  margin: 0 0 0.5rem 0;
`;

const Expiry = styled.p`
  color: #777;
  font-size: 0.9rem;
  margin: 0;
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const SetDefaultButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: transparent;
  color: #024a47;
  border: 1px solid #024a47;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0;

  &:hover {
    background: #f0f9f8;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: transparent;
  color: #d32f2f;
  border: 1px solid #d32f2f;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0;

  &:hover {
    background: #fde8e8;
  }
`;

const DefaultBadge = styled.span`
  background: #fea500;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #024a47;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;

  &:hover {
    background: #013d3b;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #888;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 0;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h3`
  font-size: 1.5rem;
  margin: 0 0 1.5rem 0;
  color: #333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 0;
`;

const CardPreviewContainer = styled.div`
  margin: -1rem -1rem 1rem -1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    border-color: #024a47;
    outline: none;
    box-shadow: 0 0 0 2px rgba(2, 74, 71, 0.2);
  }
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;

  & > * {
    flex: 1;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e0e0e0;
  }
`;

const SaveButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #024a47;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #013d3b;
  }
`;

const Error = styled.span`
  color: #d32f2f;
  font-size: 0.8rem;
  margin-top: -0.5rem;
`;

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

const Message = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #f5f5f5;
  border-radius: 8px;
`;

const StarIcon = styled.span`&::before { content: "★"; }`;
const DeleteIcon = styled.span`&::before { content: "🗑"; }`;
const PlusIcon = styled.span`&::before { content: "+"; }`;

export default Wallet;
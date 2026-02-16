import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useCart } from '../CartContext';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationCircleIcon, LockClosedIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getFirestore, collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import useStripePayment from './useStripePayment';
import SEO from './SEO';

// DO NOT initialize Stripe here - we'll use the instance from useStripePayment

const StripeCardForm = ({ onSubmit, isSubmitting, total, error, setError }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setError(null);
    await onSubmit(elements);
  };

  return (
    <div>
      <CardElementContainer error={error}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' }
              },
              invalid: { color: '#e53935' }
            }
          }}
          onChange={(e) => setError(e.error?.message || null)}
        />
      </CardElementContainer>
      {error && <ErrorText>{error}</ErrorText>}
      <SubmitButton
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner />
            Processing...
          </>
        ) : `Pay $${total.toFixed(2)}`}
      </SubmitButton>
    </div>
  );
};

const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
  ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
  ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
  ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
  ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
  ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
  ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
  ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
  ['DC','District of Columbia'],['PR','Puerto Rico'],['VI','Virgin Islands'],['GU','Guam'],
  ['AS','American Samoa'],['MP','Northern Mariana Islands']
];

const CA_PROVINCES = [
  ['AB','Alberta'],['BC','British Columbia'],['MB','Manitoba'],['NB','New Brunswick'],
  ['NL','Newfoundland and Labrador'],['NS','Nova Scotia'],['NT','Northwest Territories'],
  ['NU','Nunavut'],['ON','Ontario'],['PE','Prince Edward Island'],['QC','Quebec'],
  ['SK','Saskatchewan'],['YT','Yukon']
];

const validateForm = (formData) => {
  const errors = {};
  if (!formData.firstName.trim()) errors.firstName = 'First name is required';
  if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email';
  }
  if (!formData.address.trim()) errors.address = 'Address is required';
  if (!formData.city.trim()) errors.city = 'City is required';
  if (!formData.state.trim()) errors.state = 'State/Province is required';
  if (!formData.zipCode.trim()) errors.zipCode = 'ZIP code is required';
  if (!formData.country.trim()) errors.country = 'Country is required';
  return errors;
};

const CheckoutPage = () => {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const { handleCardPayment, handleCheckout, paymentLoading, paymentError, setPaymentError, stripePromise } = useStripePayment();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    paymentMethod: 'stripe_checkout'
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isBelowMinimum = total < 0.50;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        setFormData(prev => ({ ...prev, email: user.email }));
      }
    });
    return unsubscribe;
  }, [auth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const saveOrderToFirestore = async (status, paymentMethod, paymentId = null) => {
    const user = auth.currentUser;
    const now = serverTimestamp();
    
    const orderItems = items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.selectedSize || 'N/A',
      stripePriceId: item.stripePriceId || ''
    }));

    const orderData = {
      items: orderItems,
      total,
      status,
      paymentMethod,
      shippingInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country
      },
      createdAt: now,
      updatedAt: now,
      ...(user && { userId: user.uid }),
      ...(paymentId && { paymentId })
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    return docRef.id;
  };

  const updateOrderStatus = async (orderId, status, paymentId = null) => {
    const updateData = { 
      status, 
      updatedAt: serverTimestamp(),
      ...(paymentId && { paymentId })
    };
    await updateDoc(doc(db, 'orders', orderId), updateData);
  };

  const handlePaymentProcess = async (paymentHandler) => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      window.scrollTo(0, 0);
      return;
    }

    setPaymentError(null);
    let localOrderId;

    try {
      localOrderId = await saveOrderToFirestore('pending', formData.paymentMethod);
      setOrderId(localOrderId);
      
      const result = await paymentHandler(localOrderId);
      
      if (result.success) {
        if (formData.paymentMethod === 'card') {
          await updateOrderStatus(localOrderId, 'paid', result.paymentId);
        }
        clearCart();
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
      
      if (localOrderId) {
        await updateOrderStatus(localOrderId, 'failed');
      }
    }
  };

  const processCardPayment = async (elements, orderId) => {
    return handleCardPayment({
      elements,
      formData,
      total,
      orderId,
      auth
    });
  };

  const processStripeCheckout = async (orderId) => {
    return handleCheckout({
      formData,
      items,
      orderId
    });
  };

  const handleCardFormSubmit = async (elements) => {
    await handlePaymentProcess(async (orderId) => {
      return processCardPayment(elements, orderId);
    });
  };

  const handleStripeCheckout = async () => {
    await handlePaymentProcess(processStripeCheckout);
  };

  if (isSuccess) {
    return (
      <CheckoutContainer>
        <SuccessMessage>
          <SuccessIcon>
            <CheckCircleIcon />
          </SuccessIcon>
          <h2>Order Confirmed!</h2>
          <p>Thank you for your purchase. Your order has been received.</p>
          {orderId && <p>Order ID: {orderId}</p>}
          <p>A confirmation email has been sent to {formData.email}</p>
          <SubmitButton onClick={() => navigate('/')}>
            Continue Shopping
          </SubmitButton>
        </SuccessMessage>
      </CheckoutContainer>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <SEO title="Checkout" noindex path="/checkout" />
      <CheckoutContainer>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeftIcon width={20} height={20} />
          Back to Cart
        </BackButton>

        {paymentError && (
          <ErrorMessage>
            <ExclamationCircleIcon width={20} height={20} />
            {paymentError}
          </ErrorMessage>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          <CheckoutGrid>
            <div>
              <Section>
                <SectionTitle>Shipping Information</SectionTitle>
                <FormGroup>
                  <Label>First Name</Label>
                  <Input name="firstName" value={formData.firstName} onChange={handleChange} error={formErrors.firstName} required />
                  {formErrors.firstName && <ErrorText>{formErrors.firstName}</ErrorText>}
                </FormGroup>
                <FormGroup>
                  <Label>Last Name</Label>
                  <Input name="lastName" value={formData.lastName} onChange={handleChange} error={formErrors.lastName} required />
                  {formErrors.lastName && <ErrorText>{formErrors.lastName}</ErrorText>}
                </FormGroup>
                <FormGroup>
                  <Label>Email</Label>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} error={formErrors.email} required />
                  {formErrors.email && <ErrorText>{formErrors.email}</ErrorText>}
                </FormGroup>
                <FormGroup>
                  <Label>Phone</Label>
                  <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 123-4567" />
                </FormGroup>
                <FormGroup>
                  <Label>Address</Label>
                  <Input name="address" value={formData.address} onChange={handleChange} error={formErrors.address} required />
                  {formErrors.address && <ErrorText>{formErrors.address}</ErrorText>}
                </FormGroup>
                <FormGroup>
                  <Label>Address Line 2</Label>
                  <Input name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="Apt, suite, unit, etc. (optional)" />
                </FormGroup>
                <FormGroup>
                  <Label>City</Label>
                  <Input name="city" value={formData.city} onChange={handleChange} error={formErrors.city} required />
                  {formErrors.city && <ErrorText>{formErrors.city}</ErrorText>}
                </FormGroup>
                <FormGroup>
                  <Label>State / Province</Label>
                  {(formData.country === 'US' || formData.country === 'CA') ? (
                    <Select name="state" value={formData.state} onChange={handleChange} error={formErrors.state}>
                      <option value="">Select...</option>
                      {(formData.country === 'US' ? US_STATES : CA_PROVINCES).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </Select>
                  ) : (
                    <Input name="state" value={formData.state} onChange={handleChange} error={formErrors.state} required />
                  )}
                  {formErrors.state && <ErrorText>{formErrors.state}</ErrorText>}
                </FormGroup>
                <FormGroup>
                  <Label>ZIP Code</Label>
                  <Input name="zipCode" value={formData.zipCode} onChange={handleChange} error={formErrors.zipCode} required />
                  {formErrors.zipCode && <ErrorText>{formErrors.zipCode}</ErrorText>}
                </FormGroup>
                <FormGroup>
                  <Label>Country</Label>
                  <Select name="country" value={formData.country} onChange={handleChange} error={formErrors.country}>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                  </Select>
                  {formErrors.country && <ErrorText>{formErrors.country}</ErrorText>}
                </FormGroup>
              </Section>

              <Section>
                <SectionTitle>Payment Method</SectionTitle>
                <SecureBadge>
                  <LockClosedIcon width={14} height={14} />
                  All transactions are secure and encrypted
                </SecureBadge>

                <PaymentOptions>
                  <PaymentOption
                    $selected={formData.paymentMethod === 'stripe_checkout'}
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'stripe_checkout' }))}
                  >
                    <PaymentOptionRadio>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="stripe_checkout"
                        checked={formData.paymentMethod === 'stripe_checkout'}
                        onChange={handleChange}
                      />
                    </PaymentOptionRadio>
                    <PaymentOptionContent>
                      <PaymentOptionHeader>
                        <LockClosedIcon width={18} height={18} />
                        <PaymentOptionTitle>Secure Checkout</PaymentOptionTitle>
                        <RecommendedBadge>Recommended</RecommendedBadge>
                      </PaymentOptionHeader>
                      <PaymentOptionDesc>
                        Pay securely on a dedicated payment page. Supports credit cards, debit cards, Apple Pay, and Google Pay.
                      </PaymentOptionDesc>
                    </PaymentOptionContent>
                  </PaymentOption>

                  <PaymentOption
                    $selected={formData.paymentMethod === 'card'}
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'card' }))}
                  >
                    <PaymentOptionRadio>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={handleChange}
                      />
                    </PaymentOptionRadio>
                    <PaymentOptionContent>
                      <PaymentOptionHeader>
                        <CreditCardIcon width={18} height={18} />
                        <PaymentOptionTitle>Credit / Debit Card</PaymentOptionTitle>
                      </PaymentOptionHeader>
                      <PaymentOptionDesc>
                        Enter your card details directly on this page.
                      </PaymentOptionDesc>
                    </PaymentOptionContent>
                  </PaymentOption>
                </PaymentOptions>

                {formData.paymentMethod === 'card' && (
                  <StripeCardForm
                    onSubmit={handleCardFormSubmit}
                    isSubmitting={paymentLoading}
                    total={total}
                    error={paymentError}
                    setError={setPaymentError}
                  />
                )}
              </Section>
            </div>

            <OrderSummary>
              <Section>
                <SectionTitle>Order Summary</SectionTitle>
                {items.map(item => (
                  <OrderItem key={`${item.id}-${item.selectedSize}`}>
                    <div>
                      {item.name} ({item.selectedSize}) × {item.quantity}
                    </div>
                    <div>${(item.price * item.quantity).toFixed(2)}</div>
                  </OrderItem>
                ))}
                <OrderTotal>
                  <div>Total</div>
                  <div>${total.toFixed(2)}</div>
                </OrderTotal>

                {isBelowMinimum && (
                  <ErrorText>Minimum order amount is $0.50</ErrorText>
                )}

                {formData.paymentMethod === 'stripe_checkout' && (
                  <SubmitButton
                    onClick={handleStripeCheckout}
                    disabled={paymentLoading || items.length === 0 || isBelowMinimum}
                  >
                    {paymentLoading ? (
                      <>
                        <LoadingSpinner />
                        Redirecting...
                      </>
                    ) : 'Proceed to Payment'}
                  </SubmitButton>
                )}
              </Section>
            </OrderSummary>
          </CheckoutGrid>
        </form>
      </CheckoutContainer>
    </Elements>
  );
};


const CheckoutContainer = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 1.5rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: #333;
  transition: color 0.2s ease;

  &:hover {
    color: #4CAF50;
  }
`;

const CheckoutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.section`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  position: relative;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${props => props.error ? '#e53935' : '#ddd'};
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.error ? '#e53935' : '#4CAF50'};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${props => props.error ? '#e53935' : '#ddd'};
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  background-color: white;

  &:focus {
    outline: none;
    border-color: ${props => props.error ? '#e53935' : '#4CAF50'};
  }
`;

const ErrorText = styled.span`
  color: #e53935;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
`;

const OrderSummary = styled.div`
  position: sticky;
  top: 1rem;

  @media (max-width: 768px) {
    position: static;
  }
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
`;

const OrderTotal = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  font-weight: bold;
  font-size: 1.1rem;
  border-top: 2px solid #eee;
  margin-top: 0.5rem;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: #45a049;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  text-align: center;
  padding: 2rem;
  animation: fadeIn 0.5s ease;
`;

const SuccessIcon = styled.div`
  color: #4CAF50;
  margin-bottom: 1rem;

  svg {
    width: 60px;
    height: 60px;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 1rem;
  background: #ffebee;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #e53935;
`;

const SecureBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #4CAF50;
  margin-bottom: 1rem;
  font-weight: 500;
`;

const PaymentOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const PaymentOption = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid ${props => props.$selected ? '#044947' : '#e0e0e0'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$selected ? '#f8fffe' : '#fff'};

  &:hover {
    border-color: ${props => props.$selected ? '#044947' : '#bbb'};
  }
`;

const PaymentOptionRadio = styled.div`
  padding-top: 2px;
  flex-shrink: 0;

  input[type="radio"] {
    accent-color: #044947;
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
`;

const PaymentOptionContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const PaymentOptionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
`;

const PaymentOptionTitle = styled.span`
  font-weight: 600;
  font-size: 0.95rem;
`;

const PaymentOptionDesc = styled.p`
  font-size: 0.8rem;
  color: #888;
  margin: 0.35rem 0 0;
  line-height: 1.4;
`;

const RecommendedBadge = styled.span`
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #044947;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
`;

const CardElementContainer = styled.div`
  padding: 0.75rem;
  border: 1px solid ${props => props.error ? '#e53935' : '#ddd'};
  border-radius: 4px;
  margin-bottom: 1rem;
  transition: border-color 0.2s ease;
`;

const LoadingSpinner = styled.div`
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid white;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default CheckoutPage;
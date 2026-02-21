import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDonationPayment from './useDonationPayment';

const DONATION_TIERS = [
  { amount: 10, label: '$10', description: '1 free meal' },
  { amount: 50, label: '$50', description: '5 educational and recreational books' },
  { amount: 100, label: '$100', description: '900 pcs of educational stickers for suicide prevention' },
  { amount: 250, label: '$250', description: 'One case of essential oils for the aroma therapy program' },
  { amount: 500, label: '$500', description: 'Facilitate educational/recreational mental health events' },
  { amount: 1000, label: '$1,000', description: 'Art supplies for our art therapy program' },
  { amount: 2000, label: '$2,000', description: '20 hours of free therapy for the community' },
  { amount: 5000, label: '$5,000', description: 'Dedicated mental health clinic in Saratoga Springs, Utah' },
];

const StripeCardForm = ({ onSubmit, isSubmitting, amount, error, setError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setError(null);
    await onSubmit(elements);
  };

  const elementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': { color: '#aab7c4' },
      },
      invalid: { color: '#e53935' },
    },
  };

  return (
    <div>
      <SplitFormContainer>
        <SplitFormGroup>
          <SplitLabel>Card Number</SplitLabel>
          <SplitInputWrapper $focused={focusedField === 'cardNumber'} $error={error && error.includes('number')}>
            <CardNumberElement
              options={elementOptions}
              onChange={(e) => setError(e.error?.message || null)}
              onFocus={() => setFocusedField('cardNumber')}
              onBlur={() => setFocusedField(null)}
            />
          </SplitInputWrapper>
        </SplitFormGroup>

        <SplitFormRow>
          <SplitFormGroup>
            <SplitLabel>Expiry Date</SplitLabel>
            <SplitInputWrapper $focused={focusedField === 'cardExpiry'} $error={error && error.includes('expiry')}>
              <CardExpiryElement
                options={elementOptions}
                onChange={(e) => setError(e.error?.message || null)}
                onFocus={() => setFocusedField('cardExpiry')}
                onBlur={() => setFocusedField(null)}
              />
            </SplitInputWrapper>
          </SplitFormGroup>

          <SplitFormGroup>
            <SplitLabel>CVC</SplitLabel>
            <SplitInputWrapper $focused={focusedField === 'cardCvc'} $error={error && error.includes('cvc')}>
              <CardCvcElement
                options={elementOptions}
                onChange={(e) => setError(e.error?.message || null)}
                onFocus={() => setFocusedField('cardCvc')}
                onBlur={() => setFocusedField(null)}
              />
            </SplitInputWrapper>
          </SplitFormGroup>
        </SplitFormRow>
      </SplitFormContainer>

      {error && <CardError>{error}</CardError>}
      <PayButton
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Spinner />
            Processing...
          </>
        ) : (
          `Donate $${amount.toFixed(2)}`
        )}
      </PayButton>
    </div>
  );
};

const DonationCheckoutInner = ({ preselectedAmount, onClose, isInline = false }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const {
    handleDonationCardPayment,
    handleDonationCheckout,
    donationLoading,
    donationError,
    setDonationError,
  } = useDonationPayment();

  const [frequency, setFrequency] = useState('one_time');
  const [selectedTier, setSelectedTier] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('stripe_checkout');
  const [donorInfo, setDonorInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (preselectedAmount) {
      const tier = DONATION_TIERS.find((t) => t.amount === preselectedAmount);
      if (tier) {
        setSelectedTier(tier.amount);
        setCustomAmount('');
      }
    }
  }, [preselectedAmount]);

  useEffect(() => {
    if (currentUser?.email) {
      setDonorInfo((prev) => ({ ...prev, email: currentUser.email }));
    }
    if (currentUser?.displayName) {
      const parts = currentUser.displayName.split(' ');
      setDonorInfo((prev) => ({
        ...prev,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
      }));
    }
  }, [currentUser]);

  // Force Stripe Checkout for monthly
  useEffect(() => {
    if (frequency === 'monthly') {
      setPaymentMethod('stripe_checkout');
    }
  }, [frequency]);

  const getAmount = () => {
    if (customAmount) return parseFloat(customAmount);
    if (selectedTier) return selectedTier;
    return 0;
  };

  const getTierDescription = () => {
    if (selectedTier) {
      const tier = DONATION_TIERS.find((t) => t.amount === selectedTier);
      return tier?.description || null;
    }
    return null;
  };

  const validateForm = () => {
    const errors = {};
    if (!donorInfo.firstName.trim()) errors.firstName = 'First name is required';
    if (!donorInfo.lastName.trim()) errors.lastName = 'Last name is required';
    if (!donorInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorInfo.email)) {
      errors.email = 'Please enter a valid email';
    }
    const amount = getAmount();
    if (!amount || amount < 1) errors.amount = 'Minimum donation is $1.00';
    return errors;
  };

  const handleTierSelect = (amount) => {
    setSelectedTier(amount);
    setCustomAmount('');
    setFormErrors((prev) => ({ ...prev, amount: null }));
  };

  const handleCustomAmountChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setCustomAmount(val);
      setSelectedTier(null);
      setFormErrors((prev) => ({ ...prev, amount: null }));
    }
  };

  const handleDonorChange = (e) => {
    const { name, value } = e.target;
    setDonorInfo((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleCardFormSubmit = async (elements) => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const amount = getAmount();
    const result = await handleDonationCardPayment({
      elements,
      donorInfo,
      amountCents: Math.round(amount * 100),
      donationTierDescription: getTierDescription(),
    });

    if (result.success) {
      setIsSuccess(true);
    }
  };

  const handleStripeCheckout = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (frequency === 'monthly' && !isAuthenticated) return;

    const amount = getAmount();
    const result = await handleDonationCheckout({
      donorInfo,
      amountCents: Math.round(amount * 100),
      frequency,
      donationTierDescription: getTierDescription(),
    });

    if (!result.success) {
      // Error is already set by the hook
    }
  };

  const amount = getAmount();
  const isMonthlyUnauthenticated = frequency === 'monthly' && !isAuthenticated;

  if (isSuccess) {
    return (
      <SuccessWrapper>
        <SuccessCheckmark>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="48" height="48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </SuccessCheckmark>
        <SuccessTitle>Thank You!</SuccessTitle>
        <SuccessText>Your donation of ${amount.toFixed(2)} has been processed successfully.</SuccessText>
        {isInline ? (
          <CloseButton onClick={() => setIsSuccess(false)}>Donate Again</CloseButton>
        ) : (
          <CloseButton onClick={onClose}>Close</CloseButton>
        )}
      </SuccessWrapper>
    );
  }

  return (
    <CheckoutWrapper $inline={isInline}>
      {!isInline && (
        <CheckoutHeader>
          <CheckoutTitle>Make a Donation</CheckoutTitle>
          <CloseIcon onClick={onClose}>&times;</CloseIcon>
        </CheckoutHeader>
      )}

      {donationError && <ErrorBanner>{donationError}</ErrorBanner>}

      {/* Frequency Toggle */}
      <SectionLabel>Frequency</SectionLabel>
      <FrequencyToggle>
        <FrequencyOption
          $active={frequency === 'one_time'}
          onClick={() => setFrequency('one_time')}
        >
          One-Time
        </FrequencyOption>
        <FrequencyOption
          $active={frequency === 'monthly'}
          onClick={() => setFrequency('monthly')}
        >
          Monthly
        </FrequencyOption>
      </FrequencyToggle>

      {/* Tier Grid — Bento Layout */}
      <SectionLabel>Select Amount</SectionLabel>
      <TierGrid>
        {DONATION_TIERS.map((tier, i) => (
          <TierCard
            key={tier.amount}
            $selected={selectedTier === tier.amount && !customAmount}
            $index={i}
            onClick={() => handleTierSelect(tier.amount)}
          >
            <TierAmount $large={i === 4 || i === 7}>{tier.label}</TierAmount>
            <TierDesc>{tier.description}</TierDesc>
          </TierCard>
        ))}
      </TierGrid>

      {/* Custom Amount */}
      <CustomAmountWrapper>
        <SectionLabel>Or enter a custom amount</SectionLabel>
        <CustomAmountInputWrapper>
          <DollarSign>$</DollarSign>
          <CustomAmountInput
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={customAmount}
            onChange={handleCustomAmountChange}
          />
        </CustomAmountInputWrapper>
        {formErrors.amount && <FieldError>{formErrors.amount}</FieldError>}
      </CustomAmountWrapper>

      {/* Donor Info */}
      <SectionLabel>Your Information</SectionLabel>
      <FormRow>
        <FormField>
          <FieldLabel>First Name</FieldLabel>
          <FieldInput
            name="firstName"
            value={donorInfo.firstName}
            onChange={handleDonorChange}
            $error={formErrors.firstName}
          />
          {formErrors.firstName && <FieldError>{formErrors.firstName}</FieldError>}
        </FormField>
        <FormField>
          <FieldLabel>Last Name</FieldLabel>
          <FieldInput
            name="lastName"
            value={donorInfo.lastName}
            onChange={handleDonorChange}
            $error={formErrors.lastName}
          />
          {formErrors.lastName && <FieldError>{formErrors.lastName}</FieldError>}
        </FormField>
      </FormRow>
      <FormField>
        <FieldLabel>Email</FieldLabel>
        <FieldInput
          type="email"
          name="email"
          value={donorInfo.email}
          onChange={handleDonorChange}
          $error={formErrors.email}
        />
        {formErrors.email && <FieldError>{formErrors.email}</FieldError>}
      </FormField>

      {/* Payment Method */}
      <SectionLabel>How would you like to pay?</SectionLabel>
      <PaymentOptions>
        <PaymentOptionCard
          $selected={paymentMethod === 'stripe_checkout'}
          onClick={() => setPaymentMethod('stripe_checkout')}
        >
          <PaymentOptionRadio
            type="radio"
            name="paymentMethod"
            value="stripe_checkout"
            checked={paymentMethod === 'stripe_checkout'}
            readOnly
          />
          <PaymentOptionContent>
            <PaymentOptionLabel>Secure Checkout</PaymentOptionLabel>
            <PaymentOptionDesc>
              Pay on a secure page — supports cards, Apple Pay, and Google Pay
            </PaymentOptionDesc>
          </PaymentOptionContent>
        </PaymentOptionCard>
        {frequency !== 'monthly' && (
          <PaymentOptionCard
            $selected={paymentMethod === 'card'}
            onClick={() => setPaymentMethod('card')}
          >
            <PaymentOptionRadio
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              readOnly
            />
            <PaymentOptionContent>
              <PaymentOptionLabel>Enter Card Details</PaymentOptionLabel>
              <PaymentOptionDesc>
                Pay directly on this page with your credit or debit card
              </PaymentOptionDesc>
            </PaymentOptionContent>
          </PaymentOptionCard>
        )}
      </PaymentOptions>
      {frequency === 'monthly' && (
        <PaymentNote>Monthly donations are processed on a secure checkout page to set up recurring billing.</PaymentNote>
      )}

      {/* Login Gate for Monthly */}
      {isMonthlyUnauthenticated && (
        <LoginGate>
          <LoginGateText>Monthly donations require an account.</LoginGateText>
          <LoginLink to="/auth">Log in or Sign up</LoginLink>
        </LoginGate>
      )}

      {/* Card Element or Checkout Button */}
      {paymentMethod === 'card' && frequency !== 'monthly' ? (
        <StripeCardForm
          onSubmit={handleCardFormSubmit}
          isSubmitting={donationLoading}
          amount={amount}
          error={donationError}
          setError={setDonationError}
        />
      ) : (
        <DonationSummary>
          <SummaryRow>
            <span>Donation Amount</span>
            <span>${amount ? amount.toFixed(2) : '0.00'}</span>
          </SummaryRow>
          {frequency === 'monthly' && (
            <SummaryRow>
              <span>Frequency</span>
              <span>Monthly</span>
            </SummaryRow>
          )}
          <PayButton
            onClick={handleStripeCheckout}
            disabled={donationLoading || !amount || amount < 1 || isMonthlyUnauthenticated}
          >
            {donationLoading ? (
              <>
                <Spinner />
                Redirecting...
              </>
            ) : (
              `Donate $${amount ? amount.toFixed(2) : '0.00'}${frequency === 'monthly' ? '/month' : ''}`
            )}
          </PayButton>
        </DonationSummary>
      )}
    </CheckoutWrapper>
  );
};

const DonationCheckout = ({ preselectedAmount, onClose }) => {
  const { stripePromise } = useDonationPayment();

  // Lock body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <Overlay onClick={handleBackdropClick}>
      <Elements stripe={stripePromise}>
        <DonationCheckoutInner preselectedAmount={preselectedAmount} onClose={onClose} />
      </Elements>
    </Overlay>
  );
};

// Styled Components
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 2rem 1rem;
`;

const CheckoutWrapper = styled.div`
  background: ${(p) => (p.$inline ? 'transparent' : 'white')};
  border-radius: ${(p) => (p.$inline ? '0' : '12px')};
  padding: ${(p) => (p.$inline ? '0' : '1.5rem')};
  width: 100%;
  max-width: 700px;
  box-shadow: ${(p) => (p.$inline ? 'none' : '0 16px 48px rgba(0, 0, 0, 0.25)')};
  animation: ${(p) => (p.$inline ? 'none' : 'slideUp 0.3s ease-out')};

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (min-width: 768px) {
    padding: ${(p) => (p.$inline ? '0' : '2rem')};
  }
`;

const CheckoutHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const CheckoutTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #054944;
  margin: 0;
`;

const CloseIcon = styled.button`
  background: none;
  border: none;
  font-size: 1.75rem;
  color: #666;
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem;

  &:hover {
    color: #cc4200;
  }
`;

const ErrorBanner = styled.div`
  background: #ffebee;
  color: #c62828;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const SectionLabel = styled.p`
  font-weight: 600;
  color: #054944;
  margin: 1.25rem 0 0.5rem;
  font-size: 0.95rem;
`;

const FrequencyToggle = styled.div`
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #054944;
`;

const FrequencyOption = styled.button`
  flex: 1;
  padding: 0.65rem;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(p) => (p.$active ? '#054944' : 'white')};
  color: ${(p) => (p.$active ? 'white' : '#054944')};

  &:hover {
    background: ${(p) => (p.$active ? '#054944' : '#f0f0f0')};
  }
`;

/*
 * Bento grid layout (desktop 4 columns):
 *
 *  ┌──────┬──────┬──────┬──────┐
 *  │  $10 │  $50 │ $100 │ $250 │  row 1 — four equal cells
 *  ├──────┴──────┼──────┼──────┤
 *  │    $500     │$1000 │$2000 │  row 2 — $500 spans 2 cols
 *  ├─────────────┴──────┴──────┤
 *  │          $5,000           │  row 3 — full-width feature
 *  └───────────────────────────┘
 *
 *  Mobile (2 columns): $500 spans full row, $5000 spans full row
 */
const bentoSpan = (i) => {
  if (i === 4) return 'span 2';       // $500
  if (i === 7) return '1 / -1';       // $5,000 full width
  return 'auto';
};

const TierGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem;

  @media (min-width: 600px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }
`;

const TierCard = styled.button`
  grid-column: ${(p) => bentoSpan(p.$index)};
  background: ${(p) => (p.$selected ? '#054944' : '#fcd3c1')};
  color: ${(p) => (p.$selected ? 'white' : '#cc4200')};
  border: 2px solid ${(p) => (p.$selected ? '#054944' : 'transparent')};
  border-radius: 10px;
  padding: ${(p) => (p.$index === 7 ? '1.25rem 1rem' : '0.75rem 0.5rem')};
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: ${(p) => (p.$index === 7 ? '90px' : 'auto')};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);

  &:hover {
    border-color: #054944;
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }

  @media (max-width: 599px) {
    grid-column: ${(p) => {
    if (p.$index === 4) return '1 / -1';   // $500 full row on mobile
    if (p.$index === 7) return '1 / -1';   // $5000 full row on mobile
    return 'auto';
  }};
  }
`;

const TierAmount = styled.div`
  font-size: ${(p) => (p.$large ? '1.5rem' : '1.1rem')};
  font-weight: 700;
  letter-spacing: ${(p) => (p.$large ? '-0.02em' : 'normal')};
`;

const TierDesc = styled.div`
  font-size: 0.7rem;
  margin-top: 0.25rem;
  line-height: 1.3;
  opacity: 0.85;
  max-width: 280px;
`;

const CustomAmountWrapper = styled.div`
  margin-top: 0.5rem;
`;

const CustomAmountInputWrapper = styled.div`
  display: flex;
  align-items: center;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: #054944;
  }
`;

const DollarSign = styled.span`
  padding: 0.75rem;
  background: #f5f5f5;
  color: #666;
  font-weight: 600;
  font-size: 1.1rem;
`;

const CustomAmountInput = styled.input`
  flex: 1;
  border: none;
  padding: 0.75rem;
  font-size: 1.1rem;
  outline: none;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

const FormField = styled.div`
  margin-bottom: 0.75rem;
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.35rem;
`;

const FieldInput = styled.input`
  width: 100%;
  padding: 0.65rem;
  border: 1px solid ${(p) => (p.$error ? '#e53935' : '#ddd')};
  border-radius: 6px;
  font-size: 0.95rem;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${(p) => (p.$error ? '#e53935' : '#054944')};
  }
`;

const FieldError = styled.span`
  color: #e53935;
  font-size: 0.8rem;
  margin-top: 0.2rem;
  display: block;
`;

const PaymentOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PaymentOptionCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid ${(p) => (p.$selected ? '#054944' : '#e0e0e0')};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(p) => (p.$selected ? '#f0faf9' : 'white')};

  &:hover {
    border-color: #054944;
  }
`;

const PaymentOptionRadio = styled.input`
  margin-top: 0.15rem;
  accent-color: #054944;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
`;

const PaymentOptionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const PaymentOptionLabel = styled.span`
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
`;

const PaymentOptionDesc = styled.span`
  font-size: 0.8rem;
  color: #888;
  line-height: 1.35;
`;

const PaymentNote = styled.p`
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.35rem;
  font-style: italic;
`;

const LoginGate = styled.div`
  background: #fff3e0;
  border: 1px solid #ffcc80;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  margin: 1rem 0;
`;

const LoginGateText = styled.p`
  color: #e65100;
  font-weight: 500;
  margin: 0 0 0.5rem;
`;

const LoginLink = styled(Link)`
  color: #054944;
  font-weight: 600;
  text-decoration: underline;

  &:hover {
    color: #cc4200;
  }
`;

const SplitFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SplitFormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const SplitFormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SplitLabel = styled.label`
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
`;

const SplitInputWrapper = styled.div`
  padding: 0.75rem;
  border: 1px solid ${(p) => (p.$error ? '#e53935' : p.$focused ? '#054944' : '#ddd')};
  border-radius: 6px;
  background: white;
  transition: all 0.2s;
  box-shadow: ${(p) => (p.$focused ? '0 0 0 1px #054944' : 'none')};

  .StripeElement {
    width: 100%;
  }
`;

const CardError = styled.span`
  color: #e53935;
  font-size: 0.8rem;
  display: block;
  margin-bottom: 0.5rem;
`;

const DonationSummary = styled.div`
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  font-size: 0.95rem;
  color: #333;
`;

const PayButton = styled.button`
  width: 100%;
  padding: 0.9rem;
  background: #cc4200;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: #054944;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const Spinner = styled.div`
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

const SuccessWrapper = styled.div`
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  max-width: 500px;
  margin: 2rem auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
`;

const SuccessCheckmark = styled.div`
  color: #054944;
  margin-bottom: 1rem;
`;

const SuccessTitle = styled.h3`
  font-size: 1.5rem;
  color: #054944;
  margin: 0 0 0.5rem;
`;

const SuccessText = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
`;

const CloseButton = styled.button`
  padding: 0.75rem 2rem;
  background: #054944;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #cc4200;
  }
`;

export const DonationCheckoutInline = () => {
  const { stripePromise } = useDonationPayment();
  return (
    <Elements stripe={stripePromise}>
      <DonationCheckoutInner isInline />
    </Elements>
  );
};

export default DonationCheckout;

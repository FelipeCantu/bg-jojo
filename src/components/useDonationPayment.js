import { useState } from 'react';
import { getStripePromise } from './stripeConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { CardNumberElement } from '@stripe/react-stripe-js';

const useDonationPayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const stripePromise = getStripePromise();

  // Initialize Firebase Functions with caching
  const getCloudFunctions = (() => {
    let functionsInstance = null;
    return () => {
      if (!functionsInstance) {
        const app = getApp();
        functionsInstance = getFunctions(app, 'us-central1');
      }
      return functionsInstance;
    };
  })();

  const handleDonationCardPayment = async ({ elements, donorInfo, amountCents, donationTierDescription }) => {
    setLoading(true);
    setError(null);

    try {
      if (!elements || !donorInfo || !amountCents) {
        throw new Error('Missing required donation parameters');
      }

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');

      const api = httpsCallable(getCloudFunctions(), 'api');

      const { data: { clientSecret, donationId } } = await api({
        endpoint: 'createDonationPaymentIntent',
        amountCents: Math.round(amountCents),
        currency: 'usd',
        donorInfo: {
          email: donorInfo.email,
          firstName: donorInfo.firstName,
          lastName: donorInfo.lastName,
          tierDescription: donationTierDescription || null,
        },
        frequency: 'one_time',
      });

      if (!clientSecret) throw new Error('No client secret received');

      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${donorInfo.firstName} ${donorInfo.lastName}`,
            email: donorInfo.email,
          },
        },
      });

      if (stripeError) throw stripeError;
      if (!paymentIntent) throw new Error('Payment failed - no intent returned');

      // Confirm donation status in Firestore (don't rely solely on webhook)
      if (paymentIntent.status === 'succeeded') {
        try {
          await api({
            endpoint: 'confirmDonationPayment',
            donationId,
            paymentIntentId: paymentIntent.id,
          });
        } catch (confirmErr) {
          console.warn('Donation confirmation will be handled by webhook:', confirmErr.message);
        }
      }

      return {
        success: true,
        paymentId: paymentIntent.id,
        donationId,
        paymentStatus: paymentIntent.status,
      };
    } catch (err) {
      const errorMessage = err.message || 'Donation payment failed';
      setError(errorMessage);
      console.error('Donation payment error:', err);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const handleDonationCheckout = async ({ donorInfo, amountCents, frequency, donationTierDescription }) => {
    setLoading(true);
    setError(null);

    try {
      if (!donorInfo || !amountCents) {
        throw new Error('Missing required donation parameters');
      }

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');

      const api = httpsCallable(getCloudFunctions(), 'api');

      const { data } = await api({
        endpoint: 'createDonationCheckoutSession',
        amountCents: Math.round(amountCents),
        currency: 'usd',
        frequency: frequency || 'one_time',
        donorInfo: {
          email: donorInfo.email,
          firstName: donorInfo.firstName,
          lastName: donorInfo.lastName,
          tierDescription: donationTierDescription || null,
        },
        successUrl: `${window.location.origin}/donation-success`,
        cancelUrl: `${window.location.origin}/donate`,
      });

      if (!data?.id) throw new Error('No session ID received');

      const result = await stripe.redirectToCheckout({ sessionId: data.id });

      if (result.error) throw result.error;
      return { success: true, donationId: data.donationId };
    } catch (err) {
      const errorMessage = err.message || 'Donation checkout failed';
      setError(errorMessage);
      console.error('Donation checkout error:', err);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    handleDonationCardPayment,
    handleDonationCheckout,
    donationLoading: loading,
    donationError: error,
    setDonationError: setError,
    stripePromise,
  };
};

export default useDonationPayment;

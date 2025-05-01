import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js/pure';
import { CardElement } from '@stripe/react-stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';

const useStripePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

  const handleCardPayment = async ({ elements, formData, total, orderId, auth }) => {
    setLoading(true);
    setError(null);
    
    try {
      const stripe = await stripePromise;
      const functions = getFunctions();
      
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      const { data: { clientSecret } } = await createPaymentIntent({
        amount: Math.round(total * 100),
        currency: 'usd',
        receipt_email: formData.email,
        metadata: { 
          orderId: orderId.toString(),
          userId: (auth.currentUser?.uid || 'guest').toString()
        }
      });

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            address: {
              line1: formData.address,
              city: formData.city,
              postal_code: formData.zipCode,
              country: formData.country
            },
          },
        },
      });

      if (stripeError) throw stripeError;
      return { success: true, paymentId: paymentIntent.id };
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async ({ formData, items, orderId }) => {
    setLoading(true);
    setError(null);
    
    try {
      const stripe = await stripePromise;
      const functions = getFunctions();
      
      const lineItems = items.map(item => ({
        price: item.stripePriceId,
        quantity: item.quantity
      }));

      const metadata = {
        orderId,
        shippingInfo: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode,
          country: formData.country
        })
      };

      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const { data } = await createCheckoutSession({
        lineItems,
        customerEmail: formData.email,
        successUrl: `${window.location.origin}/success?order_id=${orderId}`,
        cancelUrl: `${window.location.origin}/checkout?order_id=${orderId}`,
        metadata
      });

      const result = await stripe.redirectToCheckout({ sessionId: data.id });
      if (result.error) throw result.error;
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { 
    handleCardPayment, 
    handleCheckout, 
    paymentLoading: loading, 
    paymentError: error, 
    setPaymentError: setError 
  };
};

export default useStripePayment;
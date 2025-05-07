import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js/pure';
import { CardElement } from '@stripe/react-stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

const useStripePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

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

  /**
   * Process card payment directly
   * @param {Object} params
   * @param {Object} params.elements - Stripe Elements instance
   * @param {Object} params.formData - Customer form data
   * @param {number} params.total - Total amount to charge
   * @param {string} params.orderId - Unique order identifier
   * @param {Object} [params.auth] - Optional auth object
   * @returns {Promise<Object>} Payment result
   */
  const handleCardPayment = async ({ elements, formData, total, orderId, auth = {} }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!elements || !formData || !total || !orderId) {
        throw new Error('Missing required payment parameters');
      }

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');
      
      // Create payment intent
      const createPaymentIntent = httpsCallable(getCloudFunctions(), 'api-createPaymentIntent');
      
      const { data: { clientSecret } } = await createPaymentIntent({
        amount: Math.round(total * 100),
        currency: 'usd',
        receipt_email: formData.email,
        metadata: { 
          orderId: orderId.toString(),
          userId: (auth.currentUser?.uid || 'guest').toString(),
          customerName: `${formData.firstName} ${formData.lastName}`,
          ...(formData.phone && { customerPhone: formData.phone })
        }
      });

      if (!clientSecret) throw new Error('No client secret received');

      // Process card payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
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
      if (!paymentIntent) throw new Error('Payment failed - no intent returned');
      
      return { 
        success: true, 
        paymentId: paymentIntent.id,
        paymentStatus: paymentIntent.status,
        paymentMethod: paymentIntent.payment_method
      };
    } catch (err) {
      const errorMessage = err.message || 'Payment processing failed';
      setError(errorMessage);
      console.error('Payment error:', err);
      return { 
        success: false,
        error: errorMessage,
        errorDetails: err
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Process checkout via Stripe Checkout
   * @param {Object} params
   * @param {Object} params.formData - Customer form data
   * @param {Array} params.items - Array of cart items
   * @param {string} params.orderId - Unique order identifier
   * @param {Object} [params.auth] - Optional auth object
   * @returns {Promise<Object>} Checkout result
   */
  const handleCheckout = async ({ formData, items, orderId, auth = {} }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!formData || !items || !orderId) {
        throw new Error('Missing required checkout parameters');
      }

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');

      // Prepare line items
      const lineItems = items.map(item => ({
        price: item.stripePriceId,
        quantity: item.quantity,
        adjustable_quantity: { enabled: false }
      }));

      if (!lineItems.length) throw new Error('No items in cart');

      // Create checkout session
      const createCheckoutSession = httpsCallable(getCloudFunctions(), 'api-createCheckoutSession');

      const { data } = await createCheckoutSession({
        lineItems,
        customerEmail: formData.email,
        successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancelUrl: `${window.location.origin}/checkout?canceled=true&order_id=${orderId}`,
        metadata: {
          orderId: orderId.toString(),
          userId: (auth.currentUser?.uid || 'guest').toString(),
          shippingInfo: JSON.stringify({
            name: `${formData.firstName} ${formData.lastName}`,
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode,
            country: formData.country,
            ...(formData.phone && { phone: formData.phone })
          })
        },
        // Additional options for Checkout
        billingAddressCollection: 'required',
        shippingAddressCollection: {
          allowedCountries: ['US', 'CA', 'GB', 'AU'] // Customize as needed
        },
        mode: 'payment',
        allowPromotionCodes: true
      });

      if (!data?.id) throw new Error('No session ID received');

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({ 
        sessionId: data.id 
      });

      if (result.error) throw result.error;
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Checkout failed';
      setError(errorMessage);
      console.error('Checkout error:', err);
      return { 
        success: false,
        error: errorMessage,
        errorDetails: err
      };
    } finally {
      setLoading(false);
    }
  };

  return { 
    handleCardPayment, 
    handleCheckout, 
    paymentLoading: loading, 
    paymentError: error, 
    setPaymentError: setError,
    stripePromise
  };
};

export default useStripePayment;
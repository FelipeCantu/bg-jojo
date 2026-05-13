import { useState } from 'react';
import { getStripePromise } from './stripeConfig'; // Import the shared instance
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { CardElement } from '@stripe/react-stripe-js';

const useStripePayment = () => {
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
      
      // Create payment intent - FIXED: Use proper function name and endpoint
      // OLD: const createPaymentIntent = httpsCallable(getCloudFunctions(), 'api-createPaymentIntent');
      const api = httpsCallable(getCloudFunctions(), 'api');
      
      const { data: { clientSecret } } = await api({
        endpoint: 'createPaymentIntent', // Specify which endpoint to call
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

      // Confirm order status in Firestore (don't rely solely on webhook)
      if (paymentIntent.status === 'succeeded') {
        try {
          await api({
            endpoint: 'confirmOrderPayment',
            orderId,
            paymentIntentId: paymentIntent.id,
          });
        } catch (confirmErr) {
          console.warn('Order confirmation will be handled by webhook:', confirmErr.message);
        }
      }

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
  const handleCheckout = async ({ formData, items, orderId, auth = {}, fulfillmentType = 'shipping' }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!formData || !items || !orderId) {
        throw new Error('Missing required checkout parameters');
      }

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');

      if (!items.length) throw new Error('No items in cart');

      // Prepare items for the backend (which builds price_data with tax_behavior)
      const checkoutItems = items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.selectedSize || 'N/A',
      }));

      // Create checkout session - FIXED: Use proper function name and endpoint
      // OLD: const createCheckoutSession = httpsCallable(getCloudFunctions(), 'api-createCheckoutSession');
      const api = httpsCallable(getCloudFunctions(), 'api');

      const { data } = await api({
        endpoint: 'createCheckoutSession', // Specify which endpoint to call
        items: checkoutItems,
        customerEmail: formData.email,
        successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancelUrl: `${window.location.origin}/checkout?canceled=true&order_id=${orderId}`,
        metadata: {
          orderId: orderId.toString(),
          userId: (auth.currentUser?.uid || 'guest').toString(),
          fulfillmentType,
          shippingInfo: JSON.stringify({
            name: `${formData.firstName} ${formData.lastName}`,
            ...(fulfillmentType === 'shipping' && {
              address: formData.address,
              city: formData.city,
              zipCode: formData.zipCode,
              country: formData.country,
            }),
            ...(formData.phone && { phone: formData.phone })
          })
        },
        // Additional options for Checkout
        billingAddressCollection: 'required',
        ...(fulfillmentType === 'shipping' && {
          shippingAddressCollection: {
            allowedCountries: ['US', 'CA', 'GB', 'AU']
          }
        }),
        mode: 'payment',
        allowPromotionCodes: true
      });

      if (!data?.id) throw new Error('No session ID received');

      // Redirect to Stripe Checkout
      if (!data.url) throw new Error('No checkout URL received');
      window.location.href = data.url;
      // Return redirecting: true so the caller knows NOT to show the in-page
      // success view — the browser is navigating away to Stripe Checkout and
      // the success state will be handled on /success after the redirect returns.
      return { success: true, redirecting: true };
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
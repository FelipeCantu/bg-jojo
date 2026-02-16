// stripeConfig.js
import { loadStripe } from '@stripe/stripe-js';

// Create a singleton instance of Stripe
let stripePromise;
export const getStripePromise = () => {
  if (!stripePromise) {
    const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('REACT_APP_STRIPE_PUBLISHABLE_KEY is not configured');
      return Promise.resolve(null);
    }
    if (key.startsWith('pk_test_')) {
      console.warn('Stripe is in TEST MODE. No real charges will be processed.');
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

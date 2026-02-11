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
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

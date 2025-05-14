// stripeConfig.js
import { loadStripe } from '@stripe/stripe-js';

// Create a singleton instance of Stripe
let stripePromise;
export const getStripePromise = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};
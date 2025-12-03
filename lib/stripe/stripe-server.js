// lib/stripe/stripe-server.js
import Stripe from 'stripe';

let stripe;

export function getStripeServer() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}


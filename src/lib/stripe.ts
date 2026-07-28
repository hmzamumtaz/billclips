import Stripe from 'stripe';
import { getEnv } from './env';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const env = getEnv();
    stripeClient = new Stripe(env.stripeSecretKey, {
      apiVersion: '2026-06-24.dahlia',
    });
  }
  return stripeClient;
}

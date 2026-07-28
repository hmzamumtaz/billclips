import Stripe from 'stripe';
import { getEnv } from './env';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  if (!stripeClient) {
    const env = getEnv();
    if (!env.stripeSecretKey) return null;
    stripeClient = new Stripe(env.stripeSecretKey, {
      apiVersion: '2026-06-24.dahlia',
    });
  }
  return stripeClient;
}

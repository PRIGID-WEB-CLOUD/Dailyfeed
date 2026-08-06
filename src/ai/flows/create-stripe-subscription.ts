
'use server';

/**
 * @fileOverview A Genkit flow for creating a new Stripe subscription.
 *
 * This flow simulates the server-side process of creating a Stripe customer
 * and attaching a subscription to them, which would happen after a successful
 * payment via a checkout form.
 */

import { ai } from '@/ai/genkit';
import { getIntegration } from '@/lib/integration-service';
import { z } from 'genkit';
import Stripe from 'stripe';

const CreateStripeSubscriptionInputSchema = z.object({
  userId: z.string().describe("The user's unique ID in the local database."),
  userEmail: z.string().email().describe("The user's email address."),
  planId: z.string().describe("The ID of the plan they are subscribing to (e.g., 'premium-monthly')."),
  paymentMethodId: z.string().describe("The Stripe PaymentMethod ID from the frontend."),
});
export type CreateStripeSubscriptionInput = z.infer<typeof CreateStripeSubscriptionInputSchema>;

const CreateStripeSubscriptionOutputSchema = z.object({
  success: z.boolean().describe('Whether the subscription was successfully created.'),
  message: z.string().describe('A message indicating the result of the action.'),
  customerId: z.string().optional().describe('The created Stripe Customer ID.'),
  subscriptionId: z.string().optional().describe('The created Stripe Subscription ID.'),
});
export type CreateStripeSubscriptionOutput = z.infer<typeof CreateStripeSubscriptionOutputSchema>;


export async function createStripeSubscription(input: CreateStripeSubscriptionInput): Promise<CreateStripeSubscriptionOutput> {
  return createStripeSubscriptionFlow(input);
}

const createStripeSubscriptionFlow = ai.defineFlow(
  {
    name: 'createStripeSubscriptionFlow',
    inputSchema: CreateStripeSubscriptionInputSchema,
    outputSchema: CreateStripeSubscriptionOutputSchema,
  },
  async (input) => {
    const stripeIntegration = await getIntegration('stripe');
    if (!stripeIntegration?.connected || !stripeIntegration.credentials?.secretKey) {
      return {
        success: false,
        message: 'Stripe integration is not connected or configured properly.',
      };
    }

    const stripe = new Stripe(stripeIntegration.credentials.secretKey);

    // IMPORTANT: Replace with your actual Stripe Price ID for the plan.
    // You can find this in your Stripe Dashboard under Products.
    const stripePriceId = 'YOUR_STRIPE_PRICE_ID';

    if (stripePriceId === 'YOUR_STRIPE_PRICE_ID') {
        console.error("Stripe Price ID is not configured in the create-stripe-subscription flow.");
        return {
            success: false,
            message: 'Stripe is not fully configured on the server. Missing Price ID.',
        }
    }


    try {
      // 1. Create a Customer in Stripe
      const customer = await stripe.customers.create({
        email: input.userEmail,
        payment_method: input.paymentMethodId,
        invoice_settings: {
            default_payment_method: input.paymentMethodId,
        },
        metadata: { userId: input.userId },
      });
      
      // 2. Create a Subscription in Stripe
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: stripePriceId }],
        expand: ['latest_invoice.payment_intent'],
      });

      // In a real app, you would now save the customer.id and subscription.id to your user's record in Firestore.
      
      return {
        success: true,
        message: `Successfully created subscription for ${input.userEmail}.`,
        customerId: customer.id,
        subscriptionId: subscription.id,
      };

    } catch (error: any) {
      console.error("Error with Stripe API:", error);
      return {
        success: false,
        message: `Failed to create Stripe subscription: ${error.message}`,
      };
    }
  }
);

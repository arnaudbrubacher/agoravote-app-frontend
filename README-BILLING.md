# AgoraVote Billing Integration

This document outlines the billing functionality in AgoraVote, including subscription management and the Stripe Customer Portal integration.

## Overview

AgoraVote uses Stripe for payment processing and subscription management. The integration includes:

- Monthly subscription offerings for groups
- Self-service subscription management via Stripe Customer Portal
- Payment processing and invoice generation
- Billing history tracking

## Components

### Frontend

The billing functionality on the frontend is located in:

- `components/billing/PurchaseOptions.vue` - Displays available plans and handles initial subscription purchases
- `components/billing/BillingHistory.vue` - Shows billing history and past invoices
- `components/groups/tabs/SettingsTab.vue` - Includes a billing tab with subscription management

### Backend

The backend API endpoints for billing are defined in:

- `src/group/group_billing.go` - Contains all Stripe-related functionality
- `src/group/group_routes.go` - API route definitions

## Stripe Customer Portal

AgoraVote implements Stripe's Customer Portal to allow users to manage their subscriptions. The customer portal provides the following self-service functions:

- Update payment methods
- View and download invoices
- Cancel subscriptions
- Update customer information

### How to Access the Customer Portal

1. Navigate to a group's settings
2. Go to the "Billing" tab
3. For active subscriptions, click the "Manage Billing" button

### Setting Up the Customer Portal in Stripe Dashboard

Before the Customer Portal will work correctly, you must configure it in your Stripe Dashboard:

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to the test mode (make sure the toggle shows "Test mode" in the left sidebar)
3. Navigate to **Settings > Billing > Customer Portal**
   - Direct URL: [https://dashboard.stripe.com/test/settings/billing/portal](https://dashboard.stripe.com/test/settings/billing/portal)
4. Configure the Customer Portal settings:
   - Set the business information
   - Choose which functionality you want to enable (payment methods, subscriptions, etc.)
   - Configure the branding options
   - Save your settings

If the portal link shows an error saying "No configuration provided and your test mode default configuration has not been created", this means you need to set up your portal configuration first.

### Implementation Details

- Frontend: The "Manage Billing" button in `SettingsTab.vue` triggers a request to the backend API
- Backend: The `/api/payments/customer-portal/:id` endpoint creates a Stripe Customer Portal session and returns a URL
- The user is redirected to the Stripe-hosted portal
- After completing their tasks, the user is returned to the group settings page

## Environment Setup

To use the billing functionality, set the following environment variables:

- `STRIPE_SECRET_KEY` - Your Stripe API secret key
- `STRIPE_PUBLISHABLE_KEY` - Your publishable key for frontend components
- `FRONTEND_URL` - The base URL of your frontend application (e.g., `http://localhost:3000` for development or `https://agoravote.com` for production)
- `STRIPE_WEBHOOK_SECRET` - Your webhook secret for validating webhook events

## Testing

For testing, Stripe provides test cards and webhooks:

- Test card number: `4242 4242 4242 4242`
- Expiration: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## Price IDs

The following Stripe Price IDs are used:

- Monthly Subscription: `price_1RLQb4H0qQW9H6xGYOaHK6Cu`

## Additional Resources

- [Stripe Customer Portal Documentation](https://docs.stripe.com/customer-management)
- [Stripe API Reference](https://docs.stripe.com/api)
- [Stripe Testing Documentation](https://docs.stripe.com/testing)

## Handling Past Due Subscriptions

AgoraVote uses Stripe to handle payment processing and subscription management. Sometimes, a subscription may appear as "Past Due" in the Stripe Customer Portal even after a successful payment. This is a common issue in Stripe's test mode and can happen occasionally in production as well.

### Automatic Reconciliation

The system includes automatic reconciliation that fixes subscription status issues by:

1. Checking the actual subscription status directly with Stripe when viewing billing history
2. Processing Stripe webhook events to update subscription status when payments are made
3. Updating group subscription status from "past_due" to "active" when appropriate

### Manual Fixes for "Past Due" Issues

If a payment has been processed but the subscription still shows as "past_due":

1. The user can refresh the billing page to trigger reconciliation
2. Wait for Stripe's webhook events to process (may take a few minutes)
3. The system admin can manually update the subscription status through the Stripe Dashboard

### Stripe Configuration Requirements

To ensure proper functioning of the payment and subscription system:

1. **Properly Configure Customer Portal Settings**
   - In the Stripe Dashboard → Settings → Customer Portal
   - Enable all necessary billing management options
   - Add your business details, branding, and relevant legal links

2. **Set Up Required Webhook Events**
   - The system requires webhooks for these events:
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`

3. **Save Payment Methods for Future Use**
   - The system automatically configures payment intents with `setup_future_usage: 'off_session'` to save payment methods
   - This ensures recurring payments can be processed automatically

4. **Test with 4242 4242 4242 4242 Card**
   - In test mode, use this card for successful payments
   - The 4000 0000 0000 3220 test card can be used to test declined payments 
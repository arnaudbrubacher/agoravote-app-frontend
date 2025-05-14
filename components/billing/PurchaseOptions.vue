<template>
  <div class="space-y-6 p-4 border rounded-lg shadow-sm">
    <h2 class="text-xl font-medium">Choose Your Plan</h2>

    <!-- Option Selection -->
    <!-- Now only shows the monthly subscription option -->
    <RadioGroup v-model="selectedOption" :disabled="isLoading || isProcessingPayment || isLoadingPrices">
      <div class="grid grid-cols-1 gap-4">
        <!-- Monthly Subscription Option -->
        <Label
          for="monthly-subscription"
          :class="[
            'flex flex-col items-start p-4 border rounded-md cursor-pointer transition-colors',
            selectedOption === 'monthly' ? 'bg-primary/10 border-primary ring-2 ring-primary' : 'hover:bg-muted/50',
            (isLoading || isProcessingPayment || isLoadingPrices) ? 'opacity-50 cursor-not-allowed' : ''
          ]"
        >
           <div class="flex items-center justify-between w-full mb-2">
            <span class="font-semibold">Monthly Subscription</span>
            <!-- Ensure RadioGroupItem value matches selectedOption state -->
            <RadioGroupItem id="monthly-subscription" value="monthly" />
          </div>
          <p class="text-sm text-muted-foreground mb-1">Create unlimited elections.</p>
           <!-- Display Fetched Price -->
          <p class="text-lg font-semibold" v-if="monthlyPriceDetails">{{ monthlyPriceDetails.formatted }}</p>
          <p class="text-lg font-semibold animate-pulse" v-else-if="isLoadingPrices">Loading...</p> <!-- Loading state -->
           <p class="text-sm text-destructive" v-else>Price unavailable</p> <!-- Error state -->

           <p class="text-xs text-muted-foreground">(Billed monthly)</p>
        </Label>
      </div>
    </RadioGroup>

    <!-- Stripe Payment Element Container -->
    <!-- Conditionally rendered only when a client secret exists -->
    <div v-if="stripeClientSecret" id="payment-element-purchase" class="py-4 border-t mt-4 pt-4">
      <p class="text-sm font-medium mb-2">Enter Payment Details:</p>
      <!-- Stripe Elements will mount here -->
    </div>

    <!-- Error Display -->
    <div v-if="paymentError" class="text-destructive text-sm mt-4">{{ paymentError }}</div>

    <!-- Action Button -->
    <div class="flex justify-end pt-4 border-t">
      <div class="flex gap-2">
        <!-- Delete Subscription Button (only shown when an incomplete subscription might exist) -->
        <Button 
          v-if="stripeClientSecret"
          @click="deleteIncompleteSubscription"
          variant="destructive"
          size="sm"
          :disabled="isDeletingSubscription"
        >
          <span v-if="isDeletingSubscription">Deleting...</span>
          <span v-else>Delete Incomplete Subscription</span>
        </Button>
        
        <!-- Main Action Button -->
        <Button 
          @click="handlePurchaseAction"
          :disabled="isLoading || isProcessingPayment || !selectedOption || isDeletingSubscription"
        >
          <span v-if="isLoading">Preparing...</span>
          <span v-else-if="isProcessingPayment">Processing Payment...</span>
          <span v-else-if="!stripeClientSecret">Proceed to Payment</span>
          <span v-else>Confirm Purchase</span>
        </Button>
      </div>
    </div>

  </div>
   <!-- Alert Dialog for Success/Error Messages -->
  <AlertDialog :open="isAlertOpen" @update:open="isAlertOpen = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ alertTitle }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ alertMessage }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction @click="isAlertOpen = false">OK</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { loadStripe } from '@stripe/stripe-js';
import axios from '~/src/utils/axios'; 
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const props = defineProps({
  groupId: {
    type: [String, Number],
    required: true
  }
});

// --- State ---
// selectedOption defaults to 'monthly' since it's the only option
const selectedOption = ref('monthly'); 
const isLoading = ref(false);
const isProcessingPayment = ref(false);
const stripeClientSecret = ref(null);
const paymentError = ref(null);
const stripe = ref(null);
const elements = ref(null);
const isDeletingSubscription = ref(false);

// Alert Dialog State
const isAlertOpen = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')

// --- New State for Prices ---
const isLoadingPrices = ref(false);
const priceFetchError = ref(null);
// Removed singlePriceDetails
// const singlePriceDetails = ref(null);
const monthlyPriceDetails = ref(null);

// --- Stripe Setup ---
const stripePublishableKey = 'pk_test_51RLFlZH0qQW9H6xGryuJv11JK97ZRYPlu0PH3efCPnt8NGGDU5v4K9iYzjXfCi8qnBzhqK3g2y7F7VyZz6lVvCrH00XUqBQyfS'; 
// Removed singleElectionPriceId
// const singleElectionPriceId = 'price_1RLQdbH0qQW9H6xGhoNW5Bfw'; 
const monthlySubscriptionPriceId = 'price_1RLQb4H0qQW9H6xGYOaHK6Cu'; 

const stripePromise = loadStripe(stripePublishableKey);

onMounted(async () => {
  stripe.value = await stripePromise;
  await fetchPriceDetails(); // Fetch prices when component mounts
  // Since 'monthly' is the only option, maybe auto-initiate payment?
  // Consider UX implications before doing this.
  // if (monthlyPriceDetails.value) { 
  //    await initiatePayment(); 
  // } 
});

// --- Methods ---
function showAlert(title, message) {
  alertTitle.value = title
  alertMessage.value = message
  isAlertOpen.value = true
}

// Watcher for selectedOption might not be needed anymore if it defaults to 'monthly'
// and never changes. Removing it for now.
// watch(selectedOption, (newVal, oldVal) => {
//   if (stripeClientSecret.value && newVal !== oldVal) {
//       stripeClientSecret.value = null;
//       paymentError.value = null;
//       elements.value = null; 
//   }
// });

async function handlePurchaseAction() {
  // Since 'monthly' is pre-selected, no need to check !selectedOption.value
  if (!stripeClientSecret.value) {
    await initiatePayment();
  } else {
    await confirmPayment();
  }
}

async function fetchPriceDetails() {
  isLoadingPrices.value = true;
  priceFetchError.value = null;
  // Removed singlePriceDetails assignment
  // singlePriceDetails.value = null;
  monthlyPriceDetails.value = null;
  try {
    console.log('Fetching price details from /api/payments/prices...');
    const response = await axios.get('/api/payments/prices');
    const prices = response.data;
    console.log('Received price details:', prices);

    // Only check for monthly price
    if (prices[monthlySubscriptionPriceId]) {
      monthlyPriceDetails.value = prices[monthlySubscriptionPriceId];
    } else {
      console.error(`Price details not found for monthly subscription ID: ${monthlySubscriptionPriceId}`);
      throw new Error('Could not load subscription price details.');
    }

  } catch (err) {
    console.error("Error fetching price details:", err);
    priceFetchError.value = `Failed to load prices: ${err.response?.data?.error || err.message}`;
  } finally {
    isLoadingPrices.value = false;
  }
}

async function initiatePayment() {
  // Removed check for selectedOption, assuming 'monthly'
  if (isLoading.value) return;

  isLoading.value = true;
  paymentError.value = null;
  stripeClientSecret.value = null; 

  // priceId is now always the monthly one
  const priceId = monthlySubscriptionPriceId; 

  try {
    console.log(`Initiating payment for group ${props.groupId} with price ${priceId}`);
    
    const response = await axios.post('/api/payments/prepare-purchase', {
      priceId: priceId,
      groupId: props.groupId 
    });

    if (!response.data.clientSecret) {
      throw new Error('Missing client_secret from server.');
    }

    stripeClientSecret.value = response.data.clientSecret;

    await nextTick(); 
    
    elements.value = stripe.value.elements({ clientSecret: stripeClientSecret.value });
    const paymentElement = elements.value.create('payment');
    paymentElement.mount('#payment-element-purchase');
    
    // Set isLoading to false after mounting the payment element
    isLoading.value = false;

  } catch (err) {
    console.error("Error initiating payment:", err);
    paymentError.value = `Failed to prepare payment: ${err.response?.data?.error || err.message}`;
    isLoading.value = false; 
    showAlert('Payment Error', paymentError.value);
  }
}

async function confirmPayment() {
  if (!elements.value || isProcessingPayment.value) return;

  isProcessingPayment.value = true;
  paymentError.value = null;

  try {
    const { error, paymentIntent } = await stripe.value.confirmPayment({
      elements: elements.value,
      confirmParams: {
        // IMPORTANT: setup_future_usage must be set when creating the PaymentIntent on the backend,
        // not during confirmation. Setting it here will cause an IntegrationError.
        // The backend sets this with SetupFutureUsage: "off_session" in the PaymentIntent creation.
        return_url: `${window.location.origin}/group/${props.groupId}?refresh_subscription=true`,
      },
    });

    if (error) {
      // Handle errors from Stripe.js (e.g., card declined)
      console.error("Stripe confirmPayment error:", error);
      // Use error.message - more user friendly than error.type
      paymentError.value = error.message || "An unexpected payment error occurred.";
      showAlert('Payment Failed', paymentError.value);
      // Only reset processing state on actionable error for user
      isProcessingPayment.value = false; 
    } else {
      // Payment succeeded (or requires further action like 3DS)
      console.log("PaymentIntent Status:", paymentIntent.status);
      if (paymentIntent.status === 'succeeded') {
        showAlert('Payment Successful!', 'Your subscription has been activated.');
        // Optionally, redirect or update UI based on success
        // Reset state after showing success alert
        // Note: isProcessingPayment remains true until alert is dismissed
        // Consider resetting state AFTER alert dismissal or navigation.
        stripeClientSecret.value = null; // Reset to hide payment element

      } else if (paymentIntent.status === 'processing') {
         // Inform the user the payment is processing
         showAlert('Payment Processing', 'Your payment is processing. We will update your subscription status soon.');
         // Keep processing state active
      } else if (paymentIntent.status === 'requires_payment_method') {
         // Likely an issue with the payment method during confirmation
         paymentError.value = "Payment failed. Please try another payment method.";
         showAlert('Payment Failed', paymentError.value);
         isProcessingPayment.value = false; 
      } else if (paymentIntent.status === 'requires_action') {
        // Redirects for 3D Secure will be handled by Stripe.js automatically
        // if using payment elements. No explicit handling needed here usually.
         console.log('Payment requires further action (e.g., 3D Secure).');
         // Keep processing state active while Stripe handles the redirect/modal
      } else {
        paymentError.value = `Unexpected payment status: ${paymentIntent.status}`;
        showAlert('Payment Status Unknown', paymentError.value);
        isProcessingPayment.value = false; 
      }
    }
  } catch (err) {
    // Catch any unexpected errors during the confirmation process
    console.error("Unexpected error during payment confirmation:", err);
    paymentError.value = "An unexpected error occurred during payment confirmation.";
    showAlert('Error', paymentError.value);
    isProcessingPayment.value = false; // Reset processing state on unexpected error
  }
  // Do NOT reset isProcessingPayment here if payment is successful/processing/requires_action,
  // only on failure states where the user needs to retry.
}

async function deleteIncompleteSubscription() {
  if (isDeletingSubscription.value) return;
  
  isDeletingSubscription.value = true;
  
  try {
    // Send a PUT request to update the group with null subscription fields
    const response = await axios.put(`/api/groups/${props.groupId}`, {
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null,
      subscription_price_id: null,
      subscription_current_period_end: null
    });
    
    console.log("Subscription deleted successfully:", response.data);
    showAlert('Subscription Deleted', 'The incomplete subscription has been deleted successfully.');
    
    // Reset the payment flow state
    stripeClientSecret.value = null;
    elements.value = null;
    
  } catch (err) {
    console.error("Error deleting subscription:", err);
    showAlert('Error', `Failed to delete subscription: ${err.response?.data?.error || err.message}`);
  } finally {
    isDeletingSubscription.value = false;
  }
}

</script>

<style scoped>
/* Add any specific styles if needed */
</style> 
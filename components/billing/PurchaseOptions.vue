<template>
  <div class="space-y-6 p-4 border rounded-lg shadow-sm">
    <h2 class="text-xl font-medium">Choose Your Plan</h2>

    <!-- Option Selection -->
    <RadioGroup v-model="selectedOption" :disabled="isLoading || isProcessingPayment">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Single Election Option -->
        <Label
          for="single-election"
          :class="[
            'flex flex-col items-start p-4 border rounded-md cursor-pointer transition-colors',
            selectedOption === 'single' ? 'bg-primary/10 border-primary ring-2 ring-primary' : 'hover:bg-muted/50',
            (isLoading || isProcessingPayment) ? 'opacity-50 cursor-not-allowed' : ''
          ]"
        >
          <div class="flex items-center justify-between w-full mb-2">
            <span class="font-semibold">Single Election Purchase</span>
            <RadioGroupItem id="single-election" value="single" />
          </div>
          <p class="text-sm text-muted-foreground mb-1">Pay per election you create.</p>
          <p class="text-lg font-semibold">$5.00</p> 
          <p class="text-xs text-muted-foreground">(One-time payment per vote)</p>
        </Label>

        <!-- Monthly Subscription Option -->
        <Label
          for="monthly-subscription"
          :class="[
            'flex flex-col items-start p-4 border rounded-md cursor-pointer transition-colors',
            selectedOption === 'monthly' ? 'bg-primary/10 border-primary ring-2 ring-primary' : 'hover:bg-muted/50',
            (isLoading || isProcessingPayment) ? 'opacity-50 cursor-not-allowed' : ''
          ]"
        >
           <div class="flex items-center justify-between w-full mb-2">
            <span class="font-semibold">Monthly Subscription</span>
            <RadioGroupItem id="monthly-subscription" value="monthly" />
          </div>
          <p class="text-sm text-muted-foreground mb-1">Create unlimited elections.</p>
          <p class="text-lg font-semibold">$20.00 / month</p>
           <p class="text-xs text-muted-foreground">(Billed monthly)</p>
        </Label>
      </div>
    </RadioGroup>

    <!-- Stripe Payment Element Container -->
    <div v-if="stripeClientSecret" id="payment-element-purchase" class="py-4 border-t mt-4 pt-4">
      <p class="text-sm font-medium mb-2">Enter Payment Details:</p>
      <!-- Stripe Elements will mount here -->
    </div>

    <!-- Error Display -->
    <div v-if="paymentError" class="text-destructive text-sm mt-4">{{ paymentError }}</div>

    <!-- Action Button -->
    <div class="flex justify-end pt-4 border-t">
       <Button 
          @click="handlePurchaseAction"
          :disabled="isLoading || isProcessingPayment || !selectedOption"
        >
          <span v-if="isLoading">Preparing...</span>
          <span v-else-if="isProcessingPayment">Processing Payment...</span>
          <span v-else-if="!stripeClientSecret">Proceed to Payment</span>
          <span v-else>Confirm Purchase</span>
        </Button>
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
const selectedOption = ref(null); // 'single' or 'monthly'
const isLoading = ref(false);
const isProcessingPayment = ref(false);
const stripeClientSecret = ref(null);
const paymentError = ref(null);
const stripe = ref(null);
const elements = ref(null);

// Alert Dialog State
const isAlertOpen = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')

// --- Stripe Setup ---
// IMPORTANT: Replace with your actual keys and Price IDs from your Stripe dashboard
const stripePublishableKey = 'pk_test_YOUR_PUBLISHABLE_KEY'; 
const singleElectionPriceId = 'price_YOUR_SINGLE_ELECTION_PRICE_ID';
const monthlySubscriptionPriceId = 'price_YOUR_MONTHLY_SUBSCRIPTION_PRICE_ID';

const stripePromise = loadStripe(stripePublishableKey);

onMounted(async () => {
  stripe.value = await stripePromise;
  // TODO: Optionally fetch current subscription status for the group/user
  // to potentially pre-select 'monthly' or disable options.
});

// --- Methods ---
function showAlert(title, message) {
  alertTitle.value = title
  alertMessage.value = message
  isAlertOpen.value = true
}

watch(selectedOption, (newVal, oldVal) => {
  // Reset payment state if the option changes after payment element is shown
  if (stripeClientSecret.value && newVal !== oldVal) {
      stripeClientSecret.value = null;
      paymentError.value = null;
      // Destroy previous elements instance if needed (optional, Stripe might handle it)
      elements.value = null; 
  }
});

async function handlePurchaseAction() {
  if (!selectedOption.value) return;

  if (!stripeClientSecret.value) {
    await initiatePayment();
  } else {
    await confirmPayment();
  }
}

async function initiatePayment() {
  if (!selectedOption.value || isLoading.value) return;

  isLoading.value = true;
  paymentError.value = null;
  stripeClientSecret.value = null; // Clear previous state

  const priceId = selectedOption.value === 'single' 
                    ? singleElectionPriceId 
                    : monthlySubscriptionPriceId;

  try {
    console.log(`Initiating payment for group ${props.groupId} with price ${priceId}`);
    
    // Call backend to create PaymentIntent or Subscription setup
    const response = await axios.post('/api/payments/prepare-purchase', { // Use a dedicated endpoint
      priceId: priceId,
      groupId: props.groupId 
    });

    if (!response.data.clientSecret) {
      throw new Error('Missing client_secret from server.');
    }

    stripeClientSecret.value = response.data.clientSecret;

    // Initialize Stripe Elements
    await nextTick(); // Ensure the #payment-element-purchase div exists
    
    elements.value = stripe.value.elements({ clientSecret: stripeClientSecret.value });
    const paymentElement = elements.value.create('payment');
    paymentElement.mount('#payment-element-purchase');

  } catch (err) {
    console.error("Error initiating payment:", err);
    paymentError.value = `Failed to prepare payment: ${err.response?.data?.error || err.message}`;
    showAlert('Payment Setup Error', paymentError.value);
  } finally {
    isLoading.value = false;
  }
}

async function confirmPayment() {
  if (!stripe.value || !elements.value || isProcessingPayment.value) {
    paymentError.value = "Payment system not ready or already processing.";
    return;
  }

  isProcessingPayment.value = true;
  paymentError.value = null;

  // Define the return_url: Where Stripe redirects after authentication (if needed)
  // This page should check the status of the PaymentIntent/SetupIntent
  const returnUrl = `${window.location.origin}/group/${props.groupId}/purchase?status=complete`; 

  try {
    // Confirmation depends on whether it's a one-time or subscription setup
    let error;
    if (selectedOption.value === 'single') {
        // Confirm PaymentIntent for one-time purchase
        ({ error } = await stripe.value.confirmPayment({
            elements: elements.value,
            confirmParams: {
                return_url: returnUrl,
            },
            redirect: 'if_required' // Handle result directly if no redirect needed
        }));
    } else { // Monthly subscription
        // Confirm SetupIntent associated with the subscription
        // The backend should ideally return a SetupIntent client_secret for subscriptions
        // OR confirm the PaymentIntent of the first invoice.
        // Assuming confirmPayment works for the first invoice's PI:
         ({ error } = await stripe.value.confirmPayment({ // Adjust if using confirmSetup
            elements: elements.value,
            confirmParams: {
                return_url: returnUrl,
            },
            redirect: 'if_required'
        }));
    }

    if (error) {
      // Handle immediate errors (e.g., invalid card details, declined)
      console.error("Stripe confirmation error:", error);
      paymentError.value = error.message || "An unexpected payment error occurred.";
      showAlert('Payment Failed', paymentError.value);
      isProcessingPayment.value = false; // Re-enable button
    } else {
      // Payment submitted, potentially processing or succeeded immediately.
      // If redirect: 'if_required' was used and no redirect happened, it succeeded.
      console.log("Payment/Setup submitted or succeeded. Waiting for server confirmation via webhook or redirect.");
      // Show success message (can be improved by checking status on returnUrl)
      showAlert('Payment Processing', 'Your payment is being processed. You might be redirected.');
      // Don't reset processing flag here if redirect might happen
      // isProcessingPayment.value = false; 
    }
  } catch (err) {
      console.error("Exception during confirmPayment:", err);
      paymentError.value = "A critical error occurred during payment processing.";
      showAlert('Payment Error', paymentError.value);
      isProcessingPayment.value = false;
  }
}

</script>

<style scoped>
/* Add any specific styles if needed */
</style> 
<template>
  <div class="space-y-6 p-4 border rounded-lg shadow-sm">
    <h2 class="text-xl font-medium">Choose Your Plan</h2>

    <!-- Option Selection -->
    <!-- Now only shows the monthly subscription option -->
    <RadioGroup v-model="selectedOption" :disabled="isLoading || isProcessingPayment || isLoadingPrices || !isCurrentUserAdmin">
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

    <!-- Non-admin notice for purchase options -->
    <div v-if="!isCurrentUserAdmin" class="bg-muted p-4 rounded-lg mb-4 border border-border">
      <div class="flex items-center">
        <Info class="h-5 w-5 text-muted-foreground mr-2" />
        <p class="text-sm text-muted-foreground">Only group administrators can manage subscriptions.</p>
      </div>
    </div>

    <!-- Action Button -->
    <div class="flex justify-end pt-4 border-t">
      <div class="flex gap-2">
        <!-- Delete Subscription Button (only shown when an incomplete subscription might exist) -->
        <Button 
          v-if="stripeClientSecret"
          @click="deleteIncompleteSubscription"
          variant="destructive"
          size="sm"
          :disabled="isDeletingSubscription || !isCurrentUserAdmin"
        >
          <span v-if="isDeletingSubscription">Deleting...</span>
          <span v-else>Delete Incomplete Subscription</span>
        </Button>
        
        <!-- Main Action Button -->
        <Button 
          @click="handlePurchaseAction"
          :disabled="isLoading || isProcessingPayment || !selectedOption || isDeletingSubscription || !isCurrentUserAdmin"
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
import { useNuxtApp } from '#app';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Info } from 'lucide-vue-next';
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
  },
  isCurrentUserAdmin: {
    type: Boolean,
    default: false
  }
});

const { $axiosInstance } = useNuxtApp();

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
    const response = await $axiosInstance.get('/api/payments/prices');
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
    
    const response = await $axiosInstance.post('/api/payments/prepare-purchase', {
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
        return_url: `${window.location.origin}/group/${props.groupId}?payment_success=true&option=${selectedOption.value}`,
      },
      redirect: 'if_required' 
    });

    if (error) {
      paymentError.value = error.message;
      showAlert('Payment Failed', error.message);
      isProcessingPayment.value = false;
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      console.log('Payment Succeeded:', paymentIntent);
      showAlert('Payment Successful', 'Your purchase was successful! Your group features will be updated shortly.');
      // You might want to redirect or refresh data here
      // e.g., router.push(`/group/${props.groupId}?payment_confirmed=true`);
      // Or emit an event to parent to refresh group data
      // emit('payment-successful');
      
       // Reset payment UI
      stripeClientSecret.value = null;
      
      // Adding a small delay then reloading to see updated subscription status
      setTimeout(() => {
        window.location.href = `/group/${props.groupId}?refresh_subscription=true&settings_subtab=billing`;
      }, 2000); // 2 second delay

    } else if (paymentIntent && paymentIntent.status === 'processing') {
      showAlert('Payment Processing', 'Your payment is processing. We will update you when it is complete.');
    } else if (paymentIntent) {
       showAlert('Payment Status', `Payment status: ${paymentIntent.status}. Please check your payment provider or contact support if issues persist.`);
    } else {
      showAlert('Payment Error', 'An unexpected issue occurred with the payment.');
    }
    isProcessingPayment.value = false;
  } catch (err) {
    console.error("Unexpected error during payment confirmation:", err);
    paymentError.value = "An unexpected error occurred during payment confirmation.";
    showAlert('Error', paymentError.value);
    isProcessingPayment.value = false;
  }
}

async function deleteIncompleteSubscription() {
  if (isDeletingSubscription.value) return;
  
  isDeletingSubscription.value = true;
  
  try {
    // Make an API call to your backend to clear the subscription fields for the group
    await $axiosInstance.put(`/api/groups/${props.groupId}/clear-subscription`);
    
    showAlert('Subscription Cleared', 'The incomplete subscription has been cleared. You can try purchasing again.');
    
    // Reset local state
    stripeClientSecret.value = null;
    paymentError.value = null;
    // Reload the page or relevant component part to reflect changes
    window.location.reload(); 

  } catch (err) {
    console.error("Error clearing incomplete subscription:", err);
    showAlert('Error', `Failed to clear subscription: ${err.response?.data?.error || err.message}`);
  } finally {
    isDeletingSubscription.value = false;
  }
}

</script>

<style scoped>
/* Add any specific styles if needed */
</style> 
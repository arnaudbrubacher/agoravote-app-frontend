<template>
  <div class="space-y-6">    
    <!-- Invoices Section -->
    <div class="border rounded-lg p-4">
      <h3 class="text-lg font-medium mb-3">Billing History</h3>
      
      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      
      <div v-else-if="invoices.length === 0 && !subscriptionHistory.length" class="text-center py-8 text-muted-foreground">
        No billing history available
      </div>
      
      <div v-else class="space-y-4">
        <!-- Subscription History Section -->
        <div v-if="subscriptionHistory.length > 0" class="mb-6">
          <h4 class="text-md font-medium mb-3">Subscription Changes</h4>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left pb-2">Date</th>
                  <th class="text-left pb-2">Event</th>
                  <th class="text-left pb-2">Status</th>
                  <th class="text-left pb-2">Subscription ID</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in subscriptionHistory" :key="record.id" class="border-b">
                  <td class="py-3">{{ formatDate(record.created_at) }}</td>
                  <td class="py-3 capitalize">{{ record.event }}</td>
                  <td class="py-3">
                    <Badge v-if="record.status === 'active'" class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </Badge>
                    <Badge v-else-if="record.status === 'canceled'" class="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      Canceled
                    </Badge>
                    <Badge v-else class="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {{ record.status || 'Unknown' }}
                    </Badge>
                  </td>
                  <td class="py-3 font-mono text-xs">{{ truncateId(record.stripe_subscription_id) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Invoices Table -->
        <div v-if="invoices.length > 0">
          <h4 class="text-md font-medium mb-3">Payment History</h4>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left pb-2">Date</th>
                  <th class="text-left pb-2">Description</th>
                  <th class="text-right pb-2">Amount</th>
                  <th class="text-right pb-2">Status</th>
                  <th class="text-right pb-2">Invoice</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="invoice in invoices" :key="invoice.id" class="border-b">
                  <td class="py-3">{{ formatDate(invoice.created_at) }}</td>
                  <td class="py-3">{{ invoice.description }}</td>
                  <td class="py-3 text-right">{{ invoice.formatted }}</td>
                  <td class="py-3 text-right">
                    <Badge v-if="invoice.status === 'paid'" class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Paid
                    </Badge>
                    <Badge v-else-if="invoice.status === 'open'" class="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Pending
                    </Badge>
                    <Badge v-else class="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {{ invoice.status }}
                    </Badge>
                  </td>
                  <td class="py-3 text-right">
                    <a 
                      v-if="invoice.url" 
                      :href="invoice.url" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      class="text-primary hover:underline"
                    >
                      View
                    </a>
                    <span v-else class="text-muted-foreground">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'
import { Badge } from '@/components/ui/badge'

const props = defineProps({
  groupId: {
    type: [String, Number],
    required: true
  }
})

const { $axiosInstance } = useNuxtApp()

const isLoading = ref(true)
const error = ref(null)
const subscription = ref(null)
const invoices = ref([])
const subscriptionHistory = ref([])

onMounted(async () => {
  await fetchBillingHistory()
})

async function fetchBillingHistory() {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await $axiosInstance.get(`/api/payments/billing-history/${props.groupId}`)
    
    subscription.value = response.data.subscription
    invoices.value = response.data.invoices || []
    subscriptionHistory.value = response.data.history || []
    
    console.log('Billing history:', response.data)
  } catch (err) {
    console.error('Error fetching billing history:', err)
    error.value = err.response?.data?.error || err.message
  } finally {
    isLoading.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date)
  } catch (e) {
    console.error('Error formatting date:', e)
    return dateString
  }
}

// Helper function to truncate long IDs for better display
function truncateId(id) {
  if (!id) return '';
  if (id.length <= 12) return id;
  return id.substring(0, 8) + '...' + id.substring(id.length - 4);
}
</script> 
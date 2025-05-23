<template>
  <div class="container mx-auto p-6">
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center mb-6">
        <Search class="mr-2 h-6 w-6" />
        <h1 class="text-2xl font-semibold">Find Group</h1>
      </div>
      <p class="text-muted-foreground mb-6">
        Search for public groups to join. Private groups are not shown in search results.
      </p>
      
      <div class="space-y-4 py-4">
        <!-- Search Input -->
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            type="text"
            placeholder="Search for public groups..."
            class="w-full pl-10 pr-4"
            @input="debounceSearch"
          />
        </div>

        <!-- Search results -->
        <div v-if="isSearching" class="text-center py-8">
          <Loader2 class="h-8 w-8 animate-spin mx-auto text-primary" />
          <span class="text-sm text-muted-foreground mt-2 block">Searching...</span>
        </div>

        <div v-else-if="searchResults.length > 0" class="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto py-4">
          <div v-for="group in searchResults" :key="group.id">
            <GroupCard 
              :group="group" 
              :showActions="true"
              :clickable="false"
              @click="viewGroup(group.id)"
            >
              <template #actions>
                <Button 
                  v-if="!isUserInGroup(group.id)"
                  variant="default" 
                  size="sm"
                  @click.stop="openAdmissionForm(group)"
                >
                  Join
                </Button>

                <Button 
                  v-else
                  variant="secondary" 
                  size="sm"
                  disabled
                >
                  Joined
                </Button>
              </template>
            </GroupCard>
          </div>
        </div>

        <div v-else-if="searchQuery && !isSearching" class="text-center py-8 text-muted-foreground">
          No groups found matching your search.
        </div>

        <div v-else class="text-center py-8 text-muted-foreground">
          Type to search for public groups.
        </div>
      </div>
    </div>
  </div>
  
  <!-- Group Admission Form Dialog (kept as a dialog for now) -->
  <GroupAdmissionForm
    v-if="showAdmissionForm"
    :group="selectedGroup"
    :error="admissionError"
    @close="showAdmissionForm = false"
    @submit="handleAdmissionSubmit"
  />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import GroupCard from '@/components/groups/GroupCard.vue'
import GroupAdmissionForm from '@/components/groups/GroupAdmissionForm.vue' // Assuming this stays a dialog
import { useAlert } from '@/composables/useAlert'
import { useNuxtApp } from '#app'

definePageMeta({
  layout: 'app-layout',
  middleware: ['auth']
})

const { $axiosInstance } = useNuxtApp()
const router = useRouter()
const { alert } = useAlert()

// Search state
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
let searchTimeout = null

// User's groups state (to check if already a member)
const userGroups = ref([])
const isLoadingUserGroups = ref(false)

// Group admission state
const showAdmissionForm = ref(false)
const selectedGroup = ref(null)
const admissionError = ref('')

// Fetch user's groups on mount
const fetchUserGroups = async () => {
  isLoadingUserGroups.value = true;
  try {
    // Assuming an endpoint to get the current user's groups
    const response = await $axiosInstance.get('/groups/user-groups'); 
    userGroups.value = response.data || [];
  } catch (error) {
    console.error('Failed to fetch user groups:', error);
    userGroups.value = []; // Set to empty on error
  } finally {
    isLoadingUserGroups.value = false;
  }
}

onMounted(() => {
  fetchUserGroups();
})

// Debounce search function
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  if (searchQuery.value.trim() === '') {
    searchResults.value = []
    isSearching.value = false;
    return
  }
  
  isSearching.value = true; // Show loader immediately on input
  searchTimeout = setTimeout(() => {
    searchGroups()
  }, 600) // Slightly increased debounce
}

// Search for groups
const searchGroups = async () => {
  if (searchQuery.value.trim() === '') {
    searchResults.value = []
    isSearching.value = false;
    return
  }
  
  // isSearching is already true from debounceSearch
  try {
    const response = await $axiosInstance.get(`/groups/search?query=${encodeURIComponent(searchQuery.value)}&public_only=true`)
    searchResults.value = response.data.groups || []
  } catch (error) {
    console.error('Failed to search groups:', error)
    searchResults.value = []
    alert('Error searching groups', error.response?.data?.error || 'Could not connect to server.')
  } finally {
    isSearching.value = false
  }
}

// Check if user is in a group
const isUserInGroup = (groupId) => {
  return userGroups.value.some(g => g.id === groupId)
}

// Navigate to view group (if this was a feature, otherwise remove or adapt)
const viewGroup = (groupId) => {
  router.push(`/group/${groupId}`)
}

// Group admission methods
const openAdmissionForm = (group) => {
  selectedGroup.value = group
  showAdmissionForm.value = true
  admissionError.value = ''
}

const handleAdmissionSubmit = async (admissionData) => {
  try {
    if (!selectedGroup.value) return;

    if (admissionData.handledMessage) {
      showAdmissionForm.value = false;
      await fetchUserGroups(); // Refresh user's groups
      window.dispatchEvent(new CustomEvent('group-data-updated', { detail: { groupId: selectedGroup.value.id, isJoinRequest: true, status: admissionData.status || 'pending' } }));
      return;
    }
    
    const response = await $axiosInstance.post(`/groups/${selectedGroup.value.id}/join`, admissionData);
    const successMessage = response.data?.message || 'Request processed successfully';
    const status = response.data?.status || 'pending';
    
    showAdmissionForm.value = false;
    alert(successMessage);
    
    await fetchUserGroups(); // Refresh user's groups
    
    window.dispatchEvent(new CustomEvent('group-data-updated', {
      detail: {
        groupId: selectedGroup.value.id,
        isJoinRequest: true,
        status: status
      }
    }));
    
    if (status === 'approved') {
      router.push(`/group/${selectedGroup.value.id}`);
    }
  } catch (error) {
    console.error('Failed to join group:', error);
    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Unknown error';
    admissionError.value = errorMessage; // For the form
    if (!(error.response?.status === 401 || (error.response?.status === 400 && errorMessage.includes('password')))) {
       alert('Failed to join group: ' + errorMessage); // General alert for other errors
    }
  }
}

// Watch for search query changes to clear results if empty
watch(searchQuery, (newValue) => {
  if (newValue.trim() === '') {
    searchResults.value = []
    isSearching.value = false;
  }
})
</script>

<style scoped>
/* Add any page-specific styles if needed */
</style> 
import { ref } from 'vue'
// import axios from '~/src/utils/axios' // REMOVED OLD AXIOS IMPORT
import { useNuxtApp } from '#app'

export function useGroupVotes(groupId) {
  const votes = ref([])
  const isLoadingVotes = ref(true)
  const isLoadingDetails = ref(false)
  const selectedVote = ref(null)

  // Helper function to get axios instance
  const getAxiosInstance = () => {
    if (process.client) {
      const { $axiosInstance } = useNuxtApp()
      if ($axiosInstance) {
        return $axiosInstance
      }
    }
    throw new Error('Axios instance not available')
  }

  // Fetch all votes for the group
  const fetchVotes = async () => {
    try {
      isLoadingVotes.value = true
      // Re-enable the API call
      const response = await getAxiosInstance().get(`/api/groups/${groupId}/votes`)
      // Ensure we correctly access the votes array from the response
      // (Backend returns { "votes": [...] })
      votes.value = response.data.votes || []
      console.log("Fetched votes:", votes.value)
      // Remove temporary disabling logic
      // votes.value = []
      // console.log("Vote fetching is temporarily disabled - backend endpoint not implemented yet")
      // return votes.value
    } catch (error) {
      console.error('Failed to fetch votes:', error)
      // alert('Failed to fetch votes')
      throw error
    } finally {
      isLoadingVotes.value = false
    }
  }

  // Fetch detailed information for a single vote (including eligibility)
  const fetchVoteDetails = async (voteId) => {
    try {
      isLoadingDetails.value = true;
      console.log(`[useGroupVotes.js] fetchVoteDetails starting for vote ID: ${voteId}`);
      const response = await getAxiosInstance().get(`/api/votes/${voteId}`);
      console.log(`[useGroupVotes.js] fetchVoteDetails successful for ${voteId}:`, response.data);
      
      return response.data; 
    } catch (error) {
      console.error(`[useGroupVotes.js] fetchVoteDetails FAILED for vote ${voteId}:`, error);
      // alert(`Failed to load vote details: ${error.response?.data?.error || error.message}`);
      // Still return null or throw error so the caller knows it failed
      throw error; // Rethrowing allows the caller to handle the error UI
      // return null; 
    } finally {
      isLoadingDetails.value = false;
    }
  };

  // Create a new vote
  const createNewVote = async (data) => {
    try {
      // Format the data for the API
      const formattedData = {
        title: data.title,
        question: data.question,
        choices: data.choices.map(choice => ({ text: choice.text })),
        isSecret: data.isSecret,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString()
      }
      
      // Create vote
      const response = await getAxiosInstance().post(`/api/groups/${groupId}/votes`, formattedData)
      
      // Add new vote to the list or refresh the list
      await fetchVotes()
      
      return response.data
    } catch (err) {
      console.error('Failed to create vote:', err)
      console.error('Error details:', err.response?.data)
      throw err
    }
  }

  // Open vote details dialog by fetching full data
  const openVoteDetails = async (voteId) => {
    console.log(`[useGroupVotes.js] openVoteDetails starting for vote ID: ${voteId}`);
    // Set a temporary value to indicate which vote is being loaded and trigger dialog opening
    selectedVote.value = { id: voteId }; 
    // isLoadingDetails is set inside fetchVoteDetails
    
    const detailedVoteData = await fetchVoteDetails(voteId);
    
    if (detailedVoteData) {
      // Update selectedVote with the full data once fetched
      selectedVote.value = detailedVoteData; 
      console.log('[useGroupVotes.js] Selected vote set with detailed data:', selectedVote.value);
    } else {
      // Fetch failed, clear selectedVote to close the dialog or indicate error
      selectedVote.value = null; 
      console.error('[useGroupVotes.js] Could not set selectedVote because details failed to load.');
      // Keep the alert from fetchVoteDetails
    }
  }

  // Submit a vote
  const handleVoteSubmit = async (voteData) => {
    try {
      if (!selectedVote.value) {
        throw new Error('No vote selected')
      }
      
      // Call API to submit the vote
      const response = await getAxiosInstance().post(`/api/votes/${selectedVote.value.id}/cast`, voteData)
      
      // Close dialog
      selectedVote.value = null
      
      // Refresh votes
      await fetchVotes()
      
      return response.data
    } catch (err) {
      console.error('Failed to submit vote:', err)
      throw err
    }
  }

  // Delete a vote
  const deleteVote = async (voteId) => {
    try {
      // Confirmation is now handled in the UI component
      // if (!confirm('Are you sure you want to delete this vote?')) {
      //   return
      // }
      
      // Call API to delete the vote
      await getAxiosInstance().delete(`/api/votes/${voteId}`)
      
      // Close the dialog if it was open
      if (selectedVote.value?.id === voteId) {
        selectedVote.value = null
      }
      
      // Refresh votes list
      await fetchVotes()
      // Return something or nothing, just don't alert
    } catch (err) {
      console.error('Failed to delete vote:', err)
      throw err
    }
  }

  // Helper functions for vote status
  const isVoteActive = (vote) => {
    const now = new Date()
    return new Date(vote.start_time) <= now && new Date(vote.end_time) >= now
  }

  const isVoteUpcoming = (vote) => {
    const now = new Date()
    return new Date(vote.start_time) > now
  }

  // NEW: End a vote prematurely
  const endVoteEarly = async (voteId) => {
    try {
      console.log(`[useGroupVotes] Sending request to end vote ${voteId} early.`);
      const response = await getAxiosInstance().post(`/api/votes/${voteId}/end`);
      console.log(`[useGroupVotes] Vote ${voteId} ended successfully:`, response.data);
      return response.data; // Return data which might include updated vote status/end time
    } catch (err) {
      console.error(`[useGroupVotes] Failed to end vote ${voteId} early:`, err);
      // Rethrow or handle error as needed, maybe format it
      throw new Error(`Failed to end vote: ${err.response?.data?.error || err.message}`);
    }
  };

  // NEW: Tally and Decrypt a closed vote
  const tallyAndDecrypt = async (voteId) => {
    try {
      console.log(`[useGroupVotes] Sending request to tally and decrypt vote ${voteId}.`);
      // The backend endpoint handles both tallying and decryption in one call
      const response = await getAxiosInstance().post(`/api/votes/${voteId}/decrypt`);
      console.log(`[useGroupVotes] Vote ${voteId} tallied and decrypted successfully:`, response.data);
      // The response likely contains the plaintext tally results
      return response.data; 
    } catch (err) {
      console.error(`[useGroupVotes] Failed to tally/decrypt vote ${voteId}:`, err);
      throw new Error(`Failed to tally and decrypt vote: ${err.response?.data?.error || err.message}`);
    }
  };

  // Format date for display
  const formatDateShort = (dateStr) => {
    if (!dateStr) return 'N/A'
    
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date)
  }

  return {
    votes,
    isLoadingVotes,
    isLoadingDetails,
    selectedVote,
    fetchVotes,
    fetchVoteDetails,
    createNewVote,
    openVoteDetails,
    handleVoteSubmit,
    deleteVote,
    isVoteActive,
    isVoteUpcoming,
    formatDateShort,
    endVoteEarly,
    tallyAndDecrypt
  }
}
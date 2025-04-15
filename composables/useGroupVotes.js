import { ref } from 'vue'
import axios from '~/src/utils/axios'

export function useGroupVotes(groupId) {
  const votes = ref([])
  const isLoadingVotes = ref(true)
  const isLoadingDetails = ref(false)
  const selectedVote = ref(null)

  // Fetch all votes for the group
  const fetchVotes = async () => {
    try {
      isLoadingVotes.value = true
      // Re-enable the API call
      const response = await axios.get(`/groups/${groupId}/votes`)
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
      alert('Failed to fetch votes')
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
      const response = await axios.get(`/votes/${voteId}`);
      console.log(`[useGroupVotes.js] fetchVoteDetails successful for ${voteId}:`, response.data);
      return response.data; 
    } catch (error) {
      console.error(`[useGroupVotes.js] fetchVoteDetails FAILED for vote ${voteId}:`, error);
      alert(`Failed to load vote details: ${error.response?.data?.error || error.message}`);
      return null; 
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
      const response = await axios.post(`/groups/${groupId}/votes`, formattedData)
      
      // Add new vote to the list or refresh the list
      await fetchVotes()
      
      alert('Vote created successfully')
      
      return response.data
    } catch (err) {
      console.error('Failed to create vote:', err)
      console.error('Error details:', err.response?.data)
      alert('Failed to create vote: ' + (err.response?.data?.error || err.message))
      throw err
    }
  }

  // Open vote details dialog by fetching full data
  const openVoteDetails = async (voteId) => {
    console.log(`[useGroupVotes.js] openVoteDetails starting for vote ID: ${voteId}`);
    const detailedVoteData = await fetchVoteDetails(voteId);
    if (detailedVoteData) {
      selectedVote.value = detailedVoteData;
      console.log('[useGroupVotes.js] Selected vote set with detailed data:', selectedVote.value);
    } else {
      selectedVote.value = null;
      console.error('[useGroupVotes.js] Could not set selectedVote because details failed to load.');
    }
  }

  // Submit a vote
  const handleVoteSubmit = async (voteData) => {
    try {
      if (!selectedVote.value) {
        throw new Error('No vote selected')
      }
      
      // Call API to submit the vote
      const response = await axios.post(`/votes/${selectedVote.value.id}/cast`, voteData)
      
      alert('Vote submitted successfully')
      
      // Close dialog
      selectedVote.value = null
      
      // Refresh votes
      await fetchVotes()
      
      return response.data
    } catch (err) {
      console.error('Failed to submit vote:', err)
      alert('Failed to submit vote: ' + (err.response?.data?.error || err.message))
      throw err
    }
  }

  // Delete a vote
  const deleteVote = async (voteId) => {
    try {
      if (!confirm('Are you sure you want to delete this vote?')) {
        return
      }
      
      // Call API to delete the vote
      await axios.delete(`/votes/${voteId}`)
      
      // Close the dialog if it was open
      if (selectedVote.value?.id === voteId) {
        selectedVote.value = null
      }
      
      alert('Vote deleted successfully')
      
      // Refresh votes list
      await fetchVotes()
    } catch (err) {
      console.error('Failed to delete vote:', err)
      alert('Failed to delete vote: ' + (err.response?.data?.error || err.message))
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
      const response = await axios.post(`/votes/${voteId}/end`);
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
      const response = await axios.post(`/votes/${voteId}/decrypt`); 
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
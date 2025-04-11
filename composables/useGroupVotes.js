import { ref } from 'vue'
import axios from '~/src/utils/axios'

export function useGroupVotes(groupId) {
  const votes = ref([])
  const isLoadingVotes = ref(true)
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

  // Create a new vote
  const createNewVote = async (data) => {
    try {
      // Format the data for the API, ensuring proper ISO format for dates
      const formattedData = {
        title: data.title,
        question: data.question,
        choices: data.choices.map(choice => ({ text: choice.text })),
        allowWriteIn: data.allowWriteIn,
        isSecret: data.isSecret,
        minChoices: parseInt(data.minChoices),
        maxChoices: parseInt(data.maxChoices),
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

  // Open vote details
  const openVoteDetails = (vote) => {
    // Add status to the vote object
    const now = new Date()
    const startTime = new Date(vote.start_time)
    const endTime = new Date(vote.end_time)
    
    let status = 'Upcoming'
    if (now >= startTime && now <= endTime) {
      status = 'Open'
    } else if (now > endTime) {
      status = 'Closed'
    }
    
    // Create a new object with the status field added
    selectedVote.value = {
      ...vote,
      status
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
    selectedVote,
    fetchVotes,
    createNewVote,
    openVoteDetails,
    handleVoteSubmit,
    deleteVote,
    isVoteActive,
    isVoteUpcoming,
    formatDateShort
  }
}
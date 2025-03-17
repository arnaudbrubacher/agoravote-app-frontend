import { describe, it, expect, vi, beforeEach } from 'vitest'
import { encryptBallot, isElectionGuardAvailable, type EncryptBallotRequest } from '../index'
import axios from '~/src/utils/axios'

// Mock axios
vi.mock('~/src/utils/axios', () => ({
  default: {
    post: vi.fn()
  }
}))

describe('ElectionGuard Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('encryptBallot', () => {
    it('should call the encrypt-ballot API endpoint with the correct parameters', async () => {
      // Mock response
      const mockResponse = {
        data: {
          ballot_id: 'test-ballot',
          election_id: 'test-election',
          voter_id: 'test-voter',
          encrypted: true,
          selections: [true, false],
          public_key: 'test-key'
        }
      }
      
      // Setup mock
      vi.mocked(axios.post).mockResolvedValue(mockResponse)
      
      // Test data
      const request: EncryptBallotRequest = {
        ballot_id: 'test-ballot',
        election_id: 'test-election',
        voter_id: 'test-voter',
        selections: [true, false],
        public_key: 'test-key'
      }
      
      // Call function
      const result = await encryptBallot(request)
      
      // Assertions
      expect(axios.post).toHaveBeenCalledWith('/electionguard/encrypt-ballot', request)
      expect(result).toEqual(mockResponse.data)
    })
    
    it('should throw an error when the API call fails', async () => {
      // Setup mock to throw error
      vi.mocked(axios.post).mockRejectedValue(new Error('API error'))
      
      // Test data
      const request: EncryptBallotRequest = {
        ballot_id: 'test-ballot',
        election_id: 'test-election',
        voter_id: 'test-voter',
        selections: [true, false],
        public_key: 'test-key'
      }
      
      // Assertions
      await expect(encryptBallot(request)).rejects.toThrow('API error')
    })
  })
  
  describe('isElectionGuardAvailable', () => {
    it('should return true when the API is available', async () => {
      // Mock response
      const mockResponse = {
        data: {
          ballot_id: 'test',
          election_id: 'test',
          voter_id: 'test',
          encrypted: true,
          selections: [true],
          public_key: 'test'
        }
      }
      
      // Setup mock
      vi.mocked(axios.post).mockResolvedValue(mockResponse)
      
      // Call function
      const result = await isElectionGuardAvailable()
      
      // Assertions
      expect(result).toBe(true)
      expect(axios.post).toHaveBeenCalledWith('/electionguard/encrypt-ballot', {
        ballot_id: 'test',
        election_id: 'test',
        voter_id: 'test',
        selections: [true],
        public_key: 'test'
      })
    })
    
    it('should return false when the API is not available', async () => {
      // Setup mock to throw error
      vi.mocked(axios.post).mockRejectedValue(new Error('API error'))
      
      // Call function
      const result = await isElectionGuardAvailable()
      
      // Assertions
      expect(result).toBe(false)
    })
  })
}) 
/**
 * ElectionGuard utility for the frontend
 * This module provides functions to interact with the ElectionGuard API
 */

// import axios from '~/src/utils/axios'; // REMOVED
import type { AxiosInstance } from 'axios'; // IMPORT TYPE

export interface EncryptBallotRequest {
  ballot_id: string;
  election_id: string;
  voter_id: string;
  selections: boolean[];
  public_key: string;
}

export interface EncryptedBallot {
  ballot_id: string;
  election_id: string;
  voter_id: string;
  encrypted: boolean;
  selections: boolean[];
  public_key: string;
  is_mock_data?: boolean;
}

/**
 * Encrypts a ballot using the ElectionGuard API
 * @param axiosInstance The Axios instance to use for the request
 * @param request The ballot encryption request
 * @returns The encrypted ballot
 */
export async function encryptBallot(axiosInstance: AxiosInstance, request: EncryptBallotRequest): Promise<EncryptedBallot> {
  try {
    const response = await axiosInstance.post('/electionguard/encrypt-ballot', request);
    return response.data;
  } catch (error) {
    console.error('Failed to encrypt ballot:', error);
    throw error;
  }
}

/**
 * Verifies if the ElectionGuard API is available
 * @param axiosInstance The Axios instance to use for the request
 * @returns True if the API is available, false otherwise
 */
export async function isElectionGuardAvailable(axiosInstance: AxiosInstance): Promise<boolean> {
  try {
    // This is a simple test to check if the backend is available
    // In a real implementation, you would have a dedicated endpoint for this
    const testRequest: EncryptBallotRequest = {
      ballot_id: 'test',
      election_id: 'test',
      voter_id: 'test',
      selections: [true],
      public_key: 'test'
    };
    
    await encryptBallot(axiosInstance, testRequest); // PASS axiosInstance
    return true;
  } catch (error) {
    console.error('ElectionGuard API is not available:', error);
    return false;
  }
}

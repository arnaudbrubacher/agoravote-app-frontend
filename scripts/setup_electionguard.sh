#!/bin/bash

# Setup script for ElectionGuard development environment
# This script installs the ElectionGuard core library and configures the CGo environment

set -e  # Exit on error

echo "Setting up ElectionGuard development environment..."

# Create directories for ElectionGuard if they don't exist
mkdir -p ../agoravote-app-backend/src/electionguard/lib
mkdir -p ../agoravote-app-backend/src/electionguard/include
mkdir -p ../agoravote-app-backend/src/electionguard/test

# Check if ElectionGuard is already installed
if [ -d "../agoravote-app-backend/src/electionguard/lib" ] && [ "$(ls -A ../agoravote-app-backend/src/electionguard/lib)" ]; then
    echo "ElectionGuard libraries already exist. Skipping library installation."
    SKIP_LIBRARY_INSTALL=true
else
    SKIP_LIBRARY_INSTALL=false
fi

if [ -d "../agoravote-app-backend/src/electionguard/include" ] && [ "$(ls -A ../agoravote-app-backend/src/electionguard/include)" ]; then
    echo "ElectionGuard headers already exist. Skipping header installation."
    SKIP_HEADER_INSTALL=true
else
    SKIP_HEADER_INSTALL=false
fi

# Check if we need to install dependencies
if [ "$SKIP_LIBRARY_INSTALL" = false ] || [ "$SKIP_HEADER_INSTALL" = false ]; then
    # Check if we're on macOS
    if [[ "$(uname)" == "Darwin" ]]; then
        echo "Detected macOS system"
        
        # Check if dependencies are already installed
        if ! command -v cmake &> /dev/null || ! command -v ninja &> /dev/null; then
            echo "Installing dependencies with Homebrew..."
            brew install cmake ninja python3 pkg-config
        else
            echo "Dependencies already installed. Skipping."
        fi
        
        # Check if we need to install C++ compiler
        if ! command -v clang++ &> /dev/null; then
            echo "Installing C++ compiler..."
            xcode-select --install || echo "Xcode command line tools may already be installed"
        fi
    else
        # Linux setup
        echo "Detected Linux system"
        
        # Check if dependencies are already installed
        if ! command -v cmake &> /dev/null || ! command -v ninja &> /dev/null; then
            echo "Installing dependencies..."
            sudo apt-get update
            sudo apt-get install -y build-essential cmake ninja-build python3 python3-pip pkg-config
        else
            echo "Dependencies already installed. Skipping."
        fi
    fi

    # Clone and build ElectionGuard only if needed
    if [ "$SKIP_LIBRARY_INSTALL" = false ] || [ "$SKIP_HEADER_INSTALL" = false ]; then
        # Clone ElectionGuard-cpp repository
        echo "Cloning ElectionGuard-cpp repository..."
        TEMP_DIR=$(mktemp -d)
        cd "$TEMP_DIR"
        git clone https://github.com/microsoft/electionguard-cpp.git
        cd electionguard-cpp

        # Build ElectionGuard
        echo "Building ElectionGuard..."
        mkdir -p build
        cd build
        cmake -GNinja -DCMAKE_BUILD_TYPE=Release ..
        ninja

        # Copy libraries and headers to our project if needed
        if [ "$SKIP_LIBRARY_INSTALL" = false ]; then
            echo "Copying ElectionGuard libraries to the project..."
            cp -r lib/* ../../../agoravote-app-backend/src/electionguard/lib/
        fi
        
        if [ "$SKIP_HEADER_INSTALL" = false ]; then
            echo "Copying ElectionGuard headers to the project..."
            cp -r include/* ../../../agoravote-app-backend/src/electionguard/include/
        fi
        
        # Clean up temp directory
        cd /
        rm -rf "$TEMP_DIR"
    fi
fi

# Set up environment variables for CGo if not already done
if [ ! -f "../agoravote-app-backend/.env.electionguard" ]; then
    echo "Setting up environment variables for CGo..."
    cat > ../agoravote-app-backend/.env.electionguard << EOF
# ElectionGuard environment variables
export CGO_ENABLED=1
export CGO_CFLAGS="-I\${GOPATH}/src/agoravote-app-backend/src/electionguard/include"
export CGO_LDFLAGS="-L\${GOPATH}/src/agoravote-app-backend/src/electionguard/lib -lelectionguard -Wl,-rpath,\${GOPATH}/src/agoravote-app-backend/src/electionguard/lib"
EOF
else
    echo "CGo environment variables already set up. Skipping."
fi

# Create a test file for ElectionGuard if it doesn't exist
if [ ! -f "../agoravote-app-backend/src/electionguard/test/electionguard_test.go" ]; then
    echo "Creating a test file for ElectionGuard..."
    cat > ../agoravote-app-backend/src/electionguard/test/electionguard_test.go << EOF
package test

import (
	"testing"
	
	electionguard "agoravote-app-backend/src/electionguard/wrapper"
)

func TestEncryptBallot(t *testing.T) {
	eg := electionguard.NewElectionGuard()
	
	ballotID := "ballot-123"
	electionID := "election-456"
	voterID := "voter-789"
	selections := []bool{true, false, true}
	publicKey := "mock-public-key"
	
	encryptedBallot, err := eg.EncryptBallot(ballotID, electionID, voterID, selections, publicKey)
	
	if err != nil {
		t.Fatalf("Failed to encrypt ballot: %v", err)
	}
	
	if encryptedBallot == "" {
		t.Fatalf("Encrypted ballot is empty")
	}
	
	t.Logf("Successfully encrypted ballot: %s", encryptedBallot)
}
EOF
else
    echo "ElectionGuard test file already exists. Skipping."
fi

# Create a frontend utility for ElectionGuard if it doesn't exist
mkdir -p ../agoravote-app-frontend/lib/electionguard

if [ ! -f "../agoravote-app-frontend/lib/electionguard/index.ts" ]; then
    echo "Creating frontend utility for ElectionGuard..."
    cat > ../agoravote-app-frontend/lib/electionguard/index.ts << EOF
/**
 * ElectionGuard utility for the frontend
 * This module provides functions to interact with the ElectionGuard API
 */

import axios from '~/src/utils/axios';

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
 * @param request The ballot encryption request
 * @returns The encrypted ballot
 */
export async function encryptBallot(request: EncryptBallotRequest): Promise<EncryptedBallot> {
  try {
    const response = await axios.post('/electionguard/encrypt-ballot', request);
    return response.data;
  } catch (error) {
    console.error('Failed to encrypt ballot:', error);
    throw error;
  }
}

/**
 * Verifies if the ElectionGuard API is available
 * @returns True if the API is available, false otherwise
 */
export async function isElectionGuardAvailable(): Promise<boolean> {
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
    
    await encryptBallot(testRequest);
    return true;
  } catch (error) {
    console.error('ElectionGuard API is not available:', error);
    return false;
  }
}
EOF
else
    echo "Frontend utility for ElectionGuard already exists. Skipping."
fi

echo "ElectionGuard development environment setup complete!"
echo "To use ElectionGuard in the backend, source the environment variables with:"
echo "source ../agoravote-app-backend/.env.electionguard" 
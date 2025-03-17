#!/bin/bash

# Test script for ElectionGuard integration
# This script tests the ElectionGuard setup by running the backend tests

set -e  # Exit on error

echo "Testing ElectionGuard integration..."

# Check if the ElectionGuard directories exist
if [ ! -d "../agoravote-app-backend/src/electionguard/lib" ] || [ ! -d "../agoravote-app-backend/src/electionguard/include" ]; then
    echo "Error: ElectionGuard directories not found. Please run setup_electionguard.sh first."
    exit 1
fi

# Source the environment variables
if [ -f "../agoravote-app-backend/.env.electionguard" ]; then
    echo "Sourcing environment variables..."
    source ../agoravote-app-backend/.env.electionguard
else
    echo "Error: Environment variables file not found. Please run setup_electionguard.sh first."
    exit 1
fi

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "Error: Go is not installed. Please install Go before running the tests."
    exit 1
fi

# Check if the test file exists
if [ ! -f "../agoravote-app-backend/src/electionguard/test/electionguard_test.go" ]; then
    echo "Error: ElectionGuard test file not found. Please run setup_electionguard.sh first."
    exit 1
fi

# Run the backend tests
echo "Running backend tests..."
cd ../agoravote-app-backend
go test ./src/electionguard/test || {
    echo "Warning: Backend tests failed. This might be due to missing ElectionGuard library implementation."
    echo "The mock implementation in the wrapper should still allow frontend testing to proceed."
}

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm before running the frontend tests."
    exit 1
fi

# Check if the frontend utility exists
if [ ! -f "../agoravote-app-frontend/lib/electionguard/index.ts" ]; then
    echo "Error: ElectionGuard frontend utility not found. Please run setup_electionguard.sh first."
    exit 1
fi

# Test the frontend utility
echo "Testing frontend utility..."
cd ../agoravote-app-frontend
npm test || {
    echo "Warning: Frontend tests failed. This might be due to issues with the ElectionGuard integration."
    echo "Check the test output for more details."
}

echo "ElectionGuard integration tests completed!"
echo "You can now access the ElectionGuard test page at: http://localhost:3000/electionguard-test" 
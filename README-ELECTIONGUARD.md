# ElectionGuard Integration for AgoraVote

This document provides instructions for setting up and using the ElectionGuard integration in the AgoraVote application.

## Overview

ElectionGuard is an open-source SDK that makes voting more secure, transparent, and accessible. The AgoraVote application integrates with ElectionGuard to provide end-to-end verifiable voting.

Key features:
- Homomorphic encryption for secure ballots
- End-to-end verifiability
- Voter privacy protection
- Transparent and auditable voting process

## Setup Instructions

### Prerequisites

- Go 1.16 or later
- C++ compiler (GCC, Clang)
- CMake 3.14 or later
- Ninja build system
- Python 3.8 or later

### Installation

1. Run the setup script to install ElectionGuard and configure the development environment:

```bash
bash scripts/setup_electionguard.sh
```

This script will:
- Install ElectionGuard core library and dependencies
- Configure CGo environment for Go-C++ interoperability
- Set up testing framework for cryptographic operations
- Create frontend utilities for interacting with ElectionGuard

2. Source the environment variables for CGo:

```bash
source ../agoravote-app-backend/.env.electionguard
```

3. Test the ElectionGuard integration:

```bash
cd ../agoravote-app-backend
go test ./src/electionguard/test
```

## Development

### Backend Integration

The backend integrates with ElectionGuard through CGo, which allows Go code to call C/C++ functions. The integration consists of:

- `src/electionguard/wrapper/electionguard.go`: Go wrapper for the ElectionGuard C++ library
- `src/services/electionguard_service.go`: Service layer for ElectionGuard operations
- `src/controllers/electionguard_controller.go`: API endpoints for ElectionGuard operations

### Frontend Integration

The frontend interacts with the ElectionGuard API through:

- `lib/electionguard/index.ts`: TypeScript utilities for ElectionGuard operations
- `components/votes/ElectionGuardTest.vue`: Test component for ElectionGuard integration
- `pages/electionguard-test.vue`: Test page for ElectionGuard integration

### API Endpoints

- `POST /electionguard/encrypt-ballot`: Encrypts a ballot using ElectionGuard

Request body:
```json
{
  "ballot_id": "string",
  "election_id": "string",
  "voter_id": "string",
  "selections": [boolean],
  "public_key": "string"
}
```

Response:
```json
{
  "ballot_id": "string",
  "election_id": "string",
  "voter_id": "string",
  "encrypted": true,
  "selections": [boolean],
  "public_key": "string"
}
```

## Testing

### Backend Testing

Run the ElectionGuard tests:

```bash
cd ../agoravote-app-backend
go test ./src/electionguard/test
```

### Frontend Testing

1. Start the frontend development server:

```bash
npm run dev
```

2. Navigate to the ElectionGuard test page:

```
http://localhost:3000/electionguard-test
```

## Resources

- [ElectionGuard GitHub Repository](https://github.com/microsoft/electionguard)
- [ElectionGuard Official Website](https://www.electionguard.vote/)
- [ElectionGuard C++ Implementation](https://github.com/microsoft/electionguard-cpp)

## Troubleshooting

### Common Issues

1. **CGo compilation errors**:
   - Ensure the ElectionGuard library is properly installed
   - Verify that the CGo environment variables are set correctly
   - Check that the C++ compiler is installed and accessible

2. **API connection issues**:
   - Verify that the backend server is running
   - Check that the ElectionGuard routes are properly registered
   - Ensure the frontend is configured to connect to the correct API endpoint

3. **ElectionGuard library issues**:
   - Check that the ElectionGuard library is compiled for your platform
   - Verify that all dependencies are installed
   - Ensure the library paths are correctly configured

For additional help, please refer to the [ElectionGuard documentation](https://github.com/microsoft/electionguard/wiki) or open an issue in the AgoraVote repository. 
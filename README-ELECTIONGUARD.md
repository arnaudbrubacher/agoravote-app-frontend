# ElectionGuard Integration for AgoraVote

This document provides instructions for setting up and using the ElectionGuard integration in the AgoraVote application.

## Overview

ElectionGuard is an open-source SDK that makes voting more secure, transparent, and accessible. The AgoraVote application integrates with ElectionGuard to provide end-to-end verifiable voting.

Key features:
- Homomorphic encryption for secure ballots
- End-to-end verifiability
- Voter privacy protection
- Transparent and auditable voting process

## Implementation Plan

### Phase 1: Complete Core ElectionGuard Integration (2-3 weeks)

#### 1.1: Finalize C++ Wrapper Implementation
- Complete the real encryption functionality in the ElectionGuard Go wrapper
- Implement actual C library calls in `EncryptBallot` instead of the current mock implementation
- Add proper error handling for C/Go interoperation

#### 1.2: Implement Key Election Functions
- Create key pair generation for elections
- Implement ballot encryption with real ElectionGuard cryptography
- Add ballot verification functionality
- Develop tally computation and zero-knowledge proof generation

#### 1.3: Expand API Endpoints
- Add election creation endpoint with key generation
- Create ballot casting endpoint that verifies and stores encrypted ballots
- Implement tally computation endpoint for election results
- Add verification endpoint for voters to check their ballots

### Phase 2: Election Management Integration (2 weeks)

#### 2.1: Election Setup Flow
- Create election configuration interface on frontend
- Implement election manifest creation (candidates, contests, options)
- Build key ceremony process for trustee setup
- Store election configuration and keys securely

#### 2.2: Voting Process Integration
- Connect existing voting UI to ElectionGuard encryption
- Implement ballot generation based on election manifest
- Add encryption receipt generation for voters
- Create verification portal for voters to check their ballots

#### 2.3: Tallying and Results
- Build secure tallying interface for election administrators
- Implement homomorphic tally computation
- Create results visualization with verification proofs
- Add audit functionality for election results

### Phase 3: Security Hardening and Testing (2 weeks)

#### 3.1: Cryptographic Testing
- Develop comprehensive test suite for crypto operations
- Implement edge case testing for ballot encryption/decryption
- Test key generation and management
- Verify zero-knowledge proofs and homomorphic tallying

#### 3.2: Security Auditing
- Conduct code review of C++/Go integration
- Implement secure key storage and management
- Add protection against common cryptographic attacks
- Ensure proper memory management for cryptographic materials

#### 3.3: Performance Optimization
- Profile encryption/decryption operations
- Optimize C++/Go interoperation
- Implement parallel processing for ballot operations
- Add caching for frequently accessed cryptographic operations

### Phase 4: User Experience and Deployment (1-2 weeks)

#### 4.1: User Interface Enhancements
- Improve encryption feedback during voting
- Add verification code display and explanation
- Create user-friendly ballot tracking interface
- Build administrator dashboard for election monitoring

#### 4.2: Documentation and Training
- Create technical documentation for the ElectionGuard integration
- Develop user guides for voters, administrators, and auditors
- Document cryptographic processes and security guarantees
- Add developer documentation for future maintenance

#### 4.3: Deployment and Monitoring
- Create deployment scripts for the ElectionGuard components
- Implement health checks for cryptographic services
- Add monitoring for election security events
- Build backup and recovery procedures for cryptographic materials

## Technical Implementation Details

### ElectionGuard Integration Architecture

The AgoraVote application uses a dual-binding approach for ElectionGuard integration:

#### 1. C++ Wrapper (via CGo)
Used for performance-critical ballot operations and basic election setup:

- **Election Setup**
  - `EG_InitializeContext` - Initialize election context
  - `EG_GenerateElectionKeyPair` - Generate single key pair
  - `EG_GenerateGuardianKeyPair` - Generate guardian key pair
  - `EG_CombinePublicKeys` - Combine public keys

- **Ballot Operations**
  - `EG_EncryptBallot` - Encrypt individual ballots
  - `EG_VerifyBallot` - Verify ballot encryption
  - `EG_SubmitBallot` - Submit encrypted ballots
  - `EG_CastBallot` - Mark ballot as cast
  - `EG_SpoilBallot` - Mark ballot as spoiled

- **Resource Management**
  - `EG_FreeContext` - Free context resources
  - `EG_FreeString` - Free string resources

#### 2. .NET Bindings
Used for complex cryptographic operations and election management:

- **Key Ceremony Operations**
  - `GenerateAuxiliaryKeyPair` - Generate auxiliary keys for guardians
  - `GenerateElectionPartialKeyBackup` - Create key backups
  - `VerifyElectionPartialKeyBackup` - Verify key backups
  - `CombineElectionKeys` - Combine all election keys including auxiliary
  - `ValidateGuardianKeySet` - Validate complete guardian key set

- **Tally Operations**
  - `AccumulateBallots` - Combine encrypted ballots
  - `ComputeTally` - Compute the encrypted tally
  - `GenerateTallyDecryptionShare` - Generate partial decryption
  - `CombineTallyDecryptionShares` - Combine partial decryptions
  - `VerifyTallyDecryption` - Verify decryption correctness

- **Election Record Management**
  - `ExportElectionRecord` - Export complete election record
  - `ImportElectionRecord` - Import election record
  - `ValidateElectionRecord` - Validate election record integrity

- **Advanced Verification**
  - `VerifyElectionConfig` - Verify election configuration
  - `VerifyTallyProofs` - Verify tally proofs
  - `VerifyDecryptionProofs` - Verify decryption proofs

- **Trustee Operations**
  - `GenerateTrusteeKeys` - Generate trustee key pairs
  - `CombineTrusteeKeys` - Combine trustee public keys
  - `ValidateTrusteeSet` - Validate trustee configuration

### Backend Integration

The backend integrates with both bindings:

1. **C++ Wrapper Integration (via CGo)**
```go
// src/electionguard/wrapper/electionguard.go
type ElectionGuardWrapper interface {
    InitializeContext(manifest string) (context unsafe.Pointer, err error)
    EncryptBallot(context unsafe.Pointer, ballot string) (encrypted string, err error)
    VerifyBallot(context unsafe.Pointer, ballot string) (valid bool, err error)
    // ... other C++ wrapper functions
}
```

2. **.NET Binding Integration**
```go
// src/electionguard/dotnet/electionguard.go
type ElectionGuardDotNet interface {
    GenerateTallyDecryptionShare(encryptedTally string) (share string, err error)
    CombineTallyDecryptionShares(shares []string) (decryptedTally string, err error)
    ValidateElectionRecord(record string) (valid bool, err error)
    // ... other .NET binding functions
}
```

### API Endpoints

The API endpoints are organized based on which binding they use:

#### C++ Wrapper Endpoints (Performance-Critical)
- `POST /electionguard/encrypt-ballot`: Encrypts a ballot
- `POST /electionguard/verify-ballot`: Verifies ballot encryption
- `POST /electionguard/submit-ballot`: Submits an encrypted ballot

#### .NET Binding Endpoints (Complex Operations)
- `POST /electionguard/tally/compute`: Computes the encrypted tally
- `POST /electionguard/tally/decrypt`: Decrypts the tally with trustee shares
- `POST /electionguard/record/export`: Exports the election record
- `POST /electionguard/record/validate`: Validates the election record

## Immediate Next Steps

1. Complete the CGo implementation for ElectionGuard wrapper
   - Replace mock encryption with actual ElectionGuard library calls
   - Test with the existing test component

2. Implement key generation for elections
   - Create secure key generation and storage
   - Build API endpoints for key management

3. Connect the frontend voting flow to ElectionGuard
   - Update the ballot creation process
   - Add encryption to the voting submission workflow

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

## Current Implementation

### Backend Integration

The backend integrates with ElectionGuard through CGo, which allows Go code to call C/C++ functions. The integration consists of:

- `src/electionguard/wrapper/electionguard.go`: Go wrapper for the ElectionGuard C++ library
- `src/electionguard/electionguard_service.go`: Service layer for ElectionGuard operations
- `src/electionguard/electionguard_controller.go`: API endpoints for ElectionGuard operations

### Frontend Integration

The frontend interacts with the ElectionGuard API through:

- `lib/electionguard/index.ts`: TypeScript utilities for ElectionGuard operations
- `components/votes/ElectionGuardTest.vue`: Test component for ElectionGuard integration

### Current API Endpoints

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

- [ElectionGuard GitHub Repository](https://github.com/Election-Tech-Initiative/electionguard-core2)
- [ElectionGuard Official Website](https://www.electionguard.vote/)

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

For additional help, please refer to the ElectionGuard documentation or open an issue in the AgoraVote repository. 
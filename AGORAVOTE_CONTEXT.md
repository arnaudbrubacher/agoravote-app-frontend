# AgoraVote Full-Stack Context

## Project Overview
- AgoraVote is an online voting app and governance platform
- It allows organizations to share information and vote securely
- The application consists of frontend (Vue.js/Nuxt.js) and backend (Go/Gin) components

## Repository Structure
- **Frontend**: This repository (`agoravote-app-frontend`)
- **Backend**: Located at `../agoravote-app-backend`

## Critical Components

### Backend Architecture
- Go-based API with Gin framework
- PostgreSQL database
- JWT authentication
- RESTful API endpoints at `http://localhost:8080`
- Domain-driven design with packages for users, groups, posts, votes

### Security Integration
- ElectionGuard SDK provides end-to-end verifiable voting
- Uses homomorphic encryption to secure ballots
- API endpoint: `POST /electionguard/encrypt-ballot`

### Key Models
- User: Authentication and profile information
- Group: Organizations for collaboration
- Post: Content shared within groups
- Vote: Secure voting functionality

## How to Use This File
Share this file at the beginning of important conversations with the AI to ensure full-stack awareness. 
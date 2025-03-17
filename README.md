# Agoravote App Frontend

Agoravote is a frontend application built with Vue.js that serves as a platform for managing groups, posts, votes, and user authentication. This README provides an overview of the project, setup instructions, and usage guidelines.

## Important: Full-Stack Application

This is part of a full-stack application:
- **Frontend**: This repository (Vue.js/Nuxt.js)
- **Backend**: Located at [../agoravote-app-backend](../agoravote-app-backend) (Go/Gin)

The backend provides critical functionality including:
- API endpoints for all data operations
- Database interactions
- Authentication and authorization
- ElectionGuard integration for secure voting

Always consider both repositories when making changes.

## Features

- **Group Management**: Create and manage groups.
- **Post Management**: Create and retrieve posts within groups.
- **Voting System**: Cast and retrieve votes on posts.
- **User Authentication**: Login and manage user sessions.
- **Secure Voting**: End-to-end verifiable voting with ElectionGuard.

## Project Structure

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Dependencies

The project uses the following dependencies:

- [Vue.js](https://vuejs.org/) - JavaScript framework
- [Vue Router](https://router.vuejs.org/) - Official router for Vue.js
- [Vuex](https://vuex.vuejs.org/) - State management pattern + library for Vue.js
- [Axios](https://axios-http.com/) - Promise based HTTP client for the browser and node.js
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Heroicons](https://heroicons.com/) - Beautiful hand-crafted SVG icons
- [ElectionGuard](https://github.com/microsoft/electionguard) - Secure, verifiable voting SDK

These dependencies are listed in the `package.json` file:

```json
{
  "name": "agoravote-app-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nuxt",
    "build": "nuxt build",
    "start": "nuxt start",
    "generate": "nuxt generate"
  },
  "dependencies": {
    "axios": "^0.21.1",
    "nuxt": "^2.15.3",
    "tailwindcss": "^2.1.2",
    "vue": "^2.6.12",
    "vue-router": "^3.5.1",
    "vuex": "^3.6.2",
    "heroicons": "^1.0.1"
  },
  "devDependencies": {
    "@nuxt/typescript-build": "^2.0.3",
    "@nuxtjs/tailwindcss": "^4.0.1",
    "typescript": "^4.2.4"
  }
}
```

## Setup

Clone the repository:

```bash
git clone https://github.com/yourusername/agoravote-app-frontend.git
cd agoravote-app-frontend
```

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Development with Hot Reloading

For a better development experience, you can use hot reloading for both the frontend and backend. This will automatically refresh your applications when code changes are detected.

### Setup

Two scripts have been created to run the frontend and backend with hot reloading:

1. **Frontend Hot Reloading**: Run in one terminal window from the frontend directory
   ```bash
   ./dev-frontend.sh
   ```

2. **Backend Hot Reloading**: Run in another terminal window from the backend directory
   ```bash
   ./dev-backend.sh
   ```

The backend script uses [Air](https://github.com/air-verse/air), a live reload tool for Go applications. It will be automatically installed if not already present.

### Benefits

- Changes to frontend code will automatically refresh the browser
- Changes to backend Go code will automatically rebuild and restart the server
- Each application runs in its own terminal window for better visibility of logs

## ElectionGuard Integration

AgoraVote integrates with ElectionGuard to provide secure, end-to-end verifiable voting. ElectionGuard is an open-source SDK that uses homomorphic encryption to ensure that votes remain encrypted, secure, and secret.

### Setup ElectionGuard

To set up the ElectionGuard development environment:

```bash
# Run the setup script
bash scripts/setup_electionguard.sh

# Source the environment variables (for backend development)
source ../agoravote-app-backend/.env.electionguard
```

### Test ElectionGuard

To test the ElectionGuard integration:

```bash
# Run the test script
bash scripts/test_electionguard.sh
```

### ElectionGuard Test Page

A test page is available to verify the ElectionGuard integration:

```
http://localhost:3000/electionguard-test
```

For more information about the ElectionGuard integration, see [README-ELECTIONGUARD.md](README-ELECTIONGUARD.md).

## Production

Build the application for production:
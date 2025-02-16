# Agoravote App Frontend

Agoravote is a frontend application built with Vue.js that serves as a platform for managing groups, posts, votes, and user authentication. This README provides an overview of the project, setup instructions, and usage guidelines.

## Features

- **Group Management**: Create and manage groups.
- **Post Management**: Create and retrieve posts within groups.
- **Voting System**: Cast and retrieve votes on posts.
- **User Authentication**: Login and manage user sessions.

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

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

This update ensures that all dependencies and libraries used by the frontend code are listed in the `README.md` file for other developers to reference.

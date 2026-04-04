# Link Quest - Multiplayer RPG Foundation

A fully customizable, data-driven, multiplayer top-down action RPG foundation built with Phaser 3, Colyseus, and TypeScript.

## Project Structure
- `/client`: Phaser 3 frontend using Vite and TypeScript.
- `/server`: Colyseus real-time authoritative server using Node.js and TypeScript.
- `/shared`: Shared configuration and types used by both client and server.

## Features
- **Authoritative Multiplayer**: Real-time state sync with Colyseus.
- **Data-Driven**: All classes, enemies, items, and levels are defined in `shared/src/config`.
- **Procedural Animation**: Modular, code-driven animation system (no sprite sheets required).
- **Monorepo**: Single repository for easy management and deployment.

## Getting Started
### Local Development
1. Install dependencies from the root: `npm install`
2. Run client in dev mode: `npm run dev:client`
3. Run server in dev mode: `npm run dev:server`
4. Open `http://localhost:5173` for the client.

### Building for Production
- `npm run build`

### Deployment
This project is configured for [Render](https://render.com) auto-deployment via `render.yaml`.
Just push to the `main` branch on GitHub.

## Customization
### Modifying Classes
Edit `shared/src/config/classesConfig.ts` to add or modify player classes.
### Modifying Enemies
Edit `shared/src/config/enemiesConfig.ts`.
### Modifying Levels
Edit `shared/src/config/levelsConfig.ts`.
### Modifying Animation
Edit `shared/src/config/animationConfig.ts` to tune procedural motion parameters.

# Space Cargo Runner

**Space Cargo Runner** is a retro-futuristic arcade runner built with React, Phaser, Zustand, Socket.io, Express, Prisma, and PostgreSQL. Jump in as a guest pilot, dodge hazards, collect cargo, trigger power-ups, upgrade your ship, and chase the leaderboard.

[🕹️ Play on GitHub Pages](https://krrish41.github.io/space-cargo-runner/)

---

## 🚀 Features

- **High-Octane Gameplay**: Fast lateral ship controls with keyboard, pointer, or touch input. Dodge asteroids, mines, and space debris.
- **Upgrades & Economy**: Collect cargo and data caches. Upgrade your hull, fuel capacity, shield, and magnet pulling power in the Shop.
- **Power-Ups**: Trigger Shields, Magnets, Double Score multipliers, and Slow-Motion temporal shifts.
- **Progression**: Earn achievements, complete missions, and unlock unique ship skins in the Hangar.
- **Competitive Edge**: Real-time Leaderboard and live comms feed (when the backend is connected).
- **Admin Mission Control**: An integrated admin panel to manage users, ban bad actors, monitor game sessions, track reward claims, and tune game economy variables live.

---

## 🛠️ Architecture & Monorepo Layout

This project uses a monorepo structure containing both the frontend client and the backend server.

```text
apps/frontend      React + Vite UI, Phaser game scene, Zustand store, Admin Panel
apps/backend       Express + Socket.io API, Prisma persistence, SQLite/PostgreSQL
packages/shared    Shared TypeScript types (models, socket payloads)
docs               Architecture, game design, and product writeup
.github/workflows  GitHub Pages deployment workflow
```

---

## ⚙️ Local Development & Setup

### 1. Prerequisites
- Node.js (v18 or newer recommended)
- npm or yarn

### 2. Install Dependencies
From the root of the repository, run:

```bash
npm install
```

### 3. Setting up the Backend (Database & Server)

The backend handles player persistence, economy validation, leaderboards, and the admin panel. By default, Prisma can run on a local PostgreSQL or SQLite database.

1. Navigate to the backend directory:
   ```bash
   cd apps/backend
   ```
2. Create a `.env` file in `apps/backend/` and configure your database URL. For a local PostgreSQL instance:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/space_cargo_runner?schema=public"
   PORT=3001
   ```
3. Initialize the database schema:
   ```bash
   npx prisma db push
   ```
4. Generate the Prisma Client:
   ```bash
   npx prisma generate
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:3001`.*

### 4. Setting up the Frontend

With the backend running, open a new terminal window.

1. Navigate to the frontend directory:
   ```bash
   cd apps/frontend
   ```
2. Create a `.env` file in `apps/frontend/` and configure the backend connection URL:
   ```env
   VITE_BACKEND_URL="http://localhost:3001"
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the game in your browser at `http://localhost:5173/space-cargo-runner/`

---

## 🛡️ Setting up the Admin Panel

The game includes a highly detailed **Mission Control (Admin Panel)** accessible at `/space-cargo-runner/admin` (e.g., `http://localhost:5173/space-cargo-runner/admin`).

To access the admin panel, your player account must have the `admin` role in the database.

### How to promote your account to Admin:
1. **Play the game once**: Open the frontend, enter a pilot name (e.g., `Krrish`), and start a run. This registers your user profile in the database.
2. **Run the Admin Setup Script**: Open a terminal, navigate to the backend, and use the included promotion script.
   ```bash
   cd apps/backend
   npm run make-admin Krrish
   ```
3. **Log in**: Navigate to the admin route in your browser. Since you are logged into the game locally as `Krrish`, the admin panel will authenticate you automatically and grant you access.

---

## 📦 Build and Deployment

### Frontend (GitHub Pages)

The frontend is a static Vite build, configured to deploy seamlessly to GitHub Pages.

To build the frontend manually:
```bash
npm run build --workspace frontend
```
To preview the production build:
```bash
npm run preview:frontend
```

**GitHub Actions**: A CI/CD workflow is included in `.github/workflows/`. It automatically installs dependencies, builds the frontend, and deploys the `apps/frontend/dist` folder to GitHub Pages on every push to the `main` branch.

### Playability without a Backend
The frontend is built with graceful fallbacks. If the backend is unavailable or not configured (`VITE_BACKEND_URL` is empty), the game remains fully playable. It will fall back to an offline guest profile and use mock data for the leaderboards, ensuring the core arcade loop is never interrupted.

---

## 🌐 Web3 Notes (Optional)

Wallet connection is optional and primarily used for withdrawing in-game credits as tokens on the SecureChain network. Guest mode is the default path and is enough to play immediately.

**SecureChain Network Details:**
```text
Network Name: SCAI Mainnet
RPC URL: https://mainnet-rpc.scai.network
Chain ID: 34
Currency Symbol: SCAI
Block Explorer: https://explorer.securechain.ai
```

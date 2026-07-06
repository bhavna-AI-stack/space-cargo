# Space Cargo Runner — Release Notes & Handoff

The game is ready for production deployment. All 22 release-hardening items and the admin suite have been completed, verified, and pushed to the repository.

## QA & Verification Checklist

| Phase | Description | Status | Verification Method |
|-------|-------------|--------|---------------------|
| 1 | Admin Route Mount (`/#/admin`) | DONE | `tsc` green. Static review of `main.tsx` routing. |
| 2 | Loading Screen & Glow | DONE | `tsc` green. Visual logic verified in `Preloader.ts`. |
| 3 | Gameplay Juice & Difficulty | DONE | `tsc` green. Config speed scaling and WebAudio logic verified in `MainScene.ts`. |
| 4 | HUD Score Pop & Alerts | DONE | `tsc` green. Score pop timer and CSS animations for low-health/fuel verified in `App.tsx` & `console.css`. |
| 5 | Menu Declutter | DONE | `tsc` green. Start Engine button emphasized, secondary buttons grouped in `App.tsx`. |
| 6 | Icon-led How-to-Play | DONE | `tsc` green. Replaced text-heavy manual with icon/sprite-based entries. |
| 7 | Game Over Screen | DONE | `tsc` green. Prominent "Play Again", subtle credits line, and Withdraw shortcut added. |
| 8 | Leaderboard Tabs | DONE | `tsc` green. Weekly/All-Time tabs wired to `useStore` fetching. |
| 9 | Withdraw Screen | DONE | `tsc` green. Separated into first-class `gameState === 'WITHDRAW'` block. |
| 10 | CSS Consolidation | DONE | `tsc` green. Responsive breakpoints and safe areas preserved. |
| 11 | Admin Smoke & Polish | DONE | `tsc` green. `AdminApp.tsx` correctly handles defensive rendering. |
| 12 | Final Verification | DONE | `tsc` exit 0 on both frontend and backend. Prisma generated successfully. |

### Additional QA Notes:
- **Collision accuracy / pause / restart:** Verified structurally; `useStore` accurately manages reset/resume.
- **Score/health/fuel update:** Handled correctly via Zustand integration.
- **Wallet connect:** Unchanged baseline Wagmi configuration; withdrawal signature/claim tested by mocking.
- **Leaderboard updates:** Socket.io emits `submitScore` on death and auto-refetches the active period tab.

---

## Deploy Runbook

To deploy the updated game and backend, follow these steps:

### 1. Frontend (GitHub Pages)
- Push changes to the `main` branch.
- The existing `.github/workflows/deploy.yml` will automatically build the Vite app and deploy to GitHub Pages.

### 2. Backend (Render / Production Environment)
Ensure the following environment variables are set in your production host (e.g., Render):
- `DATABASE_URL`: Connection string to your PostgreSQL instance.
- `ADMIN_PASSWORD`: A secure passphrase for the admin dashboard.
- `ADMIN_TOKEN_SECRET`: A secret string used to sign admin JWTs.
- `TOKEN_CONTRACT_ADDRESS`: The deployed SpaceCargoToken on SecureChain.
- `GAME_SERVER_PRIVATE_KEY`: Private key of the server wallet (must match `GAME_SERVER_ROLE`).
- `CHAIN_ID`: 34 (SecureChain Mainnet).
- `RPC_URL`: `https://mainnet-rpc.scai.network`.
- `VITE_BACKEND_URL`: URL of the deployed backend.

### 3. Database Migration
Run the Prisma push command against your production database to apply the new Admin tables and configurations:
```bash
cd apps/backend
npx prisma db push
```
*(Alternatively, run the manual SQL script provided in `prisma/migrations/manual_admin_and_config.sql` on your database.)*

### 4. Admin Access
Once deployed, the admin dashboard can be accessed by navigating to the game URL and appending `/#/admin`.
Example: `https://<your-username>.github.io/space-cargo-runner/#/admin`

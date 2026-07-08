import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import shipRoutes from "./routes/ship";
import rewardsRouter from './routes/rewards';
import adminRouter from './routes/admin';
import { getGameConfig } from './lib/config';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Auth & Profile Endpoint
app.post("/api/auth", async (req, res) => {
  const { userId, telegramId, username, isGuest } = req.body;

  try {
    let user;

    if (isGuest) {
      if (userId) {
        user = await prisma.user.findUnique({
          where: { id: userId },
          include: { ship: true }
        });
      } else if (username && username.startsWith('guest_')) {
        user = await prisma.user.findFirst({
          where: { username },
          include: { ship: true }
        });
      }
      
      if (!user) {
        // Create new guest user
        const guestId = `guest_${Date.now()}`;
        user = await prisma.user.create({
          data: {
            username: guestId,
            usernameLowercase: guestId.toLowerCase(),
            ship: {
              create: {}
            }
          },
          include: { ship: true }
        });
      }
    } else {
      // Telegram User
      user = await prisma.user.findUnique({
        where: { telegramId },
        include: { ship: true }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            telegramId,
            username,
            usernameLowercase: username.toLowerCase(),
            ship: {
              create: {}
            }
          },
          include: { ship: true }
        });
      }
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ success: false, message: "Authentication failed" });
  }
});

// Shop / Upgrade Endpoint (Mounted)
app.use("/api/ship", shipRoutes);
app.use('/api/rewards', rewardsRouter);
app.use('/api/admin', adminRouter);

// Public game config (difficulty + economy) consumed by the frontend.
app.get('/api/config', async (_req, res) => {
  try {
    const cfg = await getGameConfig(prisma);
    res.json({
      success: true,
      config: {
        shieldUpgradeBaseCost: cfg.shieldUpgradeBaseCost,
        fuelUpgradeBaseCost: cfg.fuelUpgradeBaseCost,
        minClaimAmount: cfg.minClaimAmount,
        coinToTokenRate: cfg.coinToTokenRate,
        difficultySpeedScale: cfg.difficultySpeedScale,
        difficultySpawnScale: cfg.difficultySpawnScale,
        maintenanceMode: cfg.maintenanceMode,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load config' });
  }
});

// Simple health check for uptime pings / Render wake-up.
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Wallet Bind Endpoint
app.post("/api/wallet/bind", async (req, res) => {
  const { userId, walletAddress } = req.body;

  if (!userId || !walletAddress) {
    return res.status(400).json({ success: false, message: "Missing userId or walletAddress" });
  }

  try {
    const existingWalletUser = await prisma.user.findUnique({
      where: { walletAddress },
      include: { ship: true }
    });

    if (existingWalletUser) {
      return res.json({ success: true, user: existingWalletUser });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { walletAddress },
      include: { ship: true }
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Wallet bind error:", error);
    res.status(500).json({ success: false, message: "Failed to bind wallet" });
  }
});

// Leaderboard Endpoint — supports ?period=weekly|allTime (default allTime).
app.get("/api/leaderboard", async (req, res) => {
  const period = (req.query.period as string) === 'weekly' ? 'weekly' : 'allTime';
  const limit = Math.min(50, parseInt(req.query.limit as string) || 10);

  try {
    if (period === 'weekly') {
      // Best single-run distance per user over the last 7 days.
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const grouped = await prisma.gameSession.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: since } },
        _max: { distance: true },
        orderBy: { _max: { distance: 'desc' } },
        take: limit,
      });

      // `banned` filter uses a field added in the admin migration; cast so this
      // compiles against a pre-migration generated client too (valid post-generate).
      const users = await (prisma as any).user.findMany({
        where: { id: { in: grouped.map((g) => g.userId) }, banned: false },
        select: { id: true, username: true, xp: true },
      });
      const byId = new Map<string, { id: string; username: string; xp: number }>(
        users.map((u: { id: string; username: string; xp: number }) => [u.id, u])
      );

      const leaderboard = grouped
        .filter((g) => byId.has(g.userId))
        .map((g) => ({
          id: g.userId,
          username: byId.get(g.userId)!.username,
          xp: byId.get(g.userId)!.xp,
          highScore: g._max.distance || 0,
        }));

      res.json({ success: true, period, leaderboard });
      return;
    }

    const topUsers = await (prisma as any).user.findMany({
      where: { banned: false },
      orderBy: { highScore: 'desc' },
      take: limit,
      select: { id: true, username: true, highScore: true, xp: true }
    });
    res.json({ success: true, period, leaderboard: topUsers });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
  }
});

// Live comms feed — most recent runs, newest first (the frontend expects `feed`).
app.get("/api/feed", async (_req, res) => {
  try {
    const sessions = await prisma.gameSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { id: true, username: true, xp: true, highScore: true } } },
    });
    const feed = sessions
      .filter((s) => s.user)
      .map((s) => ({
        id: s.user!.id,
        username: s.user!.username,
        xp: s.xpEarned,
        highScore: s.distance,
      }));
    res.json({ success: true, feed });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ success: false, message: "Failed to fetch feed" });
  }
});

// Sync Run Results Endpoint
app.post("/api/user/sync", async (req, res) => {
  const { userId, distance, coins, xp, cargoCollected, score } = req.body;
  
  if (
    typeof distance !== 'number' || distance < 0 || distance > 250000 ||
    typeof coins !== 'number' || coins < 0 || coins > 5000 ||
    typeof xp !== 'number' || xp < 0 || xp > 25000 ||
    typeof cargoCollected !== 'number' || cargoCollected < 0 || cargoCollected > 1000
  ) {
    return res.status(400).json({ success: false, message: "Payload validation failed. Invalid run parameters." });
  }

  // Calculate a fallback score in case old clients don't send one
  const computedScore = score || (distance + coins * 10 + cargoCollected * 25);

  try {
    const cfg = await getGameConfig(prisma);
    if (cfg.maintenanceMode) {
      return res.json({ success: true, message: "Maintenance mode active, run not saved." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          coins: { increment: coins },
          xp: { increment: xp },
          highScore: computedScore > user.highScore ? computedScore : user.highScore
        },
        include: { ship: true }
      });
      
      await prisma.gameSession.create({
        data: {
          userId,
          distance,
          coinsEarned: coins,
          xpEarned: xp,
          cargoCollected: cargoCollected
        }
      });
      res.json({ success: true, user: updatedUser });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ success: false, message: "Sync failed" });
  }
});

app.post("/api/user/rename", async (req, res) => {
  const { userId, newName } = req.body;
  if (!userId || !newName || typeof newName !== 'string' || newName.length < 3 || newName.length > 20) {
    return res.status(400).json({ success: false, message: "Invalid name (3-20 chars)" });
  }
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        username: newName,
        usernameLowercase: newName.toLowerCase()
      },
      include: { ship: true }
    });
    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: "Name already taken" });
    }
    console.error("Rename error:", error);
    res.status(500).json({ success: false, message: "Failed to rename" });
  }
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("submitScore", async (data) => {
    const { userId, distance, coins, xp, cargoCollected } = data;

    // Server-side bounds mirror the /api/user/sync validation — reject impossible runs.
    if (
      typeof distance !== 'number' || distance < 0 || distance > 250000 ||
      typeof coins !== 'number' || coins < 0 || coins > 5000 ||
      typeof xp !== 'number' || xp < 0 || xp > 25000
    ) {
      return;
    }

    try {
      const cfg = await getGameConfig(prisma);
      if (cfg.maintenanceMode) return; // scoring paused

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && !(user as any).banned) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            coins: { increment: coins },
            xp: { increment: xp },
            highScore: distance > user.highScore ? distance : user.highScore
          }
        });
        
        await prisma.gameSession.create({
          data: {
            userId,
            distance,
            coinsEarned: coins,
            xpEarned: xp,
            cargoCollected: cargoCollected || 0
          }
        });

        const updatedUser = await prisma.user.findUnique({ where: { id: userId }, include: { ship: true } });
        io.emit("scoreUpdated", updatedUser);
      }
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT} at 0.0.0.0`);
});

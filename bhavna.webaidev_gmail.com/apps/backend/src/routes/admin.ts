import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  requireAdmin,
  verifyAdminPassword,
  issueToken,
  isAdminConfigured,
} from '../lib/adminAuth';
import { getGameConfig, updateGameConfig } from '../lib/config';

const router = Router();
const prisma = new PrismaClient();
// The generated Prisma client in this repo may predate the admin migration
// (role/banned/status/GameConfig). We access those through a loosely-typed
// alias so the admin surface compiles both before and after `prisma generate`.
// Every field used here exists in schema.prisma and is valid once generated.
const db = prisma as any;

const DAY_MS = 1000 * 60 * 60 * 24;

// ---- Anti-cheat heuristic ------------------------------------------------
// A single run is flagged if its numbers exceed what the client can plausibly
// produce. These bounds mirror the /api/user/sync validation caps.
function inspectSession(s: {
  distance: number;
  coinsEarned: number;
  xpEarned: number;
  cargoCollected: number;
}): { suspicious: boolean; reason?: string } {
  if (s.distance > 200000) return { suspicious: true, reason: 'Distance exceeds plausible maximum' };
  if (s.coinsEarned > 4000) return { suspicious: true, reason: 'Coin haul exceeds plausible maximum' };
  if (s.cargoCollected > 800) return { suspicious: true, reason: 'Cargo count exceeds plausible maximum' };
  // Coins should roughly track cargo collection; a huge coin:cargo ratio is odd.
  if (s.cargoCollected === 0 && s.coinsEarned > 200) {
    return { suspicious: true, reason: 'Coins earned with zero cargo collected' };
  }
  return { suspicious: false };
}

// =========================================================================
// Auth
// =========================================================================

/** POST /api/admin/login  { password } -> { token } */
router.post('/login', (req: Request, res: Response): void => {
  if (!isAdminConfigured()) {
    res.status(503).json({ error: 'Admin panel is not configured. Set ADMIN_TOKEN_SECRET and ADMIN_PASSWORD.' });
    return;
  }
  const { password } = req.body || {};
  if (!verifyAdminPassword(password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  res.json({ success: true, token: issueToken() });
});

/** GET /api/admin/session -> validate current token */
router.get('/session', requireAdmin, (_req: Request, res: Response): void => {
  res.json({ success: true });
});

// Everything below requires a valid admin token.
router.use(requireAdmin);

// =========================================================================
// Analytics / overview
// =========================================================================

router.get('/analytics', async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = Date.now();
    const since1d = new Date(now - DAY_MS);
    const since7d = new Date(now - 7 * DAY_MS);

    const [
      totalUsers,
      totalSessions,
      runsToday,
      activeToday,
      active7d,
      coinAgg,
      earnedAgg,
      claimAgg,
      pendingClaims,
      topUser,
      recentSignups,
      recentSessions,
    ] = await Promise.all([
      db.user.count(),
      db.gameSession.count(),
      db.gameSession.count({ where: { createdAt: { gte: since1d } } }),
      db.gameSession.findMany({ where: { createdAt: { gte: since1d } }, select: { userId: true }, distinct: ['userId'] }),
      db.gameSession.findMany({ where: { createdAt: { gte: since7d } }, select: { userId: true }, distinct: ['userId'] }),
      db.user.aggregate({ _sum: { coins: true } }),
      db.gameSession.aggregate({ _sum: { coinsEarned: true } }),
      db.rewardClaim.aggregate({ _sum: { amount: true }, where: { status: { not: 'rejected' } } }),
      db.rewardClaim.count({ where: { status: 'pending' } }),
      db.user.findFirst({ orderBy: { highScore: 'desc' }, select: { highScore: true } }),
      db.user.findMany({ where: { createdAt: { gte: since7d } }, select: { createdAt: true } }),
      db.gameSession.findMany({ where: { createdAt: { gte: since7d } }, select: { createdAt: true } }),
    ]);

    const byDay = (rows: { createdAt: Date }[]) => {
      const map: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
        map[d] = 0;
      }
      for (const r of rows) {
        const d = new Date(r.createdAt).toISOString().slice(0, 10);
        if (d in map) map[d] += 1;
      }
      return Object.entries(map).map(([date, count]) => ({ date, count }));
    };

    res.json({
      totalUsers,
      totalSessions,
      activeUsersToday: activeToday.length,
      activeUsers7d: active7d.length,
      runsToday,
      coinsInCirculation: coinAgg._sum?.coins || 0,
      coinsEarnedAllTime: earnedAgg._sum?.coinsEarned || 0,
      tokensClaimedAllTime: claimAgg._sum?.amount || 0,
      pendingClaims,
      topScore: topUser?.highScore || 0,
      signupsByDay: byDay(recentSignups),
      runsByDay: byDay(recentSessions),
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// =========================================================================
// Users
// =========================================================================

router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = ((req.query.q as string) || '').trim().toLowerCase();
    const take = Math.min(100, parseInt(req.query.take as string) || 50);
    const skip = parseInt(req.query.skip as string) || 0;

    const where = q
      ? {
          OR: [
            { usernameLowercase: { contains: q } },
            { walletAddress: { contains: q } },
            { id: { contains: q } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true, username: true, walletAddress: true, coins: true,
          xp: true, highScore: true, role: true, banned: true, createdAt: true,
          _count: { select: { sessions: true } },
        },
      }),
      db.user.count({ where }),
    ]);

    res.json({
      total,
      users: rows.map((u: any) => ({
        id: u.id, username: u.username, walletAddress: u.walletAddress,
        coins: u.coins, xp: u.xp, highScore: u.highScore, role: u.role,
        banned: u.banned, createdAt: u.createdAt, sessionCount: u._count?.sessions ?? 0,
      })),
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

/** PATCH /api/admin/users/:id  { coins?, xp?, highScore?, role?, banned?, username? } */
router.patch('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { coins, xp, highScore, role, banned, username } = req.body || {};
    const data: Record<string, unknown> = {};
    if (coins !== undefined && Number.isFinite(Number(coins))) data.coins = Math.max(0, Math.floor(Number(coins)));
    if (xp !== undefined && Number.isFinite(Number(xp))) data.xp = Math.max(0, Math.floor(Number(xp)));
    if (highScore !== undefined && Number.isFinite(Number(highScore))) data.highScore = Math.max(0, Math.floor(Number(highScore)));
    if (role === 'player' || role === 'admin') data.role = role;
    if (typeof banned === 'boolean') data.banned = banned;
    if (typeof username === 'string' && username.length >= 3 && username.length <= 20) {
      data.username = username;
      data.usernameLowercase = username.toLowerCase();
    }

    const user = await db.user.update({ where: { id: String(req.params.id) }, data, include: { ship: true } });
    res.json({ success: true, user });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Username already taken' });
      return;
    }
    console.error('Admin user update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/** POST /api/admin/users/:id/ban { banned } */
router.post('/users/:id/ban', async (req: Request, res: Response): Promise<void> => {
  try {
    const banned = req.body?.banned !== false;
    const user = await db.user.update({ where: { id: String(req.params.id) }, data: { banned } });
    res.json({ success: true, banned: user.banned });
  } catch (error) {
    console.error('Admin ban error:', error);
    res.status(500).json({ error: 'Failed to update ban state' });
  }
});

/** DELETE /api/admin/users/:id — removes user and dependent rows. */
router.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    await db.$transaction([
      db.gameSession.deleteMany({ where: { userId: id } }),
      db.rewardClaim.deleteMany({ where: { userId: id } }),
      db.ship.deleteMany({ where: { userId: id } }),
      db.user.delete({ where: { id } }),
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// =========================================================================
// Sessions + anti-cheat
// =========================================================================

router.get('/sessions', async (req: Request, res: Response): Promise<void> => {
  try {
    const take = Math.min(200, parseInt(req.query.take as string) || 50);
    const skip = parseInt(req.query.skip as string) || 0;
    const suspiciousOnly = req.query.suspicious === 'true';

    const rows = await db.gameSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: suspiciousOnly ? 500 : take,
      skip: suspiciousOnly ? 0 : skip,
      include: { user: { select: { username: true } } },
    });

    let mapped = rows.map((s: any) => {
      const verdict = inspectSession(s);
      return {
        id: s.id, userId: s.userId, username: s.user?.username,
        distance: s.distance, cargoCollected: s.cargoCollected,
        coinsEarned: s.coinsEarned, xpEarned: s.xpEarned,
        createdAt: s.createdAt, suspicious: verdict.suspicious, suspicionReason: verdict.reason,
      };
    });
    if (suspiciousOnly) mapped = mapped.filter((s: any) => s.suspicious).slice(0, take);

    res.json({ sessions: mapped });
  } catch (error) {
    console.error('Admin sessions error:', error);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

router.delete('/sessions/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.gameSession.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin session delete error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// =========================================================================
// Reward-claim moderation
// =========================================================================

router.get('/claims', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const take = Math.min(200, parseInt(req.query.take as string) || 50);
    const where = status && status !== 'all' ? { status } : {};

    const rows = await db.rewardClaim.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: { user: { select: { username: true } } },
    });

    res.json({
      claims: rows.map((c: any) => ({
        id: c.id, userId: c.userId, username: c.user?.username,
        walletAddress: c.walletAddress, amount: c.amount, nonce: c.nonce,
        status: c.status, claimed: c.claimed, createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('Admin claims error:', error);
    res.status(500).json({ error: 'Failed to load claims' });
  }
});

/** POST /api/admin/claims/:id/moderate { status: 'approved' | 'rejected' } */
router.post('/claims/:id/moderate', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.body?.status;
    if (status !== 'approved' && status !== 'rejected') {
      res.status(400).json({ error: 'status must be approved or rejected' });
      return;
    }

    const claim = await db.rewardClaim.findUnique({ where: { id: String(req.params.id) } });
    if (!claim) {
      res.status(404).json({ error: 'Claim not found' });
      return;
    }

    // Rejecting an unclaimed reward refunds the coins that were deducted at sign time.
    if (status === 'rejected' && !claim.claimed && claim.status !== 'rejected') {
      await db.$transaction([
        db.user.update({ where: { id: claim.userId }, data: { coins: { increment: claim.amount } } }),
        db.rewardClaim.update({ where: { id: claim.id }, data: { status } }),
      ]);
    } else {
      await db.rewardClaim.update({ where: { id: claim.id }, data: { status } });
    }

    res.json({ success: true, status });
  } catch (error) {
    console.error('Admin claim moderate error:', error);
    res.status(500).json({ error: 'Failed to moderate claim' });
  }
});

// =========================================================================
// Game config
// =========================================================================

router.get('/config', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cfg = await getGameConfig(prisma);
    res.json({ config: cfg });
  } catch (error) {
    console.error('Admin config get error:', error);
    res.status(500).json({ error: 'Failed to load config' });
  }
});

router.put('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const cfg = await updateGameConfig(prisma, req.body || {});
    res.json({ success: true, config: cfg });
  } catch (error) {
    console.error('Admin config update error:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

export default router;

export interface ShipUpgrades {
  engineLevel: number;
  shieldLevel: number;
  fuelLevel: number;
  cargoBayLevel: number;
  magnetLevel: number;
}

export interface PlayerStats {
  id: string;
  telegramId?: string;
  walletAddress?: string;
  username: string;
  coins: number;
  xp: number;
  highScore: number;
  ship: ShipUpgrades;
}

// ===== Leaderboard =====

export type LeaderboardPeriod = 'weekly' | 'allTime';

export interface LeaderboardEntry {
  id: string;
  username: string;
  highScore: number;
  xp?: number;
  rank?: number;
}

// ===== Game economy / difficulty config (admin-tunable) =====

export interface GameConfig {
  shieldUpgradeBaseCost: number;   // cost = level * base
  fuelUpgradeBaseCost: number;
  minClaimAmount: number;          // minimum coins to withdraw as tokens
  coinToTokenRate: number;         // tokens minted per coin (usually 1)
  difficultySpeedScale: number;    // multiplier on world-speed ramp (1 = default)
  difficultySpawnScale: number;    // multiplier on spawn pressure (1 = default)
  maintenanceMode: boolean;        // when true, gameplay submission is paused
  updatedAt?: string;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  shieldUpgradeBaseCost: 150,
  fuelUpgradeBaseCost: 125,
  minClaimAmount: 100,
  coinToTokenRate: 1,
  difficultySpeedScale: 1,
  difficultySpawnScale: 1,
  maintenanceMode: false,
};

// ===== Admin dashboard DTOs =====

export type UserRole = 'player' | 'admin';
export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'claimed';

export interface AdminUserRow {
  id: string;
  username: string;
  walletAddress?: string | null;
  coins: number;
  xp: number;
  highScore: number;
  role: UserRole;
  banned: boolean;
  createdAt: string;
  sessionCount?: number;
}

export interface AdminSessionRow {
  id: string;
  userId: string;
  username?: string;
  distance: number;
  cargoCollected: number;
  coinsEarned: number;
  xpEarned: number;
  createdAt: string;
  suspicious?: boolean;      // heuristic anti-cheat flag
  suspicionReason?: string;
}

export interface AdminClaimRow {
  id: string;
  userId: string;
  username?: string;
  walletAddress: string;
  amount: number;
  nonce: number;
  status: ClaimStatus;
  claimed: boolean;
  createdAt: string;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalSessions: number;
  activeUsersToday: number;
  activeUsers7d: number;
  runsToday: number;
  coinsInCirculation: number;
  coinsEarnedAllTime: number;
  tokensClaimedAllTime: number;
  pendingClaims: number;
  topScore: number;
  signupsByDay: { date: string; count: number }[];
  runsByDay: { date: string; count: number }[];
}

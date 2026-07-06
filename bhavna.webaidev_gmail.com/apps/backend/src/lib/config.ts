import { PrismaClient } from '@prisma/client';

/**
 * Accessor for the singleton GameConfig row. Falls back to sane defaults if the
 * row/table doesn't exist yet (e.g. migration not applied), so gameplay routes
 * never hard-fail on a missing config.
 */

const DEFAULTS = {
  id: 'singleton',
  shieldUpgradeBaseCost: 150,
  fuelUpgradeBaseCost: 125,
  minClaimAmount: 100,
  coinToTokenRate: 1,
  difficultySpeedScale: 1,
  difficultySpawnScale: 1,
  maintenanceMode: false,
};

export type GameConfigRow = typeof DEFAULTS;

export async function getGameConfig(prisma: PrismaClient): Promise<GameConfigRow> {
  try {
    const anyPrisma = prisma as any;
    let cfg = await anyPrisma.gameConfig.findUnique({ where: { id: 'singleton' } });
    if (!cfg) {
      cfg = await anyPrisma.gameConfig.create({ data: { id: 'singleton' } });
    }
    return cfg as GameConfigRow;
  } catch (e) {
    // Table may not exist yet (pre-migration) — degrade gracefully.
    return { ...DEFAULTS };
  }
}

export async function updateGameConfig(
  prisma: PrismaClient,
  patch: Partial<Omit<GameConfigRow, 'id'>>
): Promise<GameConfigRow> {
  const anyPrisma = prisma as any;
  const data: Record<string, unknown> = {};
  const numericKeys = [
    'shieldUpgradeBaseCost',
    'fuelUpgradeBaseCost',
    'minClaimAmount',
    'coinToTokenRate',
    'difficultySpeedScale',
    'difficultySpawnScale',
  ] as const;

  for (const key of numericKeys) {
    if (patch[key] !== undefined && patch[key] !== null && !Number.isNaN(Number(patch[key]))) {
      data[key] = Number(patch[key]);
    }
  }
  if (typeof patch.maintenanceMode === 'boolean') {
    data.maintenanceMode = patch.maintenanceMode;
  }

  const cfg = await anyPrisma.gameConfig.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  return cfg as GameConfigRow;
}

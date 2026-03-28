export function createMonsterByStage(stage) {
  return {
    id: `monster_${stage}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'monster',
    name: `Quái Phàm Nhân tầng ${stage}`,
    realm: 'Phàm Nhân',
    stage,
    hp: stage * 100,
    maxHp: stage * 100,
    damage: stage,
    defense: Math.floor(stage / 2),
    rewardExp: 10,
    rewardSpiritStones: 1,
    damageType: 'physical',
    critChance: 0,
    critDamage: 1.5,
    dodgeChance: 0,
    lifesteal: 0,
    damageReduction: 0,
    shield: 0,
  }
}

export function createRandomFloor1Monster() {
  const stage = Math.floor(Math.random() * 10) + 1
  return createMonsterByStage(stage)
}

export function createBoss(floor = 1) {
  if (floor === 2) {
    return {
      id: `boss_floor_2_${Date.now()}`,
      type: 'boss',
      name: 'Boss Bí Cảnh Tầng 2',
      realm: 'Phàm Nhân',
      stage: 10,
      hp: 3000,
      maxHp: 3000,
      damage: 30,
      defense: 8,
      rewardExp: 50,
      damageType: 'physical',
      critChance: 0.08,
      critDamage: 1.7,
      dodgeChance: 0.03,
      lifesteal: 0,
      damageReduction: 0.05,
      shield: 20,
    }
  }

  return {
    id: `boss_floor_1_${Date.now()}`,
    type: 'boss',
    name: 'Boss Bí Cảnh',
    realm: 'Phàm Nhân',
    stage: 10,
    hp: 3000,
    maxHp: 3000,
    damage: 30,
    defense: 5,
    rewardExp: 50,
    damageType: 'physical',
    critChance: 0.05,
    critDamage: 1.5,
    dodgeChance: 0.02,
    lifesteal: 0,
    damageReduction: 0.03,
    shield: 10,
  }
}

export function getBossDrop(floor = 1) {
  const roll = Math.random()

  if (floor === 1) {
    if (roll < 0.2) {
      return {
        herbs: 1,
        spiritStones: 0,
        message: 'Boss rơi 1 dược thảo.',
      }
    }

    return {
      herbs: 0,
      spiritStones: 10,
      message: 'Boss rơi 10 linh thạch.',
    }
  }

  if (roll < 0.5) {
    return {
      herbs: 1,
      spiritStones: 0,
      message: 'Boss tầng 2 rơi 1 dược thảo.',
    }
  }

  return {
    herbs: 0,
    spiritStones: 10,
    message: 'Boss tầng 2 rơi 10 linh thạch.',
  }
}

export function canEnterDungeon(cooldownUntil) {
  const now = Date.now()

  if (!cooldownUntil || now >= cooldownUntil) {
    return { ok: true, remainMs: 0 }
  }

  return {
    ok: false,
    remainMs: cooldownUntil - now,
  }
}

export function formatCooldown(ms) {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
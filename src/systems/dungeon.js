export const DUNGEON_FLOOR_TRIAL_1 = 1
export const DUNGEON_FLOOR_TRIAL_2 = 2
export const DUNGEON_FLOOR_LANG_VUONG = 3

export const LANG_VUONG_ENTRY_COST = 100

export const dungeonFloorDefs = {
  [DUNGEON_FLOOR_TRIAL_1]: {
    id: DUNGEON_FLOOR_TRIAL_1,
    name: 'Bí Cảnh tầng 1',
    description: 'Quái ngẫu nhiên, cứ 10 mạng sẽ gặp boss.',
    entryCost: 0,
  },
  [DUNGEON_FLOOR_TRIAL_2]: {
    id: DUNGEON_FLOOR_TRIAL_2,
    name: 'Bí Cảnh tầng 2',
    description: 'Đối mặt boss tầng 2 ngay khi tiến vào.',
    entryCost: 0,
  },
  [DUNGEON_FLOOR_LANG_VUONG]: {
    id: DUNGEON_FLOOR_LANG_VUONG,
    name: 'Bí Cảnh Lang Vương',
    description: 'Phí vào 100 linh thạch, Lang Nha xuất hiện liên tục, 10% gặp Lang Vương.',
    entryCost: LANG_VUONG_ENTRY_COST,
  },
}

export function getDungeonFloorDef(floor) {
  return dungeonFloorDefs[floor] || null
}

export function getDungeonFloorLabel(floor) {
  return dungeonFloorDefs[floor]?.name || `Bí Cảnh tầng ${floor}`
}

export function getDungeonEntryCost(floor) {
  return Number(dungeonFloorDefs[floor]?.entryCost) || 0
}

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

export function createWolfFangMonster() {
  return {
    id: `wolf_fang_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'monster',
    name: 'Lang Nha',
    realm: 'Yêu thú',
    stage: 1,
    hp: 100,
    maxHp: 100,
    damage: 10,
    defense: 0,
    rewardExp: 0,
    rewardSpiritStones: 5,
    damageType: 'physical',
    critChance: 0,
    critDamage: 1.5,
    dodgeChance: 0,
    lifesteal: 0,
    damageReduction: 0,
    shield: 0,
  }
}

export function createLangVuongBoss() {
  return {
    id: `lang_vuong_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'boss',
    name: 'Lang Vương',
    realm: 'Yêu thú',
    stage: 10,
    hp: 3000,
    maxHp: 3000,
    damage: 100,
    defense: 0,
    rewardExp: 0,
    rewardSpiritStones: 100,
    damageType: 'physical',
    critChance: 0.08,
    critDamage: 1.7,
    dodgeChance: 0.02,
    lifesteal: 0,
    damageReduction: 0,
    shield: 0,
    lockedEncounter: true,
  }
}

export function createBoss(floor = 1) {
  if (floor === DUNGEON_FLOOR_TRIAL_2) {
    return {
      id: `boss_floor_2_${Date.now()}`,
      type: 'boss',
      name: 'Boss Bí Cảnh tầng 2',
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

  if (floor === DUNGEON_FLOOR_LANG_VUONG) {
    return createLangVuongBoss()
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

export function rollLangBongDamage() {
  return Math.floor(Math.random() * 21) + 30
}

export function createFloorEnemy(floor, nextKillCount = 0) {
  if (floor === DUNGEON_FLOOR_TRIAL_1) {
    if (nextKillCount > 0 && nextKillCount % 10 === 0) {
      return createBoss(DUNGEON_FLOOR_TRIAL_1)
    }

    return createRandomFloor1Monster()
  }

  if (floor === DUNGEON_FLOOR_TRIAL_2) {
    return createBoss(DUNGEON_FLOOR_TRIAL_2)
  }

  if (floor === DUNGEON_FLOOR_LANG_VUONG) {
    return Math.random() < 0.1 ? createLangVuongBoss() : createWolfFangMonster()
  }

  return null
}

export function getMonsterReward(floor, enemy) {
  if (floor === DUNGEON_FLOOR_LANG_VUONG) {
    return {
      exp: 0,
      spiritStones: 5,
      message: `Bạn đánh bại ${enemy?.name || 'Lang Nha'}, nhận 5 linh thạch.`,
    }
  }

  return {
    exp: 10,
    spiritStones: 1,
    message: `Bạn đánh bại ${enemy?.name || 'quái vật'}, nhận 10 EXP và 1 linh thạch.`,
  }
}

export function getBossDrop(floor = 1) {
  const roll = Math.random()

  if (floor === DUNGEON_FLOOR_LANG_VUONG) {
    const damage = rollLangBongDamage()

    return {
      herbs: 0,
      spiritStones: 100,
      equipments: [
        {
          defId: 'lang_bong',
          bonusStats: {
            damage,
          },
        },
      ],
      message: `Lang Vương rơi 100 linh thạch và Lang bổng +${damage} sát thương.`,
    }
  }

  if (floor === DUNGEON_FLOOR_TRIAL_1) {
    if (roll < 0.2) {
      return {
        herbs: 1,
        spiritStones: 0,
        equipments: [],
        message: 'Boss rơi 1 dược thảo.',
      }
    }

    return {
      herbs: 0,
      spiritStones: 10,
      equipments: [],
      message: 'Boss rơi 10 linh thạch.',
    }
  }

  if (roll < 0.5) {
    return {
      herbs: 1,
      spiritStones: 0,
      equipments: [],
      message: 'Boss tầng 2 rơi 1 dược thảo.',
    }
  }

  return {
    herbs: 0,
    spiritStones: 10,
    equipments: [],
    message: 'Boss tầng 2 rơi 10 linh thạch.',
  }
}

export function canLeaveDungeon(currentEnemy) {
  return !currentEnemy?.lockedEncounter
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

import { REALM_MORTAL } from './cultivation'
import { createEquipmentInstance } from './equipment'
import { normalizePlayerSkills } from './skills'

export const DEFAULT_PLAYER_NAME = 'Vô Danh'
export const RENAME_COST = 1000

export function createPlayer() {
  return normalizePlayerSkills({
    id: 'player_001',
    name: '',
    realm: REALM_MORTAL,
    stage: 1,
    exp: 0,
    spiritStones: 1200,
    herbs: 20,

    hp: 100,
    mp: 100,

    baseStats: {
      maxHp: 100,
      maxMp: 100,
      damage: 8,
      defense: 2,

      critChance: 0.1,
      critDamage: 1.5,
      dodgeChance: 0.03,
      lifesteal: 0,
      damageReduction: 0,
      shield: 0,

      physicalBonus: 0,
      spiritualBonus: 0,
      trueBonus: 0,

      physicalResist: 0,
      spiritualResist: 0,
      trueResist: 0,

      hitChance: 1,
      antiCritChance: 0,
      realmMultiplier: 1,
    },

    equipment: {
      weapon: null,
      armor: null,
      ring: null,
      boots: null,
    },

    inventory: [
      createEquipmentInstance('beginner_sword'),
      createEquipmentInstance('cloth_armor'),
      { id: 'hp_potion_small', quantity: 3 },
      { id: 'mp_potion_small', quantity: 2 },
    ],
  })
}

export function createDefaultPlayer() {
  return createPlayer()
}

export function normalizePlayerName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ')
}

export function setInitialPlayerName(player, newName) {
  const normalizedName = normalizePlayerName(newName)
  const currentName = normalizePlayerName(player?.name || '')

  if (currentName) {
    return {
      ok: false,
      message: 'Tài khoản này đã có nhân vật rồi.',
    }
  }

  if (!normalizedName) {
    return {
      ok: false,
      message: 'Vui lòng nhập tên nhân vật.',
    }
  }

  if (normalizedName.length < 2) {
    return {
      ok: false,
      message: 'Tên nhân vật phải từ 2 ký tự trở lên.',
    }
  }

  if (normalizedName.length > 20) {
    return {
      ok: false,
      message: 'Tên nhân vật tối đa 20 ký tự.',
    }
  }

  return {
    ok: true,
    player: {
      ...player,
      name: normalizedName,
    },
    message: `Đạo hiệu đã định: ${normalizedName}.`,
  }
}

export function renamePlayer(player, newName) {
  const normalizedName = normalizePlayerName(newName)
  const currentName = normalizePlayerName(player?.name || '')

  if (!normalizedName) {
    return {
      ok: false,
      message: 'Tên mới không được để trống.',
    }
  }

  if (normalizedName.length < 2) {
    return {
      ok: false,
      message: 'Tên mới phải từ 2 ký tự trở lên.',
    }
  }

  if (normalizedName.length > 20) {
    return {
      ok: false,
      message: 'Tên mới tối đa 20 ký tự.',
    }
  }

  if (!currentName) {
    return setInitialPlayerName(player, normalizedName)
  }

  if (normalizedName === currentName) {
    return {
      ok: false,
      message: 'Tên mới đang trùng với tên hiện tại.',
    }
  }

  if ((player?.spiritStones || 0) < RENAME_COST) {
    return {
      ok: false,
      message: `Không đủ ${RENAME_COST} linh thạch để đổi tên.`,
    }
  }

  return {
    ok: true,
    player: {
      ...player,
      name: normalizedName,
      spiritStones: (player.spiritStones || 0) - RENAME_COST,
    },
    message: `Đã đổi tên thành ${normalizedName}, tiêu hao ${RENAME_COST} linh thạch.`,
  }
}

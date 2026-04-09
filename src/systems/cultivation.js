export const REALM_MORTAL = 'Phàm Nhân'
export const REALM_QI = 'Luyện Khí'

const REALM_ALIASES = {
  'Phàm Nhân': REALM_MORTAL,
  'PhÃ m NhÃ¢n': REALM_MORTAL,
  'PhÃƒÂ m NhÃƒÂ¢n': REALM_MORTAL,
  'pham nhan': REALM_MORTAL,
  'phÃ m nhÃ¢n': REALM_MORTAL,
  'Luyện Khí': REALM_QI,
  'Luyá»‡n KhÃ­': REALM_QI,
  'LuyÃ¡Â»â€¡n KhÃƒÂ­': REALM_QI,
  'luyen khi': REALM_QI,
  'luyá»‡n khÃ­': REALM_QI,
}

export const REALMS = [
  { key: REALM_MORTAL, maxStage: 10 },
  { key: REALM_QI, maxStage: 10 },
]

export function normalizeRealm(realm) {
  const raw = String(realm || '').trim()
  return REALM_ALIASES[raw] || raw || REALM_MORTAL
}

export function cultivate(player) {
  return {
    ...player,
    realm: normalizeRealm(player?.realm),
    exp: (player?.exp || 0) + 1,
  }
}

export function getBreakthroughCost(player) {
  const realm = normalizeRealm(player?.realm)

  if (realm === REALM_MORTAL) {
    return { spiritStones: 100, herbs: 10 }
  }

  if (realm === REALM_QI) {
    return { spiritStones: 200, herbs: 10 }
  }

  return { spiritStones: 0, herbs: 0 }
}

export function canBreakthrough(player) {
  const cost = getBreakthroughCost(player)

  if ((player?.exp || 0) < 100) {
    return {
      ok: false,
      message: 'Chưa đủ 100 EXP để đột phá.',
    }
  }

  if ((player?.spiritStones || 0) < cost.spiritStones) {
    return {
      ok: false,
      message: `Không đủ ${cost.spiritStones} linh thạch.`,
    }
  }

  if ((player?.herbs || 0) < cost.herbs) {
    return {
      ok: false,
      message: `Không đủ ${cost.herbs} dược thảo.`,
    }
  }

  return { ok: true }
}

function applyBaseStatGrowth(player, growth) {
  const currentBase = player?.baseStats || {}

  const nextBaseStats = {
    ...currentBase,
    maxHp: (currentBase.maxHp || 0) + (growth.maxHp || 0),
    maxMp: (currentBase.maxMp || 0) + (growth.maxMp || 0),
    damage: (currentBase.damage || 0) + (growth.damage || 0),
    defense: (currentBase.defense || 0) + (growth.defense || 0),
  }

  return {
    ...player,
    hp: nextBaseStats.maxHp,
    mp: nextBaseStats.maxMp,
    baseStats: nextBaseStats,
  }
}

export function breakthrough(player) {
  const check = canBreakthrough(player)
  if (!check.ok) return check

  const realm = normalizeRealm(player?.realm)
  const cost = getBreakthroughCost({ ...player, realm })

  let updated = {
    ...player,
    realm,
    exp: 0,
    spiritStones: (player?.spiritStones || 0) - cost.spiritStones,
    herbs: (player?.herbs || 0) - cost.herbs,
  }

  if (realm === REALM_MORTAL) {
    updated = applyBaseStatGrowth(updated, {
      maxHp: 100,
      maxMp: 100,
      damage: 1,
      defense: 1,
    })

    if ((player?.stage || 1) < 10) {
      updated.stage = (player?.stage || 1) + 1

      return {
        ok: true,
        player: updated,
        message: `Đột phá thành công Phàm Nhân tầng ${updated.stage}.`,
      }
    }

    updated.realm = REALM_QI
    updated.stage = 1

    return {
      ok: true,
      player: updated,
      message: 'Đột phá thành công, bước vào Luyện Khí tầng 1.',
    }
  }

  if (realm === REALM_QI) {
    updated = applyBaseStatGrowth(updated, {
      maxHp: 200,
      maxMp: 200,
      damage: 2,
      defense: 1,
    })

    if ((player?.stage || 1) < 10) {
      updated.stage = (player?.stage || 1) + 1

      return {
        ok: true,
        player: updated,
        message: `Đột phá thành công Luyện Khí tầng ${updated.stage}.`,
      }
    }

    return {
      ok: false,
      message: 'Tạm thời đã đạt cảnh giới cao nhất.',
    }
  }

  return {
    ok: false,
    message: 'Không thể đột phá.',
  }
}

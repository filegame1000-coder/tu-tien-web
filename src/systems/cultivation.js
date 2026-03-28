export const REALMS = [
  { key: 'Phàm Nhân', maxStage: 10 },
  { key: 'Luyện Khí', maxStage: 10 },
]

export function cultivate(player) {
  return {
    ...player,
    exp: (player.exp || 0) + 1,
  }
}

export function getBreakthroughCost(player) {
  if (player.realm === 'Phàm Nhân') {
    return { spiritStones: 100, herbs: 10 }
  }

  if (player.realm === 'Luyện Khí') {
    return { spiritStones: 200, herbs: 10 }
  }

  return { spiritStones: 0, herbs: 0 }
}

export function canBreakthrough(player) {
  const cost = getBreakthroughCost(player)

  if ((player.exp || 0) < 100) {
    return {
      ok: false,
      message: 'Chưa đủ 100 EXP để đột phá.',
    }
  }

  if ((player.spiritStones || 0) < cost.spiritStones) {
    return {
      ok: false,
      message: `Không đủ ${cost.spiritStones} linh thạch.`,
    }
  }

  if ((player.herbs || 0) < cost.herbs) {
    return {
      ok: false,
      message: `Không đủ ${cost.herbs} dược thảo.`,
    }
  }

  return { ok: true }
}

/**
 * 🔥 CHỖ QUAN TRỌNG NHẤT
 * - Tăng baseStats (chỉ số gốc)
 * - Sau đó hồi FULL HP/MP theo max mới
 */
function applyBaseStatGrowth(player, growth) {
  const currentBase = player.baseStats || {}

  const nextBaseStats = {
    ...currentBase,
    maxHp: (currentBase.maxHp || 0) + (growth.maxHp || 0),
    maxMp: (currentBase.maxMp || 0) + (growth.maxMp || 0),
    damage: (currentBase.damage || 0) + (growth.damage || 0),
    defense: (currentBase.defense || 0) + (growth.defense || 0),
  }

  return {
    ...player,

    // 🔥 HỒI ĐẦY LUÔN
    hp: nextBaseStats.maxHp,
    mp: nextBaseStats.maxMp,

    baseStats: nextBaseStats,
  }
}

export function breakthrough(player) {
  const check = canBreakthrough(player)
  if (!check.ok) return check

  const cost = getBreakthroughCost(player)

  let updated = {
    ...player,
    exp: 0,
    spiritStones: (player.spiritStones || 0) - cost.spiritStones,
    herbs: (player.herbs || 0) - cost.herbs,
  }

  // =========================
  // PHÀM NHÂN
  // =========================
  if (player.realm === 'Phàm Nhân') {
    updated = applyBaseStatGrowth(updated, {
      maxHp: 100,
      maxMp: 100,
      damage: 1,
      defense: 1,
    })

    if (player.stage < 10) {
      updated.stage = player.stage + 1

      return {
        ok: true,
        player: updated,
        message: `Đột phá thành công Phàm Nhân tầng ${updated.stage}.`,
      }
    }

    // lên cảnh giới mới
    updated.realm = 'Luyện Khí'
    updated.stage = 1

    return {
      ok: true,
      player: updated,
      message: 'Đột phá thành công, bước vào Luyện Khí tầng 1.',
    }
  }

  // =========================
  // LUYỆN KHÍ
  // =========================
  if (player.realm === 'Luyện Khí') {
    updated = applyBaseStatGrowth(updated, {
      maxHp: 200,
      maxMp: 200,
      damage: 2,
      defense: 1,
    })

    if (player.stage < 10) {
      updated.stage = player.stage + 1

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
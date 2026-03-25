export const REALMS = {
  MORTAL: 'Phàm Nhân',
  QI: 'Luyện Khí'
}

export const AUTO_EXP_PER_SECOND = 1
export const OFFLINE_EXP_PER_SECOND = 1
export const MAX_OFFLINE_SECONDS = 8 * 60 * 60

export function getRequiredExp(realm) {
  if (realm === REALMS.MORTAL) return 10000
  if (realm === REALMS.QI) return 100000
  return 999999
}

export function getRealmKey(realm) {
  if (realm === REALMS.MORTAL) return 'mortal'
  if (realm === REALMS.QI) return 'qi'
  return 'mortal'
}

export function getBreakthroughRequirements(realm) {
  if (realm === REALMS.MORTAL) {
    return {
      spiritStones: 10,
      herb1: 10,
      herb2: 0,
      pill1: 1,
      pill2: 0
    }
  }

  if (realm === REALMS.QI) {
    return {
      spiritStones: 100,
      herb1: 0,
      herb2: 100,
      pill1: 0,
      pill2: 1
    }
  }

  return {
    spiritStones: 999999,
    herb1: 999999,
    herb2: 999999,
    pill1: 999999,
    pill2: 999999
  }
}

export function createDefaultPlayer() {
  return {
    realm: REALMS.MORTAL,
    realmKey: getRealmKey(REALMS.MORTAL),
    stage: 1,
    exp: 0,
    expToNext: getRequiredExp(REALMS.MORTAL),
    damage: 5,
    hp: 100,
    maxHp: 100,
    defense: 0,
    mp: 50,
    maxMp: 50,
    critRate: 0.05,
    critDamage: 1.5,

    spiritStones: 0,
    herb1: 0,
    herb2: 0,
    pill1: 0,
    pill2: 0,

    hpPotion: 0,
    mpPotion: 0,

    inventory: {
      weapon1: 1,
      armor1: 1,
      pants1: 1,
      boots1: 1
    },

    equipment: {
      weapon: null,
      armor: null,
      pants: null,
      boots: null,
      artifact: null,
      mount: null,
      pet: null,
      talisman: null
    },

    lives: 5,
    lastLifeRegen: Date.now(),

    readyToBreakthrough: false
  }
}

export function increaseStats(oldPlayer) {
  return {
    ...oldPlayer,
    damage: oldPlayer.damage + 1,
    hp: (oldPlayer.maxHp || oldPlayer.hp) + 20,
    maxHp: (oldPlayer.maxHp || oldPlayer.hp) + 20,
    defense: oldPlayer.defense + 1,
    mp: (oldPlayer.maxMp || oldPlayer.mp) + 20,
    maxMp: (oldPlayer.maxMp || oldPlayer.mp) + 20,
    critRate: +(oldPlayer.critRate + 0.01).toFixed(2),
    critDamage: +(oldPlayer.critDamage + 0.05).toFixed(2)
  }
}

export function canBreakthrough(player) {
  const req = getBreakthroughRequirements(player.realm)

  return (
    (player.exp || 0) >= (player.expToNext || 0) &&
    (player.spiritStones || 0) >= req.spiritStones &&
    (player.herb1 || 0) >= req.herb1 &&
    (player.herb2 || 0) >= req.herb2 &&
    (player.pill1 || 0) >= req.pill1 &&
    (player.pill2 || 0) >= req.pill2
  )
}

export function applyExpGain(player, amount, source = '') {
  const currentExp = player.exp || 0
  const expToNext = player.expToNext || 100
  const nextExp = Math.min(currentExp + amount, expToNext)

  let updated = {
    ...player,
    hpPotion: player.hpPotion || 0,
    mpPotion: player.mpPotion || 0,
    lives: player.lives ?? 5,
    lastLifeRegen: player.lastLifeRegen || Date.now(),
    inventory: {
      ...createDefaultPlayer().inventory,
      ...(player.inventory || {})
    },
    equipment: {
      ...createDefaultPlayer().equipment,
      ...(player.equipment || {})
    },
    realmKey: player.realmKey || getRealmKey(player.realm),
    maxHp: player.maxHp || player.hp,
    maxMp: player.maxMp || player.mp,
    exp: nextExp
  }

  let message = source ? `${source} +${amount} EXP` : `+${amount} EXP`

  if (nextExp >= expToNext) {
    updated.readyToBreakthrough = true
    message = `Đã đạt viên mãn ${updated.realm} tầng ${updated.stage}, cần đột phá.`
  }

  return {
    player: updated,
    message
  }
}

export function tryBreakthrough(player) {
  if ((player.exp || 0) < (player.expToNext || 0)) {
    return {
      success: false,
      player,
      message: 'Chưa đủ EXP để đột phá.'
    }
  }

  const req = getBreakthroughRequirements(player.realm)

  if ((player.spiritStones || 0) < req.spiritStones) {
    return {
      success: false,
      player,
      message: 'Không đủ linh thạch để đột phá.'
    }
  }

  if ((player.herb1 || 0) < req.herb1) {
    return {
      success: false,
      player,
      message: 'Không đủ thảo dược nhất phẩm để đột phá.'
    }
  }

  if ((player.herb2 || 0) < req.herb2) {
    return {
      success: false,
      player,
      message: 'Không đủ thảo dược nhị phẩm để đột phá.'
    }
  }

  if ((player.pill1 || 0) < req.pill1) {
    return {
      success: false,
      player,
      message: 'Không có Phá Cảnh Đan cấp 1.'
    }
  }

  if ((player.pill2 || 0) < req.pill2) {
    return {
      success: false,
      player,
      message: 'Không có Phá Cảnh Đan cấp 2.'
    }
  }

  let updated = {
    ...player,
    spiritStones: (player.spiritStones || 0) - req.spiritStones,
    herb1: (player.herb1 || 0) - req.herb1,
    herb2: (player.herb2 || 0) - req.herb2,
    pill1: (player.pill1 || 0) - req.pill1,
    pill2: (player.pill2 || 0) - req.pill2,
    exp: 0,
    readyToBreakthrough: false
  }

  if (updated.realm === REALMS.MORTAL && updated.stage >= 10) {
    updated = increaseStats(updated)
    updated = {
      ...updated,
      realm: REALMS.QI,
      realmKey: getRealmKey(REALMS.QI),
      stage: 1,
      expToNext: getRequiredExp(REALMS.QI)
    }

    return {
      success: true,
      player: updated,
      message: 'Chúc mừng! Bạn đã đột phá lên Luyện Khí tầng 1!'
    }
  }

  if (updated.realm === REALMS.QI && updated.stage >= 10) {
    return {
      success: false,
      player,
      message: 'Bạn đã đạt giới hạn hiện tại của bản thử nghiệm.'
    }
  }

  updated = increaseStats(updated)
  updated = {
    ...updated,
    stage: updated.stage + 1,
    expToNext: getRequiredExp(updated.realm)
  }

  return {
    success: true,
    player: updated,
    message: `Đột phá thành công! Đã lên ${updated.realm} tầng ${updated.stage}.`
  }
}
export const REALMS = {
  MORTAL: 'Phàm Nhân',
  QI: 'Luyện Khí'
}

export const AUTO_EXP_PER_SECOND = 1
export const OFFLINE_EXP_PER_SECOND = 1
export const MAX_OFFLINE_SECONDS = 8 * 60 * 60

export function getRequiredExp(realm) {
  if (realm === REALMS.MORTAL) return 100
  if (realm === REALMS.QI) return 1000
  return 999999
}

export function getNextRealm(currentRealm, currentStage) {
  if (currentRealm === REALMS.MORTAL && currentStage >= 10) {
    return {
      realm: REALMS.QI,
      stage: 1,
      expToNext: getRequiredExp(REALMS.QI),
      message: 'Chúc mừng! Bạn đã đột phá lên Luyện Khí tầng 1!'
    }
  }

  return null
}

export function createDefaultPlayer() {
  return {
    realm: REALMS.MORTAL,
    stage: 1,
    exp: 0,
    expToNext: 100,
    damage: 1,
    hp: 100,
    defense: 0,
    mp: 50,
    critRate: 0.05,
    critDamage: 1.5
  }
}

export function increaseStats(oldPlayer) {
  return {
    ...oldPlayer,
    damage: oldPlayer.damage + 1,
    hp: oldPlayer.hp + 20,
    defense: oldPlayer.defense + 1,
    mp: oldPlayer.mp + 20,
    critRate: +(oldPlayer.critRate + 0.01).toFixed(2),
    critDamage: +(oldPlayer.critDamage + 0.05).toFixed(2)
  }
}

export function applyExpGain(player, amount, source = '') {
  let updated = {
    ...player,
    exp: player.exp + amount
  }

  let message = source ? `${source} +${amount} EXP` : `+${amount} EXP`

  while (updated.exp >= updated.expToNext) {
    updated.exp -= updated.expToNext

    const nextRealmData = getNextRealm(updated.realm, updated.stage)

    if (nextRealmData) {
      updated = increaseStats(updated)
      updated = {
        ...updated,
        realm: nextRealmData.realm,
        stage: nextRealmData.stage,
        expToNext: nextRealmData.expToNext
      }
      message = nextRealmData.message
    } else {
      updated = increaseStats(updated)
      updated = {
        ...updated,
        stage: updated.stage + 1,
        expToNext: getRequiredExp(updated.realm)
      }
      message = `Đã đột phá ${updated.realm} tầng ${updated.stage}!`
    }

    if (updated.realm === REALMS.QI && updated.stage > 10) {
      updated.stage = 10
      updated.exp = updated.expToNext
      message = 'Bạn đã đạt giới hạn hiện tại của bản thử nghiệm.'
      break
    }
  }

  return {
    player: updated,
    message
  }
}
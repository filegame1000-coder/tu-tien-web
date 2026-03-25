import { REALMS } from './cultivation'

function getMonsterStatsByRealmAndStage(realm, stage) {
  let hp = 100 + (stage - 1) * 100
  let attack = 1 + (stage - 1)
  let defense = 1 + (stage - 1)

  if (realm === REALMS.QI) {
    hp = 1000 + (stage - 1) * 1000
    attack = 10 + (stage - 1) * 10
    defense = 10 + (stage - 1) * 10
  }

  // random nhẹ cho đỡ chán
  const variation = Math.random() * 0.2 + 0.9

  return {
    hp: Math.floor(hp * variation),
    attack: Math.floor(attack * variation),
    defense: Math.floor(defense * variation)
  }
}

function getRandomMonsterName(realm) {
  const mortalNames = ['Dã Lang', 'Sơn Trư', 'Hắc Xà']
  const qiNames = ['Linh Lang', 'Ma Viên', 'Huyết Bức']

  const pool = realm === REALMS.QI ? qiNames : mortalNames
  return pool[Math.floor(Math.random() * pool.length)]
}

function getRandomBossName() {
  const names = ['Yêu Vương', 'Ma Tướng', 'Hắc Sát Thú']
  return names[Math.floor(Math.random() * names.length)]
}

export function generateMonster(player) {
  const realm = player.realm
  const stage = player.stage || 1
  const stats = getMonsterStatsByRealmAndStage(realm, stage)

  return {
    type: 'normal',
    isBoss: false,
    name: `${getRandomMonsterName(realm)} - ${realm} tầng ${stage}`,
    realm,
    stage,
    hp: stats.hp,
    currentHp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    expReward: Math.floor(stats.hp / 10)
  }
}

export function generateBoss(player) {
  const realm = player.realm
  const stage = player.stage || 1
  const stats = getMonsterStatsByRealmAndStage(realm, stage)

  return {
    type: 'boss',
    isBoss: true,
    name: `${getRandomBossName()} - ${realm} tầng ${stage}`,
    realm,
    stage,
    hp: stats.hp * 3,
    currentHp: stats.hp * 3,
    attack: Math.ceil(stats.attack * 1.5),
    defense: Math.ceil(stats.defense * 1.5),
    expReward: Math.floor((stats.hp * 3) / 10),

    // 🔥 thêm crit cho boss
    critRate: 0.1,
    critDamage: 1.5
  }
}

export function getMonsterDrops(monster) {
  if (!monster) {
    return { spiritStones: 0, herb1: 0, herb2: 0 }
  }

  if (!monster.isBoss && monster.realm === REALMS.MORTAL) {
    return { spiritStones: 1, herb1: 0, herb2: 0 }
  }

  if (!monster.isBoss && monster.realm === REALMS.QI) {
    return { spiritStones: 2, herb1: 0, herb2: 0 }
  }

  if (monster.isBoss && monster.realm === REALMS.MORTAL) {
    return Math.random() < 0.1
      ? { spiritStones: 0, herb1: 1, herb2: 0 }
      : { spiritStones: 3, herb1: 0, herb2: 0 }
  }

  if (monster.isBoss && monster.realm === REALMS.QI) {
    return Math.random() < 0.1
      ? { spiritStones: 0, herb1: 0, herb2: 1 }
      : { spiritStones: 4, herb1: 0, herb2: 0 }
  }

  return { spiritStones: 0, herb1: 0, herb2: 0 }
}
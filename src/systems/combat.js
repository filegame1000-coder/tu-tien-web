function toNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback
}

function toNonNegativeNumber(value, fallback = 0) {
  return Math.max(0, toNumber(value, fallback))
}

function toPositiveNumber(value, fallback = 1) {
  return Math.max(1, toNumber(value, fallback))
}

function normalizeEntity(entity = {}) {
  const hp = toNonNegativeNumber(entity.hp, 0)
  const maxHp = toPositiveNumber(entity.maxHp, hp || 1)
  const mp = toNonNegativeNumber(entity.mp, 0)
  const maxMp = Math.max(0, toNumber(entity.maxMp, mp))
  const damage = toNonNegativeNumber(entity.damage, 0)
  const defense = toNonNegativeNumber(entity.defense, 0)

  return {
    id: entity.id ?? null,
    name: entity.name ?? 'Mục tiêu',
    type: entity.type ?? 'unit',
    hp: Math.min(hp, maxHp),
    maxHp,
    mp: Math.min(mp, maxMp),
    maxMp,
    damage,
    defense,
  }
}

function calculateDamage(attacker, defender) {
  const rawDamage = attacker.damage - defender.defense
  return Math.max(1, rawDamage)
}

export function resolveAttack(attackerInput, defenderInput) {
  const attacker = normalizeEntity(attackerInput)
  const defender = normalizeEntity(defenderInput)

  if (attacker.hp <= 0) {
    return {
      damage: 0,
      attackerNext: { ...attacker },
      defenderNext: { ...defender },
      isDefenderDead: defender.hp <= 0,
      log: `${attacker.name} đã mất sức chiến đấu.`,
    }
  }

  if (defender.hp <= 0) {
    return {
      damage: 0,
      attackerNext: { ...attacker },
      defenderNext: { ...defender },
      isDefenderDead: true,
      log: `${defender.name} đã bị đánh bại.`,
    }
  }

  const damage = calculateDamage(attacker, defender)
  const defenderNextHp = Math.max(0, defender.hp - damage)

  return {
    damage,
    attackerNext: { ...attacker },
    defenderNext: {
      ...defender,
      hp: defenderNextHp,
    },
    isDefenderDead: defenderNextHp <= 0,
    log: `${attacker.name} gây ${damage} sát thương lên ${defender.name}.`,
  }
}

export function resolveCombatRound(playerInput, enemyInput) {
  const player = normalizeEntity(playerInput)
  const enemy = normalizeEntity(enemyInput)

  if (player.hp <= 0) {
    return {
      playerAttack: null,
      enemyAttack: null,
      nextPlayer: { ...player, hp: 0 },
      nextEnemy: { ...enemy },
      isPlayerDead: true,
      isEnemyDead: enemy.hp <= 0,
      logs: ['Bạn đã mất sức chiến đấu.'],
    }
  }

  if (enemy.hp <= 0) {
    return {
      playerAttack: null,
      enemyAttack: null,
      nextPlayer: { ...player },
      nextEnemy: { ...enemy, hp: 0 },
      isPlayerDead: false,
      isEnemyDead: true,
      logs: [`${enemy.name} đã bị đánh bại.`],
    }
  }

  const playerAttack = resolveAttack(player, enemy)
  const logs = [playerAttack.log]

  if (playerAttack.isDefenderDead) {
    return {
      playerAttack,
      enemyAttack: null,
      nextPlayer: { ...playerAttack.attackerNext },
      nextEnemy: { ...playerAttack.defenderNext },
      isPlayerDead: false,
      isEnemyDead: true,
      logs,
    }
  }

  const enemyAttack = resolveAttack(playerAttack.defenderNext, playerAttack.attackerNext)
  logs.push(enemyAttack.log)

  return {
    playerAttack,
    enemyAttack,
    nextPlayer: { ...enemyAttack.defenderNext },
    nextEnemy: { ...enemyAttack.attackerNext },
    isPlayerDead: enemyAttack.defenderNext.hp <= 0,
    isEnemyDead: false,
    logs,
  }
}

export function buildCombatEntityFromPlayer(player, finalStats) {
  return normalizeEntity({
    id: player.id ?? 'player',
    name: player.name ?? 'Người chơi',
    type: 'player',
    hp: player.hp ?? finalStats.maxHp ?? 1,
    maxHp: finalStats.maxHp ?? 1,
    mp: player.mp ?? finalStats.maxMp ?? 0,
    maxMp: finalStats.maxMp ?? 0,
    damage: finalStats.damage ?? 0,
    defense: finalStats.defense ?? 0,
  })
}

export function buildCombatEntityFromEnemy(enemy) {
  return normalizeEntity({
    id: enemy.id ?? null,
    name: enemy.name ?? 'Quái',
    type: enemy.type ?? 'enemy',
    hp: enemy.hp ?? 1,
    maxHp: enemy.maxHp ?? enemy.hp ?? 1,
    mp: enemy.mp ?? 0,
    maxMp: enemy.maxMp ?? enemy.mp ?? 0,
    damage: enemy.damage ?? 0,
    defense: enemy.defense ?? 0,
  })
}
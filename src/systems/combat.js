function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function calcDamage(attack, defense, critRate = 0, critDamage = 1.5) {
  const variance = randomInt(-1, 2)

  let base = Math.max(1, attack - defense + variance)
  let isCrit = false

  if (Math.random() < critRate) {
    base = Math.floor(base * critDamage)
    isCrit = true
  }

  return {
    damage: base,
    isCrit
  }
}

export function attackMonster(player, monster) {
  const { damage, isCrit } = calcDamage(
    player.damage || 1,
    monster.defense || 0,
    player.critRate || 0,
    player.critDamage || 1.5
  )

  const nextMonster = {
    ...monster,
    currentHp: Math.max(0, monster.currentHp - damage)
  }

  return {
    damage,
    isCrit,
    monster: nextMonster,
    dead: nextMonster.currentHp <= 0
  }
}

export function attackPlayer(monster, player) {
  const { damage, isCrit } = calcDamage(
    monster.attack || 1,
    player.defense || 0
  )

  const nextPlayer = {
    ...player,
    hp: Math.max(0, player.hp - damage)
  }

  return {
    damage,
    isCrit,
    player: nextPlayer,
    dead: nextPlayer.hp <= 0
  }
}
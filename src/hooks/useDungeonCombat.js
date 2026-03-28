import {
  createBoss,
  createRandomFloor1Monster,
  getBossDrop,
} from '../systems/dungeon'
import {
  buildCombatEntityFromEnemy,
  buildCombatEntityFromPlayer,
  resolveCombatRound,
} from '../systems/combat'

export function useDungeonCombat({
  player,
  setPlayer,
  finalStats,
  pushLog,
  dungeonState,
}) {
  const {
    setActiveTab,
    currentDungeonFloor,
    setCurrentDungeonFloor,
    currentEnemy,
    setCurrentEnemy,
    killCount,
    setKillCount,
    setDungeonCooldownUntil,
    resetDungeon,
  } = dungeonState

  function exitDungeon() {
    resetDungeon()
    setDungeonCooldownUntil(null)
  }

  function spawnFloor1Enemy(nextKillCount) {
    if (nextKillCount > 0 && nextKillCount % 10 === 0) {
      return createBoss(1)
    }

    return createRandomFloor1Monster()
  }

  function handleEnterDungeon(floor) {
    setCurrentDungeonFloor(floor)

    if (floor === 1) {
      setCurrentEnemy(createRandomFloor1Monster())
      pushLog('Bạn tiến vào Bí Cảnh tầng 1.')
    } else {
      setCurrentEnemy(createBoss(2))
      pushLog('Bạn tiến vào Bí Cảnh tầng 2.')
    }

    setActiveTab('dungeon')
  }

  function handleLeaveDungeon() {
    exitDungeon()
    pushLog('Bạn rời khỏi bí cảnh.')
  }

  function handleAttackEnemy() {
    if (!currentEnemy || !currentDungeonFloor) {
      pushLog('Hiện không có mục tiêu trong bí cảnh.')
      return
    }

    if ((player.hp ?? 0) <= 0) {
      exitDungeon()
      pushLog('Bạn đã trọng thương, bị đẩy ra khỏi bí cảnh.')
      return
    }

    const playerEntity = buildCombatEntityFromPlayer(player, finalStats)
    const enemyEntity = buildCombatEntityFromEnemy(currentEnemy)

    const result = resolveCombatRound(playerEntity, enemyEntity)

    result.logs.forEach((text) => pushLog(text))

    if (result.isEnemyDead) {
      if (currentEnemy.type === 'monster') {
        setPlayer((prev) => ({
          ...prev,
          hp: result.nextPlayer.hp,
          exp: (prev.exp ?? 0) + 10,
          spiritStones: (prev.spiritStones ?? 0) + 1,
        }))

        const nextKillCount = killCount + 1
        setKillCount(nextKillCount)

        pushLog(`Bạn đánh bại ${currentEnemy.name}, nhận 10 EXP và 1 linh thạch.`)

        if (currentDungeonFloor === 1) {
          setCurrentEnemy(spawnFloor1Enemy(nextKillCount))
        } else {
          setCurrentEnemy(createBoss(2))
        }

        return
      }

      const drop = getBossDrop(currentDungeonFloor)

      setPlayer((prev) => ({
        ...prev,
        hp: result.nextPlayer.hp,
        exp: (prev.exp ?? 0) + (currentEnemy.rewardExp ?? 0),
        spiritStones: (prev.spiritStones ?? 0) + (drop.spiritStones ?? 0),
        herbs: (prev.herbs ?? 0) + (drop.herbs ?? 0),
      }))

      pushLog(
        `Bạn đánh bại ${currentEnemy.name}, nhận ${currentEnemy.rewardExp ?? 0} EXP. ${drop.message}`
      )

      if (currentDungeonFloor === 1) {
        setCurrentEnemy(createRandomFloor1Monster())
      } else {
        setCurrentEnemy(createBoss(2))
      }

      return
    }

    if (result.isPlayerDead) {
      setPlayer((prev) => ({
        ...prev,
        hp: 0,
      }))

      exitDungeon()
      pushLog('Bạn bị đánh bại và bị đẩy ra khỏi bí cảnh.')
      return
    }

    setCurrentEnemy((prev) => ({
      ...prev,
      hp: result.nextEnemy.hp,
      maxHp: result.nextEnemy.maxHp ?? prev.maxHp,
      shield: result.nextEnemy.shield ?? 0,
    }))

    setPlayer((prev) => ({
      ...prev,
      hp: result.nextPlayer.hp,
    }))
  }

  return {
    actions: {
      enterDungeon: handleEnterDungeon,
      leaveDungeon: handleLeaveDungeon,
      attackEnemy: handleAttackEnemy,
    },
  }
}
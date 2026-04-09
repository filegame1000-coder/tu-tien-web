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
import {
  attackDungeonEnemyAction,
  enterDungeonAction,
  leaveDungeonAction,
} from '../services/gameApi'

export function useDungeonCombat({
  player,
  setPlayer,
  user,
  finalStats,
  pushLog,
  pushCombatLog,
  clearCombatLog,
  replaceCombatLog,
  applyServerActionResult,
  dungeonState,
}) {
  const allowDevFallback = import.meta.env.DEV

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

  function applyDungeonResult(result) {
    applyServerActionResult(result)

    if (Array.isArray(result?.combatLogs)) {
      replaceCombatLog(result.combatLogs)
    }
  }

  function exitDungeonLocal() {
    resetDungeon()
    setDungeonCooldownUntil(null)
  }

  function spawnFloor1Enemy(nextKillCount) {
    if (nextKillCount > 0 && nextKillCount % 10 === 0) {
      return createBoss(1)
    }

    return createRandomFloor1Monster()
  }

  function enterDungeonLocal(floor) {
    clearCombatLog()
    setCurrentDungeonFloor(floor)

    if (floor === 1) {
      const enemy = createRandomFloor1Monster()
      setCurrentEnemy(enemy)
      pushLog('Ban tien vao Bi Canh tang 1. [dev local]')
      pushCombatLog('Ban tien vao Bi Canh tang 1.')
      pushCombatLog(`Gap ${enemy.name}.`)
    } else {
      const enemy = createBoss(2)
      setCurrentEnemy(enemy)
      pushLog('Ban tien vao Bi Canh tang 2. [dev local]')
      pushCombatLog('Ban tien vao Bi Canh tang 2.')
      pushCombatLog(`Gap ${enemy.name}.`)
    }

    setActiveTab('dungeon')
    return true
  }

  function leaveDungeonLocal() {
    exitDungeonLocal()
    pushLog('Ban roi khoi bi canh. [dev local]')
    pushCombatLog('Ban roi khoi bi canh.')
    return true
  }

  function attackEnemyLocal() {
    if (!currentEnemy || !currentDungeonFloor) {
      pushLog('Hien khong co muc tieu trong bi canh.')
      pushCombatLog('Khong co muc tieu de tan cong.')
      return false
    }

    if ((player.hp ?? 0) <= 0) {
      exitDungeonLocal()
      pushLog('Ban da trong thuong, bi day ra khoi bi canh. [dev local]')
      pushCombatLog('Ban da trong thuong va bi day ra khoi bi canh.')
      return false
    }

    const playerEntity = buildCombatEntityFromPlayer(player, finalStats)
    const enemyEntity = buildCombatEntityFromEnemy(currentEnemy)
    const result = resolveCombatRound(playerEntity, enemyEntity)

    result.logs.forEach((text) => {
      pushCombatLog(text)
    })

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
        pushLog(`Ban danh bai ${currentEnemy.name}, nhan 10 EXP va 1 linh thach. [dev local]`)
        pushCombatLog(`Ban danh bai ${currentEnemy.name}.`)
        pushCombatLog('Nhan 10 EXP va 1 linh thach.')

        const nextEnemy =
          currentDungeonFloor === 1
            ? spawnFloor1Enemy(nextKillCount)
            : createBoss(2)

        setCurrentEnemy(nextEnemy)
        pushCombatLog(`Ke dich tiep theo xuat hien: ${nextEnemy.name}.`)
        return true
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
        `Ban danh bai ${currentEnemy.name}, nhan ${currentEnemy.rewardExp ?? 0} EXP. ${drop.message} [dev local]`
      )
      pushCombatLog(`Ban danh bai ${currentEnemy.name}.`)
      pushCombatLog(
        `Nhan ${currentEnemy.rewardExp ?? 0} EXP, +${drop.spiritStones ?? 0} linh thach, +${drop.herbs ?? 0} duoc thao.`
      )

      const nextEnemy =
        currentDungeonFloor === 1 ? createRandomFloor1Monster() : createBoss(2)

      setCurrentEnemy(nextEnemy)
      pushCombatLog(`Ke dich tiep theo xuat hien: ${nextEnemy.name}.`)
      return true
    }

    if (result.isPlayerDead) {
      setPlayer((prev) => ({
        ...prev,
        hp: 0,
      }))

      exitDungeonLocal()
      pushLog('Ban bi danh bai va bi day ra khoi bi canh. [dev local]')
      pushCombatLog('Ban da bi danh bai va bi day ra khoi bi canh.')
      return false
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

    return true
  }

  async function handleEnterDungeon(floor) {
    if (!user) {
      return enterDungeonLocal(floor)
    }

    clearCombatLog()

    try {
      const result = await enterDungeonAction(floor)
      applyDungeonResult(result)

      if (!result?.ok) {
        return false
      }

      setActiveTab('dungeon')
      return true
    } catch (error) {
      console.error('Enter dungeon sync error:', error)
      if (allowDevFallback) {
        return enterDungeonLocal(floor)
      }
      pushLog('Khong ket noi duoc may chu bi canh.')
      return false
    }
  }

  async function handleLeaveDungeon() {
    if (!user) {
      return leaveDungeonLocal()
    }

    try {
      const result = await leaveDungeonAction()
      applyDungeonResult(result)

      if (!result?.ok) {
        return false
      }

      return true
    } catch (error) {
      console.error('Leave dungeon sync error:', error)
      if (allowDevFallback) {
        return leaveDungeonLocal()
      }
      pushLog('Khong ket noi duoc may chu bi canh.')
      return false
    }
  }

  async function handleAttackEnemy() {
    if (!currentEnemy || !currentDungeonFloor) {
      pushLog('Hien khong co muc tieu trong bi canh.')
      return false
    }

    if (!user) {
      return attackEnemyLocal()
    }

    if ((player.hp ?? 0) <= 0) {
      pushLog('Ban da trong thuong, khong the tiep tuc chien dau.')
      return false
    }

    try {
      const result = await attackDungeonEnemyAction()
      applyDungeonResult(result)

      if (!result?.ok) {
        return false
      }

      return true
    } catch (error) {
      console.error('Attack dungeon sync error:', error)
      if (allowDevFallback) {
        return attackEnemyLocal()
      }
      pushLog('Khong ket noi duoc may chu chien dau.')
      return false
    }
  }

  return {
    actions: {
      enterDungeon: handleEnterDungeon,
      leaveDungeon: handleLeaveDungeon,
      attackEnemy: handleAttackEnemy,
    },
  }
}

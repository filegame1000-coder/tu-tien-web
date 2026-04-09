import {
  createBoss,
  createRandomFloor1Monster,
  getBossDrop,
} from '../systems/dungeon'
import {
  buildCombatEntityFromEnemy,
  buildCombatEntityFromPlayer,
  resolveAttack,
  resolveCombatRound,
  resolveSkillAttack,
} from '../systems/combat'
import {
  advanceSkillCooldowns,
  consumeSkillForTurn,
  getSkillDef,
} from '../systems/skills'
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
      pushLog('Bạn tiến vào Bí Cảnh tầng 1. [dev local]')
      pushCombatLog('Bạn tiến vào Bí Cảnh tầng 1.')
      pushCombatLog(`Gặp ${enemy.name}.`)
    } else {
      const enemy = createBoss(2)
      setCurrentEnemy(enemy)
      pushLog('Bạn tiến vào Bí Cảnh tầng 2. [dev local]')
      pushCombatLog('Bạn tiến vào Bí Cảnh tầng 2.')
      pushCombatLog(`Gặp ${enemy.name}.`)
    }

    setActiveTab('dungeon')
    return true
  }

  function leaveDungeonLocal() {
    exitDungeonLocal()
    pushLog('Bạn rời khỏi bí cảnh. [dev local]')
    pushCombatLog('Bạn rời khỏi bí cảnh.')
    return true
  }

  function attackEnemyLocal(skillId = null) {
    if (!currentEnemy || !currentDungeonFloor) {
      pushLog('Hiện không có mục tiêu trong bí cảnh.')
      pushCombatLog('Không có mục tiêu để tấn công.')
      return false
    }

    if ((player.hp ?? 0) <= 0) {
      exitDungeonLocal()
      pushLog('Bạn đã trọng thương, bị đẩy ra khỏi bí cảnh. [dev local]')
      pushCombatLog('Bạn đã trọng thương và bị đẩy ra khỏi bí cảnh.')
      return false
    }

    const nextTurnPlayer = advanceSkillCooldowns(player)
    const playerEntity = buildCombatEntityFromPlayer(nextTurnPlayer, finalStats)
    const enemyEntity = buildCombatEntityFromEnemy(currentEnemy)
    let result
    let playerAfterTurn = nextTurnPlayer

    if (skillId) {
      const skillUse = consumeSkillForTurn(nextTurnPlayer, skillId)

      if (!skillUse.ok) {
        pushLog(skillUse.message)
        pushCombatLog(skillUse.message)
        return false
      }

      const skillDef = skillUse.def
      playerAfterTurn = skillUse.player
      const skillPlayerEntity = buildCombatEntityFromPlayer(playerAfterTurn, finalStats)
      const playerAttack = resolveSkillAttack(
        skillPlayerEntity,
        enemyEntity,
        skillDef.damageMultiplier
      )
      const skillLogs = [
        `${player.name || 'Bạn'} thi triển ${skillDef.name}, tiêu hao ${skillDef.manaCost} Ki, còn lại ${playerAfterTurn.mp} Ki và cường hóa 220% sát thương.`,
        playerAttack.log,
      ]

      if (playerAttack.isDefenderDead) {
        result = {
          playerAttack,
          enemyAttack: null,
          nextPlayer: {
            ...playerAfterTurn,
            hp: playerAttack.attackerNext.hp,
            mp: playerAfterTurn.mp,
          },
          nextEnemy: {
            ...currentEnemy,
            hp: playerAttack.defenderNext.hp,
            maxHp: playerAttack.defenderNext.maxHp ?? currentEnemy.maxHp,
          },
          isPlayerDead: false,
          isEnemyDead: true,
          logs: skillLogs,
        }
      } else {
        const enemyAttack = resolveAttack(playerAttack.defenderNext, {
          ...skillPlayerEntity,
          hp: playerAfterTurn.hp,
          mp: playerAfterTurn.mp,
        })
        result = {
          playerAttack,
          enemyAttack,
          nextPlayer: {
            ...playerAfterTurn,
            hp: enemyAttack.defenderNext.hp,
            mp: playerAfterTurn.mp,
          },
          nextEnemy: {
            ...currentEnemy,
            hp: enemyAttack.attackerNext.hp,
            maxHp: enemyAttack.attackerNext.maxHp ?? currentEnemy.maxHp,
          },
          isPlayerDead: enemyAttack.defenderNext.hp <= 0,
          isEnemyDead: false,
          logs: [...skillLogs, enemyAttack.log],
        }
      }
    } else {
      result = resolveCombatRound(playerEntity, enemyEntity)
      playerAfterTurn = nextTurnPlayer
    }

    result.logs.forEach((text) => {
      pushCombatLog(text)
    })

    if (result.isEnemyDead) {
      if (currentEnemy.type === 'monster') {
        setPlayer((prev) => ({
          ...playerAfterTurn,
          hp: result.nextPlayer.hp,
          exp: (prev.exp ?? 0) + 10,
          spiritStones: (prev.spiritStones ?? 0) + 1,
        }))

        const nextKillCount = killCount + 1
        setKillCount(nextKillCount)
        pushLog(`Bạn đánh bại ${currentEnemy.name}, nhận 10 EXP và 1 linh thạch. [dev local]`)
        pushCombatLog(`Bạn đánh bại ${currentEnemy.name}.`)
        pushCombatLog('Nhận 10 EXP và 1 linh thạch.')

        const nextEnemy =
          currentDungeonFloor === 1
            ? spawnFloor1Enemy(nextKillCount)
            : createBoss(2)

        setCurrentEnemy(nextEnemy)
        pushCombatLog(`Kẻ địch tiếp theo xuất hiện: ${nextEnemy.name}.`)
        return true
      }

      const drop = getBossDrop(currentDungeonFloor)

      setPlayer((prev) => ({
        ...playerAfterTurn,
        hp: result.nextPlayer.hp,
        exp: (prev.exp ?? 0) + (currentEnemy.rewardExp ?? 0),
        spiritStones: (prev.spiritStones ?? 0) + (drop.spiritStones ?? 0),
        herbs: (prev.herbs ?? 0) + (drop.herbs ?? 0),
      }))

      pushLog(
        `Bạn đánh bại ${currentEnemy.name}, nhận ${currentEnemy.rewardExp ?? 0} EXP. ${drop.message} [dev local]`
      )
      pushCombatLog(`Bạn đánh bại ${currentEnemy.name}.`)
      pushCombatLog(
        `Nhận ${currentEnemy.rewardExp ?? 0} EXP, +${drop.spiritStones ?? 0} linh thạch, +${drop.herbs ?? 0} dược thảo.`
      )

      const nextEnemy =
        currentDungeonFloor === 1 ? createRandomFloor1Monster() : createBoss(2)

      setCurrentEnemy(nextEnemy)
      pushCombatLog(`Kẻ địch tiếp theo xuất hiện: ${nextEnemy.name}.`)
      return true
    }

    if (result.isPlayerDead) {
      setPlayer(() => ({
        ...playerAfterTurn,
        hp: 0,
      }))

      exitDungeonLocal()
      pushLog('Bạn bị đánh bại và bị đẩy ra khỏi bí cảnh. [dev local]')
      pushCombatLog('Bạn đã bị đánh bại và bị đẩy ra khỏi bí cảnh.')
      return false
    }

    setCurrentEnemy((prev) => ({
      ...prev,
      hp: result.nextEnemy.hp,
      maxHp: result.nextEnemy.maxHp ?? prev.maxHp,
      shield: result.nextEnemy.shield ?? 0,
    }))

    setPlayer(() => ({
      ...playerAfterTurn,
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
      pushLog('Không kết nối được máy chủ bí cảnh.')
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
      pushLog('Không kết nối được máy chủ bí cảnh.')
      return false
    }
  }

  async function handleAttackEnemy(skillId = null) {
    if (!currentEnemy || !currentDungeonFloor) {
      pushLog('Hiện không có mục tiêu trong bí cảnh.')
      return false
    }

    if (!user) {
      return attackEnemyLocal(skillId)
    }

    if ((player.hp ?? 0) <= 0) {
      pushLog('Bạn đã trọng thương, không thể tiếp tục chiến đấu.')
      return false
    }

    try {
      const result = await attackDungeonEnemyAction(skillId)
      applyDungeonResult(result)

      if (!result?.ok) {
        return false
      }

      return true
    } catch (error) {
      console.error('Attack dungeon sync error:', error)
      if (allowDevFallback) {
        return attackEnemyLocal(skillId)
      }
      const skillDef = skillId ? getSkillDef(skillId) : null
      pushLog(
        skillDef
          ? `Không kết nối được máy chủ khi thi triển ${skillDef.name}.`
          : 'Không kết nối được máy chủ chiến đấu.'
      )
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

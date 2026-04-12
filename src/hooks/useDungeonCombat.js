import {
  canLeaveDungeon,
  createFloorEnemy,
  getBossDrop,
  getDungeonEntryCost,
  getDungeonFloorLabel,
  getMonsterReward,
} from '../systems/dungeon'
import {
  buildCombatEntityFromEnemy,
  buildCombatEntityFromPlayer,
  resolveAttack,
  resolveCombatRound,
  resolveSkillAttack,
} from '../systems/combat'
import { createEquipmentInstance } from '../systems/equipment'
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

function createDroppedEquipmentInstances(equipments = []) {
  return equipments.map((item) =>
    createEquipmentInstance(item.defId, {
      bonusStats: item.bonusStats || {},
    })
  )
}

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
  scheduleAuthoritativeRefresh,
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

  function spawnNextEnemyLocal(floor, nextKillCount = 0) {
    return createFloorEnemy(floor, nextKillCount)
  }

  function enterDungeonLocal(floor) {
    const floorLabel = getDungeonFloorLabel(floor)
    const entryCost = getDungeonEntryCost(floor)

    if (entryCost > 0 && (Number(player?.spiritStones) || 0) < entryCost) {
      pushLog(`Không đủ ${entryCost} linh thạch để vào ${floorLabel}.`)
      return false
    }

    clearCombatLog()
    setCurrentDungeonFloor(floor)

    const enemy = spawnNextEnemyLocal(floor)
    setCurrentEnemy(enemy)
    setKillCount(0)

    if (entryCost > 0) {
      setPlayer((prev) => ({
        ...prev,
        spiritStones: Math.max(0, (Number(prev?.spiritStones) || 0) - entryCost),
      }))
      pushLog(`Bạn tiến vào ${floorLabel}, tiêu hao ${entryCost} linh thạch. [dev local]`)
      pushCombatLog(`Bạn tiến vào ${floorLabel}, tiêu hao ${entryCost} linh thạch.`)
    } else {
      pushLog(`Bạn tiến vào ${floorLabel}. [dev local]`)
      pushCombatLog(`Bạn tiến vào ${floorLabel}.`)
    }

    pushCombatLog(`Gặp ${enemy.name}.`)
    setActiveTab('dungeon')
    return true
  }

  function leaveDungeonLocal() {
    if (!canLeaveDungeon(currentEnemy)) {
      pushLog('Lang Vương đã xuất hiện, không thể rời bí cảnh lúc này.')
      pushCombatLog('Lang Vương khóa chặt chiến trường, bạn không thể rời bí cảnh.')
      return false
    }

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
        `${player.name || 'Bạn'} thi triển ${skillDef.name}, tiêu hao ${skillDef.manaCost} Ki, còn lại ${playerAfterTurn.mp} Ki.`,
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
        const reward = getMonsterReward(currentDungeonFloor, currentEnemy)
        const nextKillCount = killCount + 1
        const nextEnemy = spawnNextEnemyLocal(currentDungeonFloor, nextKillCount)

        setPlayer((prev) => ({
          ...playerAfterTurn,
          hp: result.nextPlayer.hp,
          exp: (Number(prev?.exp) || 0) + (Number(reward.exp) || 0),
          spiritStones: (Number(prev?.spiritStones) || 0) + (Number(reward.spiritStones) || 0),
        }))

        setKillCount(nextKillCount)
        pushLog(`${reward.message} [dev local]`)
        pushCombatLog(`Bạn đánh bại ${currentEnemy.name}.`)
        pushCombatLog(
          reward.exp > 0
            ? `Nhận ${reward.exp} EXP và ${reward.spiritStones} linh thạch.`
            : `Nhận ${reward.spiritStones} linh thạch.`
        )

        setCurrentEnemy(nextEnemy)
        pushCombatLog(`Kẻ địch tiếp theo xuất hiện: ${nextEnemy.name}.`)
        return true
      }

      const drop = getBossDrop(currentDungeonFloor)
      const dropItems = createDroppedEquipmentInstances(drop.equipments || [])
      const nextEnemy = spawnNextEnemyLocal(currentDungeonFloor)

      setPlayer((prev) => ({
        ...playerAfterTurn,
        hp: result.nextPlayer.hp,
        exp: (Number(prev?.exp) || 0) + (Number(currentEnemy.rewardExp) || 0),
        spiritStones: (Number(prev?.spiritStones) || 0) + (Number(drop.spiritStones) || 0),
        herbs: (Number(prev?.herbs) || 0) + (Number(drop.herbs) || 0),
        inventory: [...(playerAfterTurn.inventory || []), ...dropItems],
      }))

      pushLog(`Bạn đánh bại ${currentEnemy.name}. ${drop.message} [dev local]`)
      pushCombatLog(`Bạn đánh bại ${currentEnemy.name}.`)
      pushCombatLog(drop.message)
      pushCombatLog(`Kẻ địch tiếp theo xuất hiện: ${nextEnemy.name}.`)

      setCurrentEnemy(nextEnemy)
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

      scheduleAuthoritativeRefresh?.(1000)
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

      scheduleAuthoritativeRefresh?.(1000)
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

      scheduleAuthoritativeRefresh?.(1000)
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

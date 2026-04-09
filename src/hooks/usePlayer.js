import { useEffect, useMemo, useRef, useState } from 'react'
import { loadGame, saveGame } from '../utils/save'
import {
  cultivateAction,
  breakthroughAction,
  upgradeHerbGardenAction,
  plantHerbSeedAction,
  harvestHerbSlotAction,
  harvestAllHerbsAction,
  startAlchemyCraftAction,
  claimAlchemyCraftAction,
} from '../services/gameApi'

import { createPlayer, setInitialPlayerName } from '../systems/player'

import {
  cultivate,
  breakthrough,
  getBreakthroughCost,
  normalizeRealm,
} from '../systems/cultivation'

import { equipItem, unequipItem } from '../systems/equipment'
import { getFinalStats, clampPlayerHp } from '../systems/stats'
import { useConsumable } from '../systems/consumable'

import {
  finishAlchemyCraft,
  getAlchemyRemainingMs,
  isAlchemyCraftComplete,
  startAlchemyCraft,
} from '../systems/alchemy'

import {
  createHerbGarden,
  harvestAllReadyHerbs,
  harvestHerbSlot,
  normalizeHerbGarden,
  plantHerbSeed,
  unlockHerbGardenSlot,
} from '../systems/herbGarden'

import { useDungeonCombat } from './useDungeonCombat'
import { useCombatLog } from './useCombatLog'
import { canEnterDungeon, formatCooldown } from '../systems/dungeon'

function normalizeSaveData(raw) {
  if (!raw || typeof raw !== 'object') return null

  const normalizedPlayer = raw.player
    ? {
        ...raw.player,
        realm: normalizeRealm(raw.player.realm),
      }
    : createPlayer()

  return {
    player: normalizedPlayer,
    herbGarden: normalizeHerbGarden(raw.herbGarden || createHerbGarden()),
    crafting: raw.crafting ?? null,
    message: raw.message || 'Báº¯t Ä‘áº§u con Ä‘Æ°á»ng tu luyá»‡n.',
    logs:
      Array.isArray(raw.logs) && raw.logs.length > 0
        ? raw.logs
        : ['Báº¯t Ä‘áº§u con Ä‘Æ°á»ng tu luyá»‡n.'],
    combatLogs: Array.isArray(raw.combatLogs) ? raw.combatLogs.slice(-40) : [],
    activeTab: raw.activeTab || 'cultivation',
    currentDungeonFloor: raw.currentDungeonFloor ?? null,
    currentEnemy: raw.currentEnemy ?? null,
    killCount: raw.killCount ?? 0,
    dungeonCooldownUntil: raw.dungeonCooldownUntil ?? null,
  }
}

function buildDefaultSave() {
  return normalizeSaveData({}) || {}
}

export function usePlayer(user) {
  const saved = useMemo(() => {
    return normalizeSaveData(loadGame(user?.uid)) || buildDefaultSave()
  }, [user?.uid])

  const [player, setPlayer] = useState(saved.player || createPlayer())
  const [crafting, setCrafting] = useState(saved.crafting ?? null)
  const [craftingRemainMs, setCraftingRemainMs] = useState(() =>
    getAlchemyRemainingMs(saved.crafting ?? null)
  )
  const [herbGarden, setHerbGarden] = useState(
    normalizeHerbGarden(saved.herbGarden) || createHerbGarden()
  )

  const [message, setMessage] = useState(
    saved.message || 'Báº¯t Ä‘áº§u con Ä‘Æ°á»ng tu luyá»‡n.'
  )
  const [logs, setLogs] = useState(
    Array.isArray(saved.logs) && saved.logs.length > 0
      ? saved.logs
      : ['Báº¯t Ä‘áº§u con Ä‘Æ°á»ng tu luyá»‡n.']
  )

  const [activeTab, setActiveTab] = useState(saved.activeTab || 'cultivation')
  const [currentDungeonFloor, setCurrentDungeonFloor] = useState(
    saved.currentDungeonFloor ?? null
  )
  const [currentEnemy, setCurrentEnemy] = useState(saved.currentEnemy ?? null)
  const [killCount, setKillCount] = useState(saved.killCount ?? 0)
  const [dungeonCooldownUntil, setDungeonCooldownUntil] = useState(
    saved.dungeonCooldownUntil ?? null
  )
  const [pendingAction, setPendingAction] = useState(null)

  const { combatLogs, pushCombatLog, clearCombatLog, replaceCombatLog } = useCombatLog()
  const actionInFlightRef = useRef(false)
  const alchemyClaimInFlightRef = useRef(false)
  const allowDevFallback = import.meta.env.DEV

  const finalStats = useMemo(() => getFinalStats(player), [player])
  const breakthroughCost = useMemo(() => getBreakthroughCost(player), [player])
  const needsInitialNaming = !String(player?.name || '').trim()

  const cooldownText = useMemo(() => {
    const check = canEnterDungeon(dungeonCooldownUntil)
    if (check.ok) return 'CÃ³ thá»ƒ vÃ o bÃ­ cáº£nh'
    return `Há»“i láº¡i sau: ${formatCooldown(check.remainMs)}`
  }, [dungeonCooldownUntil])

  const isCultivating = pendingAction === 'cultivate'
  const isBreakingThrough = pendingAction === 'breakthrough'
  const isActionLocked = isCultivating || isBreakingThrough

  function pushLog(text) {
    setLogs((prev) => [text, ...prev].slice(0, 20))
    setMessage(text)
  }

  function applyServerActionResult(result) {
    if (!result || typeof result !== 'object') return

    if (result.player) {
      setPlayer({
        ...result.player,
        realm: normalizeRealm(result.player.realm),
      })
    }

    if (result.herbGarden) {
      setHerbGarden(normalizeHerbGarden(result.herbGarden))
    }

    if (result.crafting !== undefined) {
      setCrafting(result.crafting ?? null)
      setCraftingRemainMs(getAlchemyRemainingMs(result.crafting ?? null))
    }

    if (Array.isArray(result.logs) && result.logs.length > 0) {
      setLogs(result.logs)
    }

    if (result.message) {
      setMessage(result.message)
    }

    if (Object.prototype.hasOwnProperty.call(result, 'currentDungeonFloor')) {
      setCurrentDungeonFloor(result.currentDungeonFloor ?? null)
    }

    if (Object.prototype.hasOwnProperty.call(result, 'currentEnemy')) {
      setCurrentEnemy(result.currentEnemy ?? null)
    }

    if (Object.prototype.hasOwnProperty.call(result, 'killCount')) {
      setKillCount(Number(result.killCount) || 0)
    }

    if (Object.prototype.hasOwnProperty.call(result, 'dungeonCooldownUntil')) {
      setDungeonCooldownUntil(result.dungeonCooldownUntil ?? null)
    }
  }

  useEffect(() => {
    const nextSaved = normalizeSaveData(loadGame(user?.uid)) || buildDefaultSave()

    setPlayer(nextSaved.player || createPlayer())
    setCrafting(nextSaved.crafting ?? null)
    setCraftingRemainMs(getAlchemyRemainingMs(nextSaved.crafting ?? null))
    setHerbGarden(
      normalizeHerbGarden(nextSaved.herbGarden) || createHerbGarden()
    )

    setMessage(nextSaved.message || 'Báº¯t Ä‘áº§u con Ä‘Æ°á»ng tu luyá»‡n.')
    setLogs(
      Array.isArray(nextSaved.logs) && nextSaved.logs.length > 0
        ? nextSaved.logs
        : ['Báº¯t Ä‘áº§u con Ä‘Æ°á»ng tu luyá»‡n.']
    )

    setActiveTab(nextSaved.activeTab || 'cultivation')
    setCurrentDungeonFloor(nextSaved.currentDungeonFloor ?? null)
    setCurrentEnemy(nextSaved.currentEnemy ?? null)
    setKillCount(nextSaved.killCount ?? 0)
    setDungeonCooldownUntil(nextSaved.dungeonCooldownUntil ?? null)
    replaceCombatLog(nextSaved.combatLogs ?? [])
    setPendingAction(null)
    actionInFlightRef.current = false
    alchemyClaimInFlightRef.current = false
  }, [user?.uid, replaceCombatLog])

  useEffect(() => {
    if (!crafting) {
      setCraftingRemainMs(0)
      return
    }

    const tick = () => {
      setCraftingRemainMs(getAlchemyRemainingMs(crafting))
    }

    tick()
    const interval = setInterval(tick, 200)

    return () => clearInterval(interval)
  }, [crafting])

  async function handleClaimAlchemyCraft(silent = false) {
    if (!crafting) return false

    if (!user) {
      const result = finishAlchemyCraft(player, crafting)

      if (!result.ok) {
        if (!silent) pushLog(result.message)
        return false
      }

      setPlayer(result.player)
      setCrafting(null)
      setCraftingRemainMs(0)
      if (!silent) pushLog(result.message)
      return true
    }

    if (alchemyClaimInFlightRef.current) return false
    alchemyClaimInFlightRef.current = true

    try {
      const result = await claimAlchemyCraftAction()

      if (!result?.ok) {
        if (!silent) {
          pushLog(result?.message || 'Khong the nhan dan duoc.')
        }
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Claim alchemy sync error:', error)
      if (allowDevFallback) {
        const result = finishAlchemyCraft(player, crafting)

        if (!result.ok) {
          if (!silent) pushLog(result.message)
          return false
        }

        setPlayer(result.player)
        setCrafting(null)
        setCraftingRemainMs(0)
        if (!silent) pushLog(result.message)
        return true
      }
      if (!silent) {
        pushLog('Khong ket noi duoc may chu luyen dan.')
      }
      return false
    } finally {
      alchemyClaimInFlightRef.current = false
    }
  }

  useEffect(() => {
    if (!crafting) return

    if (!user) {
      if (isAlchemyCraftComplete(crafting)) {
        void handleClaimAlchemyCraft()
        return
      }

      const remainMs = getAlchemyRemainingMs(crafting)
      const timeout = setTimeout(() => {
        void handleClaimAlchemyCraft()
      }, remainMs)

      return () => clearTimeout(timeout)
    }

    if (alchemyClaimInFlightRef.current) return

    const remainMs = getAlchemyRemainingMs(crafting)

    if (remainMs <= 0) {
      void handleClaimAlchemyCraft()
      return
    }

    const timeout = setTimeout(() => {
      void handleClaimAlchemyCraft()
    }, remainMs)

    return () => clearTimeout(timeout)
  }, [crafting, user])

  useEffect(() => {
    const payload = {
      player,
      herbGarden,
      crafting,
      message,
      logs,
      combatLogs,
      activeTab,
      currentDungeonFloor,
      currentEnemy,
      killCount,
      dungeonCooldownUntil,
    }

    saveGame(payload, user?.uid)
  }, [
    player,
    herbGarden,
    crafting,
    message,
    logs,
    combatLogs,
    activeTab,
    currentDungeonFloor,
    currentEnemy,
    killCount,
    dungeonCooldownUntil,
    user,
  ])

  async function handleCultivate() {
    if (actionInFlightRef.current) return false

    if (!user) {
      setPlayer((prev) => cultivate(prev))
      pushLog('Báº¡n tu luyá»‡n vÃ  nháº­n 1 EXP.')
      return true
    }

    actionInFlightRef.current = true
    setPendingAction('cultivate')

    try {
      const result = await cultivateAction()

      if (!result?.ok) {
        pushLog(result?.message || 'Tu luyá»‡n tháº¥t báº¡i.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Cultivate sync error:', error)
      if (allowDevFallback) {
        setPlayer((prev) => cultivate(prev))
        pushLog('Ban tu luyen va nhan 1 EXP. [dev local]')
        return true
      }
      pushLog('Khong ket noi duoc may chu tu luyen.')
      return false
    } finally {
      actionInFlightRef.current = false
      setPendingAction(null)
    }
  }

  async function handleBreakthrough() {
    if (actionInFlightRef.current) return false

    if (!user) {
      let success = false

      setPlayer((prev) => {
        const result = breakthrough(prev)

        if (!result.ok) {
          pushLog(result.message)
          return prev
        }

        success = true
        pushLog(result.message)
        return result.player
      })

      return success
    }

    actionInFlightRef.current = true
    setPendingAction('breakthrough')

    try {
      const result = await breakthroughAction()

      if (!result?.ok) {
        pushLog(result?.message || 'Dot pha that bai.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (err) {
      console.error('Breakthrough sync error:', err)
      if (allowDevFallback) {
        let success = false

        setPlayer((prev) => {
          const result = breakthrough(prev)

          if (!result.ok) {
            pushLog(result.message)
            return prev
          }

          success = true
          pushLog(`${result.message} [dev local]`)
          return result.player
        })

        return success
      }
      pushLog('Khong ket noi duoc may chu dot pha.')
      return false
    } finally {
      actionInFlightRef.current = false
      setPendingAction(null)
    }
  }

  function handleSetInitialName(newName) {
    const result = setInitialPlayerName(player, newName)

    if (!result.ok) {
      pushLog(result.message)
      return false
    }

    setPlayer(result.player)
    pushLog(result.message)
    return true
  }

  function handleEquipItem(instanceId) {
    setPlayer((prev) => {
      const result = equipItem(prev, instanceId)

      if (!result.ok) {
        pushLog(result.message)
        return prev
      }

      const nextPlayer = clampPlayerHp(result.player)
      pushLog(result.message)
      return nextPlayer
    })
  }

  function handleUnequipItem(slot) {
    setPlayer((prev) => {
      const result = unequipItem(prev, slot)

      if (!result.ok) {
        pushLog(result.message)
        return prev
      }

      const nextPlayer = clampPlayerHp(result.player)
      pushLog(result.message)
      return nextPlayer
    })
  }

  function handleUseItem(itemId) {
    setPlayer((prev) => {
      const result = useConsumable(prev, itemId)

      if (!result.ok) {
        pushLog(result.message || 'Khong the su dung vat pham.')
        return prev
      }

      pushLog(result.message)
      return result.player
    })
  }

  async function handleCraftPill(recipeId) {
    if (crafting) {
      pushLog('Lo dan dang ban.')
      return false
    }

    if (!user) {
      const result = startAlchemyCraft(player, recipeId)

      if (!result.ok) {
        pushLog(result.message)
        return false
      }

      setPlayer(result.player)
      setCrafting(result.craftState)
      setCraftingRemainMs(getAlchemyRemainingMs(result.craftState))
      pushLog(result.message)
      return true
    }

    try {
      const result = await startAlchemyCraftAction(recipeId)

      if (!result?.ok) {
        pushLog(result?.message || 'Khong the bat dau luyen dan.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Start alchemy sync error:', error)
      if (allowDevFallback) {
        const result = startAlchemyCraft(player, recipeId)

        if (!result.ok) {
          pushLog(result.message)
          return false
        }

        setPlayer(result.player)
        setCrafting(result.craftState)
        setCraftingRemainMs(getAlchemyRemainingMs(result.craftState))
        pushLog(`${result.message} [dev local]`)
        return true
      }
      pushLog('Khong ket noi duoc may chu luyen dan.')
      return false
    }
  }

  async function handleUpgradeHerbGarden() {
    if (!user) {
      const result = unlockHerbGardenSlot(player, herbGarden)

      if (!result.ok) {
        pushLog(result.message)
        return false
      }

      setPlayer(result.player)
      setHerbGarden(result.herbGarden)
      pushLog(result.message)
      return true
    }

    try {
      const result = await upgradeHerbGardenAction()

      if (!result?.ok) {
        pushLog(result?.message || 'Khong the mo them o linh dien.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Upgrade herb garden sync error:', error)
      if (allowDevFallback) {
        const result = unlockHerbGardenSlot(player, herbGarden)

        if (!result.ok) {
          pushLog(result.message)
          return false
        }

        setPlayer(result.player)
        setHerbGarden(result.herbGarden)
        pushLog(`${result.message} [dev local]`)
        return true
      }
      pushLog('Khong ket noi duoc may chu linh dien.')
      return false
    }
  }

  async function handlePlantHerbSeed(slotIndex) {
    if (!user) {
      const result = plantHerbSeed(herbGarden, slotIndex)

      if (!result.ok) {
        pushLog(result.message)
        return false
      }

      setHerbGarden(result.herbGarden)
      pushLog(result.message)
      return true
    }

    try {
      const result = await plantHerbSeedAction(slotIndex)

      if (!result?.ok) {
        pushLog(result?.message || 'Khong the gieo hat giong.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Plant herb sync error:', error)
      if (allowDevFallback) {
        const result = plantHerbSeed(herbGarden, slotIndex)

        if (!result.ok) {
          pushLog(result.message)
          return false
        }

        setHerbGarden(result.herbGarden)
        pushLog(`${result.message} [dev local]`)
        return true
      }
      pushLog('Khong ket noi duoc may chu linh dien.')
      return false
    }
  }

  async function handleHarvestHerbSlot(slotIndex) {
    if (!user) {
      const result = harvestHerbSlot(player, herbGarden, slotIndex)

      if (!result.ok) {
        pushLog(result.message)
        return false
      }

      setPlayer(result.player)
      setHerbGarden(result.herbGarden)
      pushLog(result.message)
      return true
    }

    try {
      const result = await harvestHerbSlotAction(slotIndex)

      if (!result?.ok) {
        pushLog(result?.message || 'Khong the thu hoach o nay.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Harvest herb slot sync error:', error)
      if (allowDevFallback) {
        const result = harvestHerbSlot(player, herbGarden, slotIndex)

        if (!result.ok) {
          pushLog(result.message)
          return false
        }

        setPlayer(result.player)
        setHerbGarden(result.herbGarden)
        pushLog(`${result.message} [dev local]`)
        return true
      }
      pushLog('Khong ket noi duoc may chu linh dien.')
      return false
    }
  }

  async function handleHarvestAllHerbs() {
    if (!user) {
      const result = harvestAllReadyHerbs(player, herbGarden)

      if (!result.ok) {
        pushLog(result.message)
        return false
      }

      setPlayer(result.player)
      setHerbGarden(result.herbGarden)
      pushLog(result.message)
      return true
    }

    try {
      const result = await harvestAllHerbsAction()

      if (!result?.ok) {
        pushLog(result?.message || 'Khong co o nao san sang thu hoach.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Harvest all herbs sync error:', error)
      if (allowDevFallback) {
        const result = harvestAllReadyHerbs(player, herbGarden)

        if (!result.ok) {
          pushLog(result.message)
          return false
        }

        setPlayer(result.player)
        setHerbGarden(result.herbGarden)
        pushLog(`${result.message} [dev local]`)
        return true
      }
      pushLog('Khong ket noi duoc may chu linh dien.')
      return false
    }
  }

  function resetDungeon() {
    setCurrentDungeonFloor(null)
    setCurrentEnemy(null)
    setKillCount(0)
  }

  const dungeonState = {
    activeTab,
    setActiveTab,
    currentDungeonFloor,
    setCurrentDungeonFloor,
    currentEnemy,
    setCurrentEnemy,
    killCount,
    setKillCount,
    dungeonCooldownUntil,
    setDungeonCooldownUntil,
    cooldownText,
    resetDungeon,
  }

  const { actions: dungeonActions } = useDungeonCombat({
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
  })

  return {
    loading: false,
    player,
    herbGarden,
    crafting,
    craftingRemainMs,
    message,
    logs,
    combatLogs,
    activeTab,
    breakthroughCost,
    finalStats,
    needsInitialNaming,
    actionState: {
      pendingAction,
      isCultivating,
      isBreakingThrough,
      isActionLocked,
    },

    dungeon: {
      currentFloor: currentDungeonFloor,
      currentEnemy,
      killCount,
      cooldownUntil: dungeonCooldownUntil,
      cooldownText,
    },

    actions: {
      setActiveTab,
      cultivate: handleCultivate,
      breakthrough: handleBreakthrough,
      setInitialName: handleSetInitialName,
      equipItem: handleEquipItem,
      unequipItem: handleUnequipItem,
      useItem: handleUseItem,
      craftPill: handleCraftPill,
      upgradeHerbGarden: handleUpgradeHerbGarden,
      plantHerbSeed: handlePlantHerbSeed,
      harvestHerbSlot: handleHarvestHerbSlot,
      harvestAllHerbs: handleHarvestAllHerbs,
      ...dungeonActions,
    },
  }
}

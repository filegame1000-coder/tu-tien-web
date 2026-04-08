import { useEffect, useMemo, useRef, useState } from 'react'
import { loadGame, saveGame } from '../utils/save'
import { loadPlayerSave, savePlayerSave } from '../services/saveRepository'

import {
  createPlayer,
  renamePlayer,
  setInitialPlayerName,
} from '../systems/player'

import {
  cultivate,
  breakthrough,
  getBreakthroughCost,
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

import { useGameLog } from './useGameLog'
import { useDungeonState } from './useDungeonState'
import { useDungeonCombat } from './useDungeonCombat'
import { useCombatLog } from './useCombatLog'

function normalizeSaveData(raw) {
  if (!raw || typeof raw !== 'object') return null

  return {
    player: raw.player || createPlayer(),
    herbGarden: normalizeHerbGarden(raw.herbGarden || createHerbGarden()),
    crafting: raw.crafting ?? null,
    message: raw.message || 'Bắt đầu con đường tu luyện.',
    logs:
      Array.isArray(raw.logs) && raw.logs.length > 0
        ? raw.logs
        : ['Bắt đầu con đường tu luyện.'],
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
  const localSaved = useMemo(() => {
    return normalizeSaveData(loadGame(user?.uid)) || buildDefaultSave()
  }, [user?.uid])

  const [loading, setLoading] = useState(!!user)
  const [hydrated, setHydrated] = useState(!user)

  const [player, setPlayer] = useState(localSaved.player || createPlayer())
  const [crafting, setCrafting] = useState(localSaved.crafting ?? null)
  const [craftingRemainMs, setCraftingRemainMs] = useState(() =>
    getAlchemyRemainingMs(localSaved.crafting ?? null)
  )
  const [herbGarden, setHerbGarden] = useState(
    normalizeHerbGarden(localSaved.herbGarden) || createHerbGarden()
  )

  const {
    message,
    logs,
    pushLog,
    setMessage,
    setLogs,
  } = useGameLog(localSaved)

  const dungeonState = useDungeonState(localSaved)

  const { combatLogs, pushCombatLog, clearCombatLog } = useCombatLog()

  const finalStats = useMemo(() => getFinalStats(player), [player])
  const breakthroughCost = useMemo(() => getBreakthroughCost(player), [player])
  const needsInitialNaming = !String(player?.name || '').trim()

  const saveTimerRef = useRef(null)
  const loadVersionRef = useRef(0)

  useEffect(() => {
    const nextLocal = normalizeSaveData(loadGame(user?.uid)) || buildDefaultSave()

    setPlayer(nextLocal.player || createPlayer())
    setCrafting(nextLocal.crafting ?? null)
    setCraftingRemainMs(getAlchemyRemainingMs(nextLocal.crafting ?? null))
    setHerbGarden(
      normalizeHerbGarden(nextLocal.herbGarden) || createHerbGarden()
    )
    setMessage(nextLocal.message || 'Bắt đầu con đường tu luyện.')
    setLogs(
      Array.isArray(nextLocal.logs) && nextLocal.logs.length > 0
        ? nextLocal.logs
        : ['Bắt đầu con đường tu luyện.']
    )
    dungeonState.setActiveTab(nextLocal.activeTab || 'cultivation')
    dungeonState.setCurrentDungeonFloor(nextLocal.currentDungeonFloor ?? null)
    dungeonState.setCurrentEnemy(nextLocal.currentEnemy ?? null)
    dungeonState.setKillCount(nextLocal.killCount ?? 0)
    dungeonState.setDungeonCooldownUntil(nextLocal.dungeonCooldownUntil ?? null)
    clearCombatLog()

    if (!user) {
      setLoading(false)
      setHydrated(true)
      return
    }

    let active = true
    const currentVersion = ++loadVersionRef.current

    setLoading(true)
    setHydrated(false)

    ;(async () => {
      try {
        const cloudRaw = await loadPlayerSave(user.uid)
        if (!active || currentVersion !== loadVersionRef.current) return

        const cloudSaved = normalizeSaveData(cloudRaw) || nextLocal

        setPlayer(cloudSaved.player || createPlayer())
        setCrafting(cloudSaved.crafting ?? null)
        setCraftingRemainMs(getAlchemyRemainingMs(cloudSaved.crafting ?? null))
        setHerbGarden(
          normalizeHerbGarden(cloudSaved.herbGarden) || createHerbGarden()
        )
        setMessage(cloudSaved.message || 'Bắt đầu con đường tu luyện.')
        setLogs(
          Array.isArray(cloudSaved.logs) && cloudSaved.logs.length > 0
            ? cloudSaved.logs
            : ['Bắt đầu con đường tu luyện.']
        )
        dungeonState.setActiveTab(cloudSaved.activeTab || 'cultivation')
        dungeonState.setCurrentDungeonFloor(cloudSaved.currentDungeonFloor ?? null)
        dungeonState.setCurrentEnemy(cloudSaved.currentEnemy ?? null)
        dungeonState.setKillCount(cloudSaved.killCount ?? 0)
        dungeonState.setDungeonCooldownUntil(
          cloudSaved.dungeonCooldownUntil ?? null
        )
        clearCombatLog()
      } catch (error) {
        console.error('Lỗi khởi tạo dữ liệu người chơi:', error)
      } finally {
        if (!active || currentVersion !== loadVersionRef.current) return
        setHydrated(true)
        setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [user?.uid])

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

  useEffect(() => {
    if (!crafting) return

    if (isAlchemyCraftComplete(crafting)) {
      setPlayer((prev) => {
        const result = finishAlchemyCraft(prev, crafting)

        if (!result.ok) {
          pushLog(result.message)
          return prev
        }

        pushLog(result.message)
        return result.player
      })

      setCrafting(null)
      setCraftingRemainMs(0)
      return
    }

    const remainMs = getAlchemyRemainingMs(crafting)

    const timeout = setTimeout(() => {
      setPlayer((prev) => {
        const result = finishAlchemyCraft(prev, crafting)

        if (!result.ok) {
          pushLog(result.message)
          return prev
        }

        pushLog(result.message)
        return result.player
      })

      setCrafting(null)
      setCraftingRemainMs(0)
    }, remainMs)

    return () => clearTimeout(timeout)
  }, [crafting, pushLog])

  useEffect(() => {
    if (!hydrated) return

    const payload = {
      player,
      herbGarden,
      crafting,
      message,
      logs,
      activeTab: dungeonState.activeTab,
      currentDungeonFloor: dungeonState.currentDungeonFloor,
      currentEnemy: dungeonState.currentEnemy,
      killCount: dungeonState.killCount,
      dungeonCooldownUntil: dungeonState.dungeonCooldownUntil,
    }

    saveGame(payload, user?.uid)

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(async () => {
      if (!user) return

      try {
        await savePlayerSave(user.uid, payload)
      } catch (error) {
        console.error('Lỗi đồng bộ cloud:', error)
      }
    }, 500)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [
    hydrated,
    player,
    herbGarden,
    crafting,
    message,
    logs,
    dungeonState.activeTab,
    dungeonState.currentDungeonFloor,
    dungeonState.currentEnemy,
    dungeonState.killCount,
    dungeonState.dungeonCooldownUntil,
    user,
  ])

  function handleCultivate() {
    setPlayer((prev) => cultivate(prev))
    pushLog('Bạn tu luyện và nhận 1 EXP.')
  }

  function handleBreakthrough() {
    setPlayer((prev) => {
      const result = breakthrough(prev)

      if (!result.ok) {
        pushLog(result.message)
        return prev
      }

      pushLog(result.message)
      return result.player
    })
  }

  function handleSetInitialName(newName) {
    let success = false

    setPlayer((prev) => {
      const result = setInitialPlayerName(prev, newName)

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

  function handleRename(newName) {
    let success = false

    setPlayer((prev) => {
      const result = renamePlayer(prev, newName)

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
        pushLog(result.message || 'Không thể sử dụng vật phẩm.')
        return prev
      }

      pushLog(result.message)
      return result.player
    })
  }

  function handleCraftPill(recipeId) {
    if (crafting) {
      pushLog('Lò đan đang bận.')
      return false
    }

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

  function handleUpgradeHerbGarden() {
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

  function handlePlantHerbSeed(slotIndex) {
    const result = plantHerbSeed(herbGarden, slotIndex)

    if (!result.ok) {
      pushLog(result.message)
      return false
    }

    setHerbGarden(result.herbGarden)
    pushLog(result.message)
    return true
  }

  function handleHarvestHerbSlot(slotIndex) {
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

  function handleHarvestAllHerbs() {
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

  const { actions: dungeonActions } = useDungeonCombat({
    player,
    setPlayer,
    finalStats,
    pushLog,
    pushCombatLog,
    clearCombatLog,
    dungeonState,
  })

  return {
    loading,
    player,
    herbGarden,
    crafting,
    craftingRemainMs,
    message,
    logs,
    combatLogs,
    activeTab: dungeonState.activeTab,
    breakthroughCost,
    finalStats,
    needsInitialNaming,

    dungeon: {
      currentFloor: dungeonState.currentDungeonFloor,
      currentEnemy: dungeonState.currentEnemy,
      killCount: dungeonState.killCount,
      cooldownUntil: dungeonState.dungeonCooldownUntil,
      cooldownText: dungeonState.cooldownText,
    },

    actions: {
      setActiveTab: dungeonState.setActiveTab,
      cultivate: handleCultivate,
      breakthrough: handleBreakthrough,
      setInitialName: handleSetInitialName,
      rename: handleRename,
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
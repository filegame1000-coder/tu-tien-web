import { useEffect, useMemo, useState } from 'react'
import {
  createPlayer,
  renamePlayer,
  setInitialPlayerName,
} from '../systems/player'
import { cultivate, breakthrough, getBreakthroughCost } from '../systems/cultivation'
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

export function usePlayerCore(
  pushLog,
  initialPlayer = null,
  initialCrafting = null,
  initialHerbGarden = null
) {
  const [player, setPlayer] = useState(initialPlayer || createPlayer())

  const [crafting, setCrafting] = useState(initialCrafting || null)
  const [craftingRemainMs, setCraftingRemainMs] = useState(() =>
    getAlchemyRemainingMs(initialCrafting)
  )

  const [herbGarden, setHerbGarden] = useState(
    normalizeHerbGarden(initialHerbGarden) || createHerbGarden()
  )

  const finalStats = useMemo(() => getFinalStats(player), [player])
  const breakthroughCost = useMemo(() => getBreakthroughCost(player), [player])
  const needsInitialNaming = !String(player?.name || '').trim()

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

  return {
    player,
    setPlayer,
    herbGarden,
    setHerbGarden,
    crafting,
    craftingRemainMs,
    finalStats,
    breakthroughCost,
    needsInitialNaming,
    actions: {
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
    },
  }
}
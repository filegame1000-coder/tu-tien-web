import { useMemo, useState } from 'react'
import {
  createPlayer,
  renamePlayer,
  setInitialPlayerName,
} from '../systems/player'
import { cultivate, breakthrough, getBreakthroughCost } from '../systems/cultivation'
import { equipItem, unequipItem } from '../systems/equipment'
import { getFinalStats, clampPlayerHp } from '../systems/stats'
import { useConsumable } from '../systems/consumable'

export function usePlayerCore(pushLog, initialPlayer = null) {
  const [player, setPlayer] = useState(initialPlayer || createPlayer())

  const finalStats = useMemo(() => getFinalStats(player), [player])
  const breakthroughCost = useMemo(() => getBreakthroughCost(player), [player])
  const needsInitialNaming = !String(player?.name || '').trim()

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

  return {
    player,
    setPlayer,
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
    },
  }
}
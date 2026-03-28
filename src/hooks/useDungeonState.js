import { useMemo, useState } from 'react'
import { canEnterDungeon, formatCooldown } from '../systems/dungeon'

export function useDungeonState(initialData = {}) {
  const [activeTab, setActiveTab] = useState(initialData.activeTab || 'cultivation')
  const [currentDungeonFloor, setCurrentDungeonFloor] = useState(
    initialData.currentDungeonFloor ?? null
  )
  const [currentEnemy, setCurrentEnemy] = useState(initialData.currentEnemy ?? null)
  const [killCount, setKillCount] = useState(initialData.killCount ?? 0)
  const [dungeonCooldownUntil, setDungeonCooldownUntil] = useState(
    initialData.dungeonCooldownUntil ?? null
  )

  const cooldownText = useMemo(() => {
    const check = canEnterDungeon(dungeonCooldownUntil)
    if (check.ok) return 'Có thể vào bí cảnh'
    return `Hồi lại sau: ${formatCooldown(check.remainMs)}`
  }, [dungeonCooldownUntil])

  function resetDungeon() {
    setCurrentDungeonFloor(null)
    setCurrentEnemy(null)
    setKillCount(0)
  }

  return {
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
}
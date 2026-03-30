import { useEffect, useMemo, useRef } from 'react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { loadGame, saveGame } from '../utils/save'
import { createPlayer } from '../systems/player'
import { createHerbGarden, normalizeHerbGarden } from '../systems/herbGarden'
import { useGameLog } from './useGameLog'
import { usePlayerCore } from './usePlayerCore'
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
    logs: Array.isArray(raw.logs) ? raw.logs : [],
    activeTab: raw.activeTab || 'cultivation',
    currentDungeonFloor: raw.currentDungeonFloor ?? null,
    currentEnemy: raw.currentEnemy ?? null,
    killCount: raw.killCount ?? 0,
    dungeonCooldownUntil: raw.dungeonCooldownUntil ?? null,
  }
}

export function usePlayer(user) {
  const saved = useMemo(() => normalizeSaveData(loadGame(user?.uid)) || {}, [user])

  const { message, logs, pushLog } = useGameLog(saved)

  const {
    player,
    setPlayer,
    herbGarden,
    finalStats,
    breakthroughCost,
    needsInitialNaming,
    crafting,
    craftingRemainMs,
    actions: playerActions,
  } = usePlayerCore(pushLog, saved.player, saved.crafting, saved.herbGarden)

  const dungeonState = useDungeonState(saved)

  const { combatLogs, pushCombatLog, clearCombatLog } = useCombatLog()

  const { actions: dungeonActions } = useDungeonCombat({
    player,
    setPlayer,
    finalStats,
    pushLog,
    pushCombatLog,
    clearCombatLog,
    dungeonState,
  })

  const saveTimerRef = useRef(null)

  useEffect(() => {
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
        await setDoc(
          doc(db, 'users', user.uid),
          {
            saveData: payload,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } catch (error) {
        console.error('Lỗi save cloud:', error)
      }
    }, 500)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [
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

  return {
    loading: false,
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
      ...playerActions,
      ...dungeonActions,
    },
  }
}
import { useEffect, useRef, useState } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { loadGame, saveGame, clearGameSave } from '../utils/save'
import { createPlayer } from '../systems/player'
import { useGameLog } from './useGameLog'
import { usePlayerCore } from './usePlayerCore'
import { useDungeonState } from './useDungeonState'
import { useDungeonCombat } from './useDungeonCombat'

function normalizeSaveData(raw) {
  if (!raw || typeof raw !== 'object') return null

  return {
    version: raw.version ?? 1,
    player: raw.player || createPlayer(),
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
    updatedAt: Number(raw.updatedAt) || 0,
  }
}

function buildSavePayload({ player, message, logs, dungeonState }) {
  return {
    version: 1,
    player,
    message,
    logs,
    activeTab: dungeonState.activeTab,
    currentDungeonFloor: dungeonState.currentDungeonFloor,
    currentEnemy: dungeonState.currentEnemy,
    killCount: dungeonState.killCount,
    dungeonCooldownUntil: dungeonState.dungeonCooldownUntil,
    updatedAt: Date.now(),
  }
}

export function usePlayer(user) {
  const [loading, setLoading] = useState(Boolean(user))
  const [initialData, setInitialData] = useState(() => ({
    player: createPlayer(),
    message: 'Bắt đầu con đường tu luyện.',
    logs: ['Bắt đầu con đường tu luyện.'],
    activeTab: 'cultivation',
    currentDungeonFloor: null,
    currentEnemy: null,
    killCount: 0,
    dungeonCooldownUntil: null,
  }))

  const {
    message,
    logs,
    pushLog,
    setMessage,
    setLogs,
  } = useGameLog({
    message: initialData.message,
    logs: initialData.logs,
  })

  const {
    player,
    setPlayer,
    finalStats,
    breakthroughCost,
    needsInitialNaming,
    actions: playerActions,
  } = usePlayerCore(pushLog, initialData.player)

  const dungeonState = useDungeonState({
    activeTab: initialData.activeTab,
    currentDungeonFloor: initialData.currentDungeonFloor,
    currentEnemy: initialData.currentEnemy,
    killCount: initialData.killCount,
    dungeonCooldownUntil: initialData.dungeonCooldownUntil,
  })

  const { actions: dungeonActions } = useDungeonCombat({
    player,
    setPlayer,
    finalStats,
    pushLog,
    dungeonState,
  })

  const hydratedRef = useRef(false)
  const saveTimerRef = useRef(null)

  function applySaveData(data) {
    const safe = normalizeSaveData(data)
    if (!safe) return

    setPlayer(safe.player || createPlayer())
    setMessage(safe.message || 'Bắt đầu con đường tu luyện.')
    setLogs(
      Array.isArray(safe.logs) && safe.logs.length > 0
        ? safe.logs
        : ['Bắt đầu con đường tu luyện.']
    )

    dungeonState.setActiveTab(safe.activeTab || 'cultivation')
    dungeonState.setCurrentDungeonFloor(safe.currentDungeonFloor ?? null)
    dungeonState.setCurrentEnemy(safe.currentEnemy ?? null)
    dungeonState.setKillCount(safe.killCount ?? 0)
    dungeonState.setDungeonCooldownUntil(safe.dungeonCooldownUntil ?? null)
  }

  useEffect(() => {
    let alive = true

    async function hydrate() {
      if (!user) {
        hydratedRef.current = false
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const ref = doc(db, 'users', user.uid)
        const snap = await getDoc(ref)

        const cloudSave = normalizeSaveData(snap.data()?.saveData)

        if (cloudSave) {
          if (!alive) return
          applySaveData(cloudSave)
          saveGame(cloudSave, user.uid)
        } else {
          clearGameSave(user.uid)

          const starter = {
            version: 1,
            player: createPlayer(),
            message: 'Bắt đầu con đường tu luyện.',
            logs: ['Bắt đầu con đường tu luyện.'],
            activeTab: 'cultivation',
            currentDungeonFloor: null,
            currentEnemy: null,
            killCount: 0,
            dungeonCooldownUntil: null,
            updatedAt: Date.now(),
          }

          if (!alive) return
          applySaveData(starter)

          await setDoc(
            ref,
            {
              email: user.email || '',
              role: 'player',
              updatedAt: serverTimestamp(),
              saveData: starter,
            },
            { merge: true }
          )

          saveGame(starter, user.uid)
        }

        hydratedRef.current = true
      } catch (error) {
        console.error('Lỗi hydrate save:', error)
        hydratedRef.current = true
      } finally {
        if (alive) setLoading(false)
      }
    }

    hydrate()

    return () => {
      alive = false
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    if (!hydratedRef.current) return

    const payload = buildSavePayload({
      player,
      message,
      logs,
      dungeonState,
    })

    saveGame(payload, user.uid)

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            email: user.email || '',
            role: 'player',
            updatedAt: serverTimestamp(),
            saveData: payload,
          },
          { merge: true }
        )
      } catch (error) {
        console.error('Lỗi save cloud:', error)
      }
    }, 500)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [
    user,
    player,
    message,
    logs,
    dungeonState.activeTab,
    dungeonState.currentDungeonFloor,
    dungeonState.currentEnemy,
    dungeonState.killCount,
    dungeonState.dungeonCooldownUntil,
  ])

  return {
    loading,
    player,
    message,
    logs,
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
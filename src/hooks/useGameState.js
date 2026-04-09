import { useEffect, useMemo, useState } from 'react'
import { clearGameSave, loadGame, saveGame } from '../utils/save'
import {
  applyExpGain,
  AUTO_EXP_PER_SECOND,
  createDefaultPlayer,
  MAX_OFFLINE_SECONDS,
  OFFLINE_EXP_PER_SECOND,
  tryBreakthrough
} from '../systems/cultivation'
import {
  generateBoss,
  generateMonster,
  getMonsterDrops
} from '../systems/monsters'
import { attackMonster, attackPlayer } from '../systems/combat'
import { equipItem, getEquippedBonuses } from '../systems/equipment'

export function useGameState({ user, authReady }) {
  // ✅ FIX QUAN TRỌNG: phải gọi function
  const [player, setPlayer] = useState(createDefaultPlayer())
  const [log, setLog] = useState('Bắt đầu con đường tu luyện...')
  const [autoTraining, setAutoTraining] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [combatBusy, setCombatBusy] = useState(false)
  const [currentMonster, setCurrentMonster] = useState(null)
  const [offlineReward, setOfflineReward] = useState({ seconds: 0, exp: 0 })
  const [activeTab, setActiveTab] = useState('cultivate')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const syncScreen = () => {
      setIsMobile(window.innerWidth < 900)
    }
    syncScreen()
    window.addEventListener('resize', syncScreen)
    return () => window.removeEventListener('resize', syncScreen)
  }, [])

  // ✅ Guard an toàn
  const equippedBonuses = useMemo(
    () => (player ? getEquippedBonuses(player) : { damage: 0, defense: 0, maxHp: 0 }),
    [player]
  )

  const finalDamage = (player?.damage || 0) + equippedBonuses.damage
  const finalDefense = (player?.defense || 0) + equippedBonuses.defense
  const finalMaxHp = (player?.maxHp || 0) + equippedBonuses.maxHp
  const finalHp = Math.min(player?.hp || 0, finalMaxHp)

  const lifeRegenText = useMemo(() => {
    if ((player?.lives || 0) >= 5) return 'Đầy mạng'
    const now = Date.now()
    const diff = now - (player?.lastLifeRegen || now)
    const remainMs = Math.max(0, 60 * 60 * 1000 - diff)
    const totalSeconds = Math.floor(remainMs / 1000)
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
    const seconds = String(totalSeconds % 60).padStart(2, '0')
    return `${minutes}:${seconds} hồi 1 mạng`
  }, [player?.lives, player?.lastLifeRegen])

  function cultivate(amount = 1, source = '') {
    setPlayer((prev) => {
      const result = applyExpGain(prev, amount, source)
      setLog(result.message)
      return result.player
    })
  }

  function handleCultivate() {
    cultivate(1, 'Tu luyện')
  }

  function handleToggleAutoTraining() {
    setAutoTraining((prev) => !prev)
  }

  function handleBreakthrough() {
    const result = tryBreakthrough(player)
    setPlayer(result.player)
    setLog(result.message)
  }

  function handleEquip(itemKey) {
    const result = equipItem(player, itemKey)
    setPlayer(result.player)
    setLog(result.message)
  }

  function handleSpawnMonster() {
    const monster = generateMonster(player)
    setCurrentMonster(monster)
    setActiveTab('dungeon')
    setLog(`Bạn gặp ${monster.name}!`)
  }

  function handleSpawnBoss() {
    const boss = generateBoss(player)
    setCurrentMonster(boss)
    setActiveTab('dungeon')
    setLog(`Boss xuất hiện: ${boss.name}!`)
  }

  function handleAttackMonster() {
    if (!currentMonster || combatBusy) return
    setCombatBusy(true)

    const combatPlayer = {
      ...player,
      damage: finalDamage,
      defense: finalDefense,
      maxHp: finalMaxHp
    }

    const playerTurn = attackMonster(combatPlayer, currentMonster)

    if (playerTurn.dead) {
      setCurrentMonster(null)
      setLog(`Bạn đã đánh bại ${currentMonster.name}!`)
      setCombatBusy(false)
      return
    }

    const monsterTurn = attackPlayer(playerTurn.monster, combatPlayer)

    if (monsterTurn.dead) {
      setCurrentMonster(null)
      setLog('Bạn đã bị đánh bại.')
      setCombatBusy(false)
      return
    }

    setCurrentMonster(playerTurn.monster)
    setPlayer((prev) => ({ ...prev, hp: monsterTurn.player.hp }))
    setLog(`Combat diễn ra...`)
    setCombatBusy(false)
  }

  function handleResetSave() {
    if (!window.confirm('Xóa dữ liệu?')) return
    clearGameSave()
    setPlayer(createDefaultPlayer())
    setLog('Reset thành công.')
  }

  // ✅ Guard cực quan trọng
  useEffect(() => {
    if (!authReady || !user) return

    const savedData = loadGame()

    if (savedData) {
      setPlayer(savedData.player || createDefaultPlayer())
      setLog(savedData.log || 'Đã load dữ liệu.')
      setCurrentMonster(savedData.currentMonster || null)
      setAutoTraining(savedData.autoTraining || false)
    }

    setIsLoaded(true)
  }, [authReady, user])

  useEffect(() => {
    if (!isLoaded || !user) return

    const data = {
      player,
      autoTraining,
      currentMonster,
      log,
      lastSeenAt: Date.now()
    }

    saveGame(data)
  }, [player, autoTraining, currentMonster, log, isLoaded, user])

  return {
    state: {
      player,
      log,
      autoTraining,
      combatBusy,
      currentMonster,
      offlineReward,
      activeTab,
      isMobile
    },
    derived: {
      finalDamage,
      finalDefense,
      finalMaxHp,
      finalHp,
      lifeRegenText,
      AUTO_EXP_PER_SECOND,
MAX_OFFLINE_SECONDS
    },
    actions: {
      setActiveTab,
      cultivate: handleCultivate,
      toggleAutoTraining: handleToggleAutoTraining,
      breakthrough: handleBreakthrough,
      equip: handleEquip,
      spawnMonster: handleSpawnMonster,
      spawnBoss: handleSpawnBoss,
      attackMonster: handleAttackMonster,
      resetSave: handleResetSave
    }
  }
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { loadGame, saveGame } from '../utils/save'
import {
  cultivateAction,
  breakthroughAction,
  setInitialNameAction,
  syncPublicPlayerAction,
  useItemAction,
  equipItemAction,
  unequipItemAction,
  equipCombatSkillAction,
  unequipCombatSkillAction,
  purchaseShopItemAction,
  listMarketListingsAction,
  createMarketListingAction,
  cancelMarketListingAction,
  buyMarketListingAction,
  redeemRewardCodeAction,
  createRewardCodeAction,
  deleteRewardCodeAction,
  listRewardCodesAction,
  updateRewardCodeAction,
  upgradeHerbGardenAction,
  plantHerbSeedAction,
  harvestHerbSlotAction,
  harvestAllHerbsAction,
  startAlchemyCraftAction,
  claimAlchemyCraftAction,
  fetchWorldBossAction,
  attackWorldBossAction,
  quickReviveWorldBossAction,
  claimWorldBossRankingRewardAction,
  fetchWelfareStateAction,
  claimLoginRewardAction,
  claimDailyMissionRewardAction,
  claimDailyActivityRewardAction,
} from '../services/gameApi'
import { db } from '../firebase'

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
import {
  equipSkill,
  getEquippedSkillEntries,
  getLearnedSkillEntries,
  normalizePlayerSkills,
  unequipSkill,
} from '../systems/skills'
import { purchaseShopItem } from '../systems/shop'
import {
  applyWelfareProgressState,
  createDefaultWelfareState,
  normalizeWelfareState,
} from '../systems/welfare'

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

  const skillReadyPlayer = normalizePlayerSkills(normalizedPlayer)

  return {
    player: skillReadyPlayer,
    herbGarden: normalizeHerbGarden(raw.herbGarden || createHerbGarden()),
    crafting: raw.crafting ?? null,
    message: raw.message || 'Bắt đầu con đường tu luyện.',
    logs:
      Array.isArray(raw.logs) && raw.logs.length > 0
        ? raw.logs
        : ['Bắt đầu con đường tu luyện.'],
    combatLogs: Array.isArray(raw.combatLogs) ? raw.combatLogs.slice(-40) : [],
    activeTab: raw.activeTab || 'cultivation',
    currentDungeonFloor: raw.currentDungeonFloor ?? null,
    currentEnemy: raw.currentEnemy ?? null,
    killCount: raw.killCount ?? 0,
    dungeonCooldownUntil: raw.dungeonCooldownUntil ?? null,
    welfare: normalizeWelfareState(raw.welfare || createDefaultWelfareState()),
  }
}

function buildDefaultSave() {
  return normalizeSaveData({}) || {}
}

async function loadCloudSave(uid) {
  if (!uid) return null

  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null

  return normalizeSaveData(snap.data()?.saveData)
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
    saved.message || 'Bắt đầu con đường tu luyện.'
  )
  const [logs, setLogs] = useState(
    Array.isArray(saved.logs) && saved.logs.length > 0
      ? saved.logs
      : ['Bắt đầu con đường tu luyện.']
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
  const [welfare, setWelfare] = useState(
    normalizeWelfareState(saved.welfare || createDefaultWelfareState())
  )
  const [pendingAction, setPendingAction] = useState(null)
  const [loading, setLoading] = useState(true)

  const { combatLogs, pushCombatLog, clearCombatLog, replaceCombatLog } = useCombatLog()
  const actionInFlightRef = useRef(false)
  const alchemyClaimInFlightRef = useRef(false)
  const publicSyncRef = useRef('')
  const allowDevFallback = import.meta.env.DEV

  const finalStats = useMemo(() => getFinalStats(player), [player])
  const breakthroughCost = useMemo(() => getBreakthroughCost(player), [player])
  const needsInitialNaming = !String(player?.name || '').trim()

  const cooldownText = useMemo(() => {
    const check = canEnterDungeon(dungeonCooldownUntil)
    if (check.ok) return 'Có thể vào bí cảnh'
    return `Hồi lại sau: ${formatCooldown(check.remainMs)}`
  }, [dungeonCooldownUntil])

  const isCultivating = pendingAction === 'cultivate'
  const isBreakingThrough = pendingAction === 'breakthrough'
  const isActionLocked = isCultivating || isBreakingThrough

  function pushLog(text) {
    setLogs((prev) => [text, ...prev].slice(0, 20))
    setMessage(text)
  }

  function applyLocalWelfareProgress(progressPatch) {
    setWelfare((prev) => applyWelfareProgressState(prev, progressPatch))
  }

  function applyServerActionResult(result) {
    if (!result || typeof result !== 'object') return

    if (result.player) {
      setPlayer({
        ...normalizePlayerSkills(result.player),
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

    if (Object.prototype.hasOwnProperty.call(result, 'welfare')) {
      setWelfare(normalizeWelfareState(result.welfare))
    }
  }

  function applyLoadedSave(nextSaved) {
    setPlayer(normalizePlayerSkills(nextSaved.player || createPlayer()))
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
    setWelfare(normalizeWelfareState(nextSaved.welfare || createDefaultWelfareState()))
    replaceCombatLog(nextSaved.combatLogs ?? [])
  }

  useEffect(() => {
    const nextSaved = normalizeSaveData(loadGame(user?.uid)) || buildDefaultSave()

    setPlayer(normalizePlayerSkills(nextSaved.player || createPlayer()))
    setCrafting(nextSaved.crafting ?? null)
    setCraftingRemainMs(getAlchemyRemainingMs(nextSaved.crafting ?? null))
    setHerbGarden(
      normalizeHerbGarden(nextSaved.herbGarden) || createHerbGarden()
    )

    setMessage(nextSaved.message || 'Bắt đầu con đường tu luyện.')
    setLogs(
      Array.isArray(nextSaved.logs) && nextSaved.logs.length > 0
        ? nextSaved.logs
        : ['Bắt đầu con đường tu luyện.']
    )

    setActiveTab(nextSaved.activeTab || 'cultivation')
    setCurrentDungeonFloor(nextSaved.currentDungeonFloor ?? null)
    setCurrentEnemy(nextSaved.currentEnemy ?? null)
    setKillCount(nextSaved.killCount ?? 0)
    setDungeonCooldownUntil(nextSaved.dungeonCooldownUntil ?? null)
    setWelfare(normalizeWelfareState(nextSaved.welfare || createDefaultWelfareState()))
    replaceCombatLog(nextSaved.combatLogs ?? [])
    setPendingAction(null)
    actionInFlightRef.current = false
    alchemyClaimInFlightRef.current = false
  }, [user?.uid, replaceCombatLog])

  useEffect(() => {
    let active = true
    publicSyncRef.current = ''

    if (!user?.uid) {
      setLoading(false)
      return () => {
        active = false
      }
    }

    setLoading(true)

    ;(async () => {
      try {
        const cloudSave = await loadCloudSave(user.uid)
        if (!active) return

        if (cloudSave) {
          applyLoadedSave(cloudSave)
          saveGame(cloudSave, user.uid)
        }
      } catch (error) {
        console.error('Cloud save hydrate error:', error)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [user?.uid, replaceCombatLog])

  useEffect(() => {
    if (!user?.uid) return

    const normalizedName = String(player?.name || '').trim()
    if (!normalizedName) return

    const syncKey = `${user.uid}:${normalizedName}:${player?.realm || ''}:${player?.stage || 1}`
    if (publicSyncRef.current === syncKey) return

    publicSyncRef.current = syncKey

    ;(async () => {
      try {
        await syncPublicPlayerAction()
      } catch (error) {
        console.error('Public player sync error:', error)
      }
    })()
  }, [user?.uid, player?.name, player?.realm, player?.stage])

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
          pushLog(result?.message || 'Không thể nhận đan được.')
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
        pushLog('Không kết nối được máy chủ luyện đan.')
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
      welfare,
    }

    saveGame(payload, user?.uid)
  }, [
    player,
    herbGarden,
    crafting,
    message,
    logs,
    combatLogs,
    welfare,
    activeTab,
    currentDungeonFloor,
    currentEnemy,
    killCount,
    dungeonCooldownUntil,
    welfare,
    user,
  ])

  async function handleCultivate() {
    if (actionInFlightRef.current) return false

    if (!user) {
      setPlayer((prev) => cultivate(prev))
      applyLocalWelfareProgress({ cultivate_10: 1 })
      pushLog('Bạn tu luyện và nhận 1 EXP.')
      return true
    }

    actionInFlightRef.current = true
    setPendingAction('cultivate')

    try {
      const result = await cultivateAction()

      if (!result?.ok) {
        pushLog(result?.message || 'Tu luyện thất bại.')
        return false
      }

      applyServerActionResult(result)
      if (!result?.welfare) {
        void handleFetchWelfareState()
      }
      return true
    } catch (error) {
      console.error('Cultivate sync error:', error)
      if (allowDevFallback) {
        setPlayer((prev) => cultivate(prev))
        applyLocalWelfareProgress({ cultivate_10: 1 })
        pushLog('Bạn tu luyện và nhận 1 EXP. [dev local]')
        return true
      }
      pushLog('Không kết nối được máy chủ tu luyện.')
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
        pushLog(result?.message || 'Đột phá thất bại.')
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
      pushLog('Không kết nối được máy chủ đột phá.')
      return false
    } finally {
      actionInFlightRef.current = false
      setPendingAction(null)
    }
  }

  async function handleSetInitialName(newName) {
    if (!user) {
      const result = setInitialPlayerName(player, newName)

      if (!result.ok) {
        pushLog(result.message)
        return false
      }

      setPlayer(result.player)
      pushLog(result.message)
      return true
    }

    try {
      const result = await setInitialNameAction(newName)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể đặt đạo hiệu.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Set initial name sync error:', error)
      if (allowDevFallback) {
        const result = setInitialPlayerName(player, newName)

        if (!result.ok) {
          pushLog(result.message)
          return false
        }

        setPlayer(result.player)
        pushLog(`${result.message} [dev local]`)
        return true
      }
      pushLog('Không kết nối được máy chủ đặt đạo hiệu.')
      return false
    }
  }

  async function handleEquipItem(instanceId) {
    if (!user) {
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
      return true
    }

    try {
      const result = await equipItemAction(instanceId)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể trang bị vật phẩm.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Equip item sync error:', error)
      if (allowDevFallback) {
        setPlayer((prev) => {
          const result = equipItem(prev, instanceId)

          if (!result.ok) {
            pushLog(result.message)
            return prev
          }

          const nextPlayer = clampPlayerHp(result.player)
          pushLog(`${result.message} [dev local]`)
          return nextPlayer
        })
        return true
      }
      pushLog('Không kết nối được máy chủ trang bị.')
      return false
    }
  }

  async function handleEquipSkill(skillId, slotIndex) {
    const applyLocal = () => {
      let success = false

      setPlayer((prev) => {
        const result = equipSkill(prev, skillId, slotIndex)

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

    if (!user) {
      return applyLocal()
    }

    try {
      const result = await equipCombatSkillAction(skillId, slotIndex)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể trang bị kỹ năng.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Equip skill sync error:', error)
      if (allowDevFallback) {
        return applyLocal()
      }
      pushLog('Không kết nối được máy chủ trang bị kỹ năng.')
      return false
    }
  }

  async function handleUnequipSkill(slotIndex) {
    const applyLocal = () => {
      let success = false

      setPlayer((prev) => {
        const result = unequipSkill(prev, slotIndex)

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

    if (!user) {
      return applyLocal()
    }

    try {
      const result = await unequipCombatSkillAction(slotIndex)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể tháo kỹ năng.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Unequip skill sync error:', error)
      if (allowDevFallback) {
        return applyLocal()
      }
      pushLog('Không kết nối được máy chủ tháo kỹ năng.')
      return false
    }
  }

  async function handlePurchaseShopItem(sectionId, itemId) {
    const applyLocal = () => {
      const result = purchaseShopItem(player, sectionId, itemId)

      if (!result.ok) {
        pushLog(result.message)
        return false
      }

      setPlayer(normalizePlayerSkills(result.player))
      pushLog(result.message)
      return true
    }

    if (!user) {
      return applyLocal()
    }

    try {
      const result = await purchaseShopItemAction(sectionId, itemId)

      if (!result?.ok) {
        pushLog(result?.message || 'KhÃ´ng thá»ƒ mua váº­t pháº©m.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Purchase shop item sync error:', error)
      if (allowDevFallback) {
        return applyLocal()
      }
      pushLog('KhÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c TiÃªn CÃ¡c.')
      return false
    }
  }

  async function handleListMarketListings() {
    try {
      const result = await listMarketListingsAction()
      if (result?.player) {
        applyServerActionResult(result)
      }
      return Array.isArray(result?.listings) ? result.listings : []
    } catch (error) {
      console.error('List market listings error:', error)
      pushLog('Không tải được danh sách chợ giao dịch.')
      return []
    }
  }

  async function handleCreateMarketListing(instanceId, price) {
    if (!user) {
      pushLog('Hãy đăng nhập để đăng bán vật phẩm.')
      return null
    }

    try {
      const result = await createMarketListingAction(instanceId, price)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể đăng bán vật phẩm.')
        return null
      }

      applyServerActionResult(result)
      return result
    } catch (error) {
      console.error('Create market listing error:', error)
      pushLog('Không kết nối được máy chủ giao dịch.')
      return null
    }
  }

  async function handleCancelMarketListing(listingId) {
    if (!user) {
      pushLog('Hãy đăng nhập để quản lý sạp hàng.')
      return false
    }

    try {
      const result = await cancelMarketListingAction(listingId)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể rút vật phẩm khỏi chợ.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Cancel market listing error:', error)
      pushLog('Không kết nối được máy chủ giao dịch.')
      return false
    }
  }

  async function handleBuyMarketListing(listingId) {
    if (!user) {
      pushLog('Hãy đăng nhập để mua vật phẩm.')
      return false
    }

    try {
      const result = await buyMarketListingAction(listingId)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể mua vật phẩm này.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Buy market listing error:', error)
      pushLog('Không kết nối được máy chủ giao dịch.')
      return false
    }
  }

  async function handleFetchWorldBoss() {
    try {
      const result = await fetchWorldBossAction()
      if (result?.player) {
        applyServerActionResult(result)
      }
      return result
    } catch (error) {
      console.error('Fetch world boss error:', error)
      pushLog('Không tải được trạng thái Boss thế giới.')
      return null
    }
  }

  async function handleAttackWorldBoss(skillId = null) {
    if (!user) {
      pushLog('Hãy đăng nhập để khiêu chiến Boss thế giới.')
      return null
    }

    try {
      const result = await attackWorldBossAction(skillId)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể tấn công Boss thế giới.')
        return result || null
      }

      applyServerActionResult(result)
      if (!result?.welfare) {
        void handleFetchWelfareState()
      }
      return result
    } catch (error) {
      console.error('Attack world boss error:', error)
      pushLog('Không kết nối được chiến trường Boss thế giới.')
      return null
    }
  }

  async function handleClaimWorldBossRankingReward() {
    if (!user) {
      pushLog('Hãy đăng nhập để nhận thưởng top sát thương.')
      return null
    }

    try {
      const result = await claimWorldBossRankingRewardAction()

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể nhận thưởng top sát thương.')
        return result || null
      }

      applyServerActionResult(result)
      return result
    } catch (error) {
      console.error('Claim world boss ranking reward error:', error)
      pushLog('Không kết nối được máy chủ nhận thưởng boss.')
      return null
    }
  }

  async function handleQuickReviveWorldBoss() {
    if (!user) {
      pushLog('Hãy đăng nhập để hồi sinh nhanh Boss thế giới.')
      return null
    }

    try {
      const result = await quickReviveWorldBossAction()

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể hồi sinh nhanh Boss.')
        return result || null
      }

      applyServerActionResult(result)
      return result
    } catch (error) {
      console.error('Quick revive world boss error:', error)
      pushLog('Không kết nối được máy chủ Boss thế giới.')
      return null
    }
  }

  async function handleFetchWelfareState() {
    if (!user) return null

    try {
      const result = await fetchWelfareStateAction()
      if (result?.player) {
        applyServerActionResult(result)
      }
      return result
    } catch (error) {
      console.error('Fetch welfare state error:', error)
      pushLog('Khong tai duoc Phuc Loi hom nay.')
      return null
    }
  }

  async function handleClaimLoginReward() {
    if (!user) {
      pushLog('Hay dang nhap de nhan qua dang nhap.')
      return false
    }

    try {
      const result = await claimLoginRewardAction()

      if (!result?.ok) {
        pushLog(result?.message || 'Khong the nhan qua dang nhap.')
        return false
      }

      applyServerActionResult(result)
      if (!result?.welfare) {
        void handleFetchWelfareState()
      }
      return true
    } catch (error) {
      console.error('Claim login reward error:', error)
      pushLog('Khong ket noi duoc may chu Phuc Loi.')
      return false
    }
  }

  async function handleClaimDailyMissionReward(missionId) {
    if (!user) {
      pushLog('Hay dang nhap de nhan thuong nhiem vu ngay.')
      return false
    }

    try {
      const result = await claimDailyMissionRewardAction(missionId)

      if (!result?.ok) {
        pushLog(result?.message || 'Khong the nhan thuong nhiem vu ngay.')
        return false
      }

      applyServerActionResult(result)
      if (!result?.welfare) {
        void handleFetchWelfareState()
      }
      return true
    } catch (error) {
      console.error('Claim daily mission reward error:', error)
      pushLog('Khong ket noi duoc may chu nhiem vu ngay.')
      return false
    }
  }

  async function handleClaimDailyActivityReward(threshold) {
    if (!user) {
      pushLog('Hay dang nhap de nhan thuong moc hoat dong.')
      return false
    }

    try {
      const result = await claimDailyActivityRewardAction(threshold)

      if (!result?.ok) {
        pushLog(result?.message || 'Khong the nhan thuong moc hoat dong.')
        return false
      }

      applyServerActionResult(result)
      if (!result?.welfare) {
        void handleFetchWelfareState()
      }
      return true
    } catch (error) {
      console.error('Claim daily activity reward error:', error)
      pushLog('Khong ket noi duoc may chu Phuc Loi.')
      return false
    }
  }

  async function handleRedeemCode(code) {
    if (!user) {
      pushLog('Hãy đăng nhập để nhập code.')
      return false
    }

    try {
      const result = await redeemRewardCodeAction(code)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể đổi code.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Redeem reward code error:', error)
      pushLog('Không kết nối được máy chủ đổi code.')
      return false
    }
  }

  async function handleCreateRewardCode(payload) {
    if (!user) {
      pushLog('Hãy đăng nhập tài khoản admin để tạo code.')
      return null
    }

    try {
      const result = await createRewardCodeAction(payload)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể tạo code.')
        return null
      }

      pushLog(result.message || `Đã tạo code ${result.code}.`)
      return result
    } catch (error) {
      console.error('Create reward code error:', error)
      pushLog('Không kết nối được máy chủ tạo code.')
      return null
    }
  }

  async function handleDeleteRewardCode(code) {
    if (!user) {
      pushLog('Hãy đăng nhập tài khoản admin để xóa code.')
      return false
    }

    try {
      const result = await deleteRewardCodeAction(code)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể xóa code.')
        return false
      }

      pushLog(result.message || `Đã khóa code ${code}.`)
      return true
    } catch (error) {
      console.error('Delete reward code error:', error)
      pushLog('Không kết nối được máy chủ xóa code.')
      return false
    }
  }

  async function handleListRewardCodes() {
    if (!user) {
      pushLog('Hãy đăng nhập tài khoản admin để xem danh sách code.')
      return []
    }

    try {
      const result = await listRewardCodesAction()
      return Array.isArray(result?.codes) ? result.codes : []
    } catch (error) {
      console.error('List reward codes error:', error)
      pushLog('Không tải được danh sách code.')
      return []
    }
  }

  async function handleUpdateRewardCode(payload) {
    if (!user) {
      pushLog('Hãy đăng nhập tài khoản admin để sửa code.')
      return null
    }

    try {
      const result = await updateRewardCodeAction(payload)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể cập nhật code.')
        return null
      }

      pushLog(result.message || `Đã cập nhật code ${payload.code}.`)
      return result
    } catch (error) {
      console.error('Update reward code error:', error)
      pushLog('Không kết nối được máy chủ cập nhật code.')
      return null
    }
  }

  async function handleUnequipItem(slot) {
    if (!user) {
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
      return true
    }

    try {
      const result = await unequipItemAction(slot)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể tháo trang bị.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Unequip item sync error:', error)
      if (allowDevFallback) {
        setPlayer((prev) => {
          const result = unequipItem(prev, slot)

          if (!result.ok) {
            pushLog(result.message)
            return prev
          }

          const nextPlayer = clampPlayerHp(result.player)
          pushLog(`${result.message} [dev local]`)
          return nextPlayer
        })
        return true
      }
      pushLog('Không kết nối được máy chủ tháo trang bị.')
      return false
    }
  }

  async function handleUseItem(itemId) {
    if (!user) {
      setPlayer((prev) => {
        const result = useConsumable(prev, itemId)

        if (!result.ok) {
          pushLog(result.message || 'Không thể sử dụng vật phẩm.')
          return prev
        }

        pushLog(result.message)
        return result.player
      })
      return true
    }

    try {
      const result = await useItemAction(itemId)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể sử dụng vật phẩm.')
        return false
      }

      applyServerActionResult(result)
      return true
    } catch (error) {
      console.error('Use item sync error:', error)
      if (allowDevFallback) {
        setPlayer((prev) => {
          const result = useConsumable(prev, itemId)

          if (!result.ok) {
            pushLog(result.message || 'Không thể sử dụng vật phẩm.')
            return prev
          }

          pushLog(`${result.message} [dev local]`)
          return result.player
        })
        return true
      }
      pushLog('Không kết nối được máy chủ sử dụng vật phẩm.')
      return false
    }
  }

  async function handleCraftPill(recipeId) {
    if (crafting) {
      pushLog('Lò đan đang bận.')
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
      applyLocalWelfareProgress({ alchemy_1: 1 })
      pushLog(result.message)
      return true
    }

    try {
      const result = await startAlchemyCraftAction(recipeId)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể bắt đầu luyện đan.')
        return false
      }

      applyServerActionResult(result)
      if (!result?.welfare) {
        void handleFetchWelfareState()
      }
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
        applyLocalWelfareProgress({ alchemy_1: 1 })
        pushLog(`${result.message} [dev local]`)
        return true
      }
      pushLog('Không kết nối được máy chủ luyện đan.')
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
      applyLocalWelfareProgress({ herb_harvest_3: 1 })
      pushLog(result.message)
      return true
    }

    try {
      const result = await upgradeHerbGardenAction()

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể mở thêm ô linh điền.')
        return false
      }

      applyServerActionResult(result)
      if (!result?.welfare) {
        void handleFetchWelfareState()
      }
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
        applyLocalWelfareProgress({ herb_harvest_3: 1 })
        pushLog(`${result.message} [dev local]`)
        return true
      }
      pushLog('Không kết nối được máy chủ linh điền.')
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
        pushLog(result?.message || 'Không thể gieo hạt giống.')
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
      pushLog('Không kết nối được máy chủ linh điền.')
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
      applyLocalWelfareProgress({ herb_harvest_3: 1 })
      pushLog(result.message)
      return true
    }

    try {
      const result = await harvestHerbSlotAction(slotIndex)

      if (!result?.ok) {
        pushLog(result?.message || 'Không thể thu hoạch ô này.')
        return false
      }

      applyServerActionResult(result)
      if (!result?.welfare) {
        void handleFetchWelfareState()
      }
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
        applyLocalWelfareProgress({ herb_harvest_3: 1 })
        pushLog(`${result.message} [dev local]`)
        return true
      }
      pushLog('Không kết nối được máy chủ linh điền.')
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
        pushLog(result?.message || 'Không có ô nào sẵn sàng thu hoạch.')
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
      pushLog('Không kết nối được máy chủ linh điền.')
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
    loading,
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
    skills: {
      learned: getLearnedSkillEntries(player),
      equipped: getEquippedSkillEntries(player),
    },
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
      purchaseShopItem: handlePurchaseShopItem,
      listMarketListings: handleListMarketListings,
      createMarketListing: handleCreateMarketListing,
      cancelMarketListing: handleCancelMarketListing,
      buyMarketListing: handleBuyMarketListing,
      fetchWorldBoss: handleFetchWorldBoss,
      attackWorldBoss: handleAttackWorldBoss,
      claimWorldBossRankingReward: handleClaimWorldBossRankingReward,
      quickReviveWorldBoss: handleQuickReviveWorldBoss,
      fetchWelfareState: handleFetchWelfareState,
      claimLoginReward: handleClaimLoginReward,
      claimDailyMissionReward: handleClaimDailyMissionReward,
      claimDailyActivityReward: handleClaimDailyActivityReward,
      redeemCode: handleRedeemCode,
      createRewardCode: handleCreateRewardCode,
      deleteRewardCode: handleDeleteRewardCode,
      listRewardCodes: handleListRewardCodes,
      updateRewardCode: handleUpdateRewardCode,
      equipSkill: handleEquipSkill,
      unequipSkill: handleUnequipSkill,
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

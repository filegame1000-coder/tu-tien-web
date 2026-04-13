import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export async function cultivateAction() {
  try {
    const fn = httpsCallable(functions, 'cultivateAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('cultivateAction error:', error)
    throw error
  }
}

export async function breakthroughAction() {
  try {
    const fn = httpsCallable(functions, 'breakthroughAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('breakthroughAction error:', error)
    throw error
  }
}

export async function setInitialNameAction(name) {
  try {
    const fn = httpsCallable(functions, 'setInitialNameAction')
    const res = await fn({ name })
    return res.data
  } catch (error) {
    console.error('setInitialNameAction error:', error)
    throw error
  }
}

export async function syncPublicPlayerAction() {
  try {
    const fn = httpsCallable(functions, 'syncPublicPlayerAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('syncPublicPlayerAction error:', error)
    throw error
  }
}

export async function useItemAction(itemId) {
  try {
    const fn = httpsCallable(functions, 'useItemAction')
    const res = await fn({ itemId })
    return res.data
  } catch (error) {
    console.error('useItemAction error:', error)
    throw error
  }
}

export async function equipItemAction(instanceId) {
  try {
    const fn = httpsCallable(functions, 'equipItemAction')
    const res = await fn({ instanceId })
    return res.data
  } catch (error) {
    console.error('equipItemAction error:', error)
    throw error
  }
}

export async function unequipItemAction(slot) {
  try {
    const fn = httpsCallable(functions, 'unequipItemAction')
    const res = await fn({ slot })
    return res.data
  } catch (error) {
    console.error('unequipItemAction error:', error)
    throw error
  }
}

export async function equipCombatSkillAction(skillId, slotIndex) {
  try {
    const fn = httpsCallable(functions, 'equipCombatSkillAction')
    const res = await fn({ skillId, slotIndex })
    return res.data
  } catch (error) {
    console.error('equipCombatSkillAction error:', error)
    throw error
  }
}

export async function unequipCombatSkillAction(slotIndex) {
  try {
    const fn = httpsCallable(functions, 'unequipCombatSkillAction')
    const res = await fn({ slotIndex })
    return res.data
  } catch (error) {
    console.error('unequipCombatSkillAction error:', error)
    throw error
  }
}

export async function purchaseShopItemAction(sectionId, itemId) {
  try {
    const fn = httpsCallable(functions, 'purchaseShopItemAction')
    const res = await fn({ sectionId, itemId })
    return res.data
  } catch (error) {
    console.error('purchaseShopItemAction error:', error)
    throw error
  }
}

export async function listMarketListingsAction() {
  try {
    const fn = httpsCallable(functions, 'listMarketListingsAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('listMarketListingsAction error:', error)
    throw error
  }
}

export async function createMarketListingAction(instanceId, price) {
  try {
    const fn = httpsCallable(functions, 'createMarketListingAction')
    const res = await fn({ instanceId, price })
    return res.data
  } catch (error) {
    console.error('createMarketListingAction error:', error)
    throw error
  }
}

export async function cancelMarketListingAction(listingId) {
  try {
    const fn = httpsCallable(functions, 'cancelMarketListingAction')
    const res = await fn({ listingId })
    return res.data
  } catch (error) {
    console.error('cancelMarketListingAction error:', error)
    throw error
  }
}

export async function buyMarketListingAction(listingId) {
  try {
    const fn = httpsCallable(functions, 'buyMarketListingAction')
    const res = await fn({ listingId })
    return res.data
  } catch (error) {
    console.error('buyMarketListingAction error:', error)
    throw error
  }
}

export async function redeemRewardCodeAction(code) {
  try {
    const fn = httpsCallable(functions, 'redeemRewardCodeAction')
    const res = await fn({ code })
    return res.data
  } catch (error) {
    console.error('redeemRewardCodeAction error:', error)
    throw error
  }
}

export async function createRewardCodeAction(payload) {
  try {
    const fn = httpsCallable(functions, 'createRewardCodeAction')
    const res = await fn(payload)
    return res.data
  } catch (error) {
    console.error('createRewardCodeAction error:', error)
    throw error
  }
}

export async function deleteRewardCodeAction(code) {
  try {
    const fn = httpsCallable(functions, 'deleteRewardCodeAction')
    const res = await fn({ code })
    return res.data
  } catch (error) {
    console.error('deleteRewardCodeAction error:', error)
    throw error
  }
}

export async function listRewardCodesAction() {
  try {
    const fn = httpsCallable(functions, 'listRewardCodesAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('listRewardCodesAction error:', error)
    throw error
  }
}

export async function updateRewardCodeAction(payload) {
  try {
    const fn = httpsCallable(functions, 'updateRewardCodeAction')
    const res = await fn(payload)
    return res.data
  } catch (error) {
    console.error('updateRewardCodeAction error:', error)
    throw error
  }
}

export async function listAuditLogsAction(category = 'all', limit = 50) {
  try {
    const fn = httpsCallable(functions, 'listAuditLogsAction')
    const res = await fn({ category, limit })
    return res.data
  } catch (error) {
    console.error('listAuditLogsAction error:', error)
    throw error
  }
}

export async function listAdminPlayersAction(keyword = '', limit = 50) {
  try {
    const fn = httpsCallable(functions, 'listAdminPlayersAction')
    const res = await fn({ keyword, limit })
    return res.data
  } catch (error) {
    console.error('listAdminPlayersAction error:', error)
    throw error
  }
}

export async function getAdminPlayerDetailAction(targetUid) {
  try {
    const fn = httpsCallable(functions, 'getAdminPlayerDetailAction')
    const res = await fn({ targetUid })
    return res.data
  } catch (error) {
    console.error('getAdminPlayerDetailAction error:', error)
    throw error
  }
}

export async function setPlayerBlockedAction(targetUid, blocked) {
  try {
    const fn = httpsCallable(functions, 'setPlayerBlockedAction')
    const res = await fn({ targetUid, blocked })
    return res.data
  } catch (error) {
    console.error('setPlayerBlockedAction error:', error)
    throw error
  }
}

export async function sendAdminGiftAction(targetUid, reward, note = '') {
  try {
    const fn = httpsCallable(functions, 'sendAdminGiftAction')
    const res = await fn({ targetUid, reward, note })
    return res.data
  } catch (error) {
    console.error('sendAdminGiftAction error:', error)
    throw error
  }
}

export async function listSystemMailsAction() {
  try {
    const fn = httpsCallable(functions, 'listSystemMailsAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('listSystemMailsAction error:', error)
    throw error
  }
}

export async function claimSystemMailAction(mailId) {
  try {
    const fn = httpsCallable(functions, 'claimSystemMailAction')
    const res = await fn({ mailId })
    return res.data
  } catch (error) {
    console.error('claimSystemMailAction error:', error)
    throw error
  }
}

export async function claimAllSystemMailsAction() {
  try {
    const fn = httpsCallable(functions, 'claimAllSystemMailsAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('claimAllSystemMailsAction error:', error)
    throw error
  }
}

export async function deleteSystemMailAction(mailId) {
  try {
    const fn = httpsCallable(functions, 'deleteSystemMailAction')
    const res = await fn({ mailId })
    return res.data
  } catch (error) {
    console.error('deleteSystemMailAction error:', error)
    throw error
  }
}

export async function deleteClaimedSystemMailsAction() {
  try {
    const fn = httpsCallable(functions, 'deleteClaimedSystemMailsAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('deleteClaimedSystemMailsAction error:', error)
    throw error
  }
}

export async function sendBroadcastSystemMailAction(reward, note = '') {
  try {
    const fn = httpsCallable(functions, 'sendBroadcastSystemMailAction')
    const res = await fn({ reward, note })
    return res.data
  } catch (error) {
    console.error('sendBroadcastSystemMailAction error:', error)
    throw error
  }
}

export async function enterDungeonAction(floor) {
  try {
    const fn = httpsCallable(functions, 'enterDungeonAction')
    const res = await fn({ floor })
    return res.data
  } catch (error) {
    console.error('enterDungeonAction error:', error)
    throw error
  }
}

export async function leaveDungeonAction() {
  try {
    const fn = httpsCallable(functions, 'leaveDungeonAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('leaveDungeonAction error:', error)
    throw error
  }
}

export async function attackDungeonEnemyAction(skillId = null) {
  try {
    const fn = httpsCallable(functions, 'attackDungeonEnemyAction')
    const res = await fn({ skillId })
    return res.data
  } catch (error) {
    console.error('attackDungeonEnemyAction error:', error)
    throw error
  }
}

export async function upgradeHerbGardenAction() {
  try {
    const fn = httpsCallable(functions, 'upgradeHerbGardenAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('upgradeHerbGardenAction error:', error)
    throw error
  }
}

export async function plantHerbSeedAction(slotIndex) {
  try {
    const fn = httpsCallable(functions, 'plantHerbSeedAction')
    const res = await fn({ slotIndex })
    return res.data
  } catch (error) {
    console.error('plantHerbSeedAction error:', error)
    throw error
  }
}

export async function harvestHerbSlotAction(slotIndex) {
  try {
    const fn = httpsCallable(functions, 'harvestHerbSlotAction')
    const res = await fn({ slotIndex })
    return res.data
  } catch (error) {
    console.error('harvestHerbSlotAction error:', error)
    throw error
  }
}

export async function harvestAllHerbsAction() {
  try {
    const fn = httpsCallable(functions, 'harvestAllHerbsAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('harvestAllHerbsAction error:', error)
    throw error
  }
}

export async function startAlchemyCraftAction(recipeId) {
  try {
    const fn = httpsCallable(functions, 'startAlchemyCraftAction')
    const res = await fn({ recipeId })
    return res.data
  } catch (error) {
    console.error('startAlchemyCraftAction error:', error)
    throw error
  }
}

export async function claimAlchemyCraftAction() {
  try {
    const fn = httpsCallable(functions, 'claimAlchemyCraftAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('claimAlchemyCraftAction error:', error)
    throw error
  }
}

export async function fetchWorldBossAction() {
  try {
    const fn = httpsCallable(functions, 'fetchWorldBossAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('fetchWorldBossAction error:', error)
    throw error
  }
}

export async function attackWorldBossAction(skillId = null) {
  try {
    const fn = httpsCallable(functions, 'attackWorldBossAction')
    const res = await fn({ skillId })
    return res.data
  } catch (error) {
    console.error('attackWorldBossAction error:', error)
    throw error
  }
}

export async function quickReviveWorldBossAction() {
  try {
    const fn = httpsCallable(functions, 'quickReviveWorldBossAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('quickReviveWorldBossAction error:', error)
    throw error
  }
}

export async function claimWorldBossRankingRewardAction() {
  try {
    const fn = httpsCallable(functions, 'claimWorldBossRankingRewardAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('claimWorldBossRankingRewardAction error:', error)
    throw error
  }
}

export async function fetchPlayerStateAction() {
  try {
    const fn = httpsCallable(functions, 'fetchPlayerStateAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('fetchPlayerStateAction error:', error)
    throw error
  }
}

export async function fetchWelfareStateAction() {
  try {
    const fn = httpsCallable(functions, 'fetchWelfareStateAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('fetchWelfareStateAction error:', error)
    throw error
  }
}

export async function claimLoginRewardAction() {
  try {
    const fn = httpsCallable(functions, 'claimLoginRewardAction')
    const res = await fn({})
    return res.data
  } catch (error) {
    console.error('claimLoginRewardAction error:', error)
    throw error
  }
}

export async function claimDailyMissionRewardAction(missionId) {
  try {
    const fn = httpsCallable(functions, 'claimDailyMissionRewardAction')
    const res = await fn({ missionId })
    return res.data
  } catch (error) {
    console.error('claimDailyMissionRewardAction error:', error)
    throw error
  }
}

export async function claimDailyActivityRewardAction(threshold) {
  try {
    const fn = httpsCallable(functions, 'claimDailyActivityRewardAction')
    const res = await fn({ threshold })
    return res.data
  } catch (error) {
    console.error('claimDailyActivityRewardAction error:', error)
    throw error
  }
}

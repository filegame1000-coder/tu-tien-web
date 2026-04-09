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

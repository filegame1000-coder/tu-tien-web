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

export async function attackDungeonEnemyAction() {
  try {
    const fn = httpsCallable(functions, 'attackDungeonEnemyAction')
    const res = await fn({})
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

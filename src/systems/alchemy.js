import { getAlchemyRecipe } from '../data/alchemyRecipes'
import { consumableDefs } from '../data/consumables'
import { addItemToInventory } from './inventory'

function getPlayerResource(player, key) {
  return Number(player?.[key]) || 0
}

export function canCraftAlchemyRecipe(player, recipeId) {
  const recipe = getAlchemyRecipe(recipeId)

  if (!recipe) {
    return {
      ok: false,
      message: 'Đan phương không tồn tại.',
    }
  }

  const needHerbs = Number(recipe.cost?.herbs) || 0
  const needSpiritStones = Number(recipe.cost?.spiritStones) || 0

  if (getPlayerResource(player, 'herbs') < needHerbs) {
    return {
      ok: false,
      message: `Không đủ dược thảo để luyện ${recipe.name}.`,
    }
  }

  if (getPlayerResource(player, 'spiritStones') < needSpiritStones) {
    return {
      ok: false,
      message: `Không đủ linh thạch để luyện ${recipe.name}.`,
    }
  }

  return {
    ok: true,
    recipe,
  }
}

export function startAlchemyCraft(player, recipeId, now = Date.now()) {
  const check = canCraftAlchemyRecipe(player, recipeId)
  if (!check.ok) return check

  const recipe = check.recipe
  const itemDef = consumableDefs[recipe.itemId]

  if (!itemDef) {
    return {
      ok: false,
      message: 'Vật phẩm đầu ra của đan phương không hợp lệ.',
    }
  }

  const nextPlayer = {
    ...player,
    herbs: (Number(player?.herbs) || 0) - (Number(recipe.cost?.herbs) || 0),
    spiritStones:
      (Number(player?.spiritStones) || 0) - (Number(recipe.cost?.spiritStones) || 0),
  }

  const durationMs = Number(recipe.craftTimeMs) || 0

  const craftState = {
    recipeId: recipe.id,
    itemId: recipe.itemId,
    recipeName: recipe.name,
    itemName: itemDef.name,
    startedAt: now,
    completeAt: now + durationMs,
    durationMs,
  }

  return {
    ok: true,
    player: nextPlayer,
    craftState,
    message: `Bắt đầu luyện ${recipe.name}.`,
  }
}

export function isAlchemyCraftComplete(craftState, now = Date.now()) {
  if (!craftState?.completeAt) return false
  return now >= Number(craftState.completeAt)
}

export function getAlchemyRemainingMs(craftState, now = Date.now()) {
  if (!craftState?.completeAt) return 0
  return Math.max(0, Number(craftState.completeAt) - now)
}

export function getAlchemyProgressPercent(craftState, now = Date.now()) {
  if (!craftState?.startedAt || !craftState?.completeAt) return 0

  const startedAt = Number(craftState.startedAt) || 0
  const completeAt = Number(craftState.completeAt) || 0

  if (completeAt <= startedAt) return 0

  const total = completeAt - startedAt
  const elapsed = Math.min(Math.max(now - startedAt, 0), total)

  return Math.max(0, Math.min((elapsed / total) * 100, 100))
}

export function finishAlchemyCraft(player, craftState) {
  if (!craftState?.itemId) {
    return {
      ok: false,
      message: 'Không có tiến trình luyện đan hợp lệ.',
    }
  }

  const itemDef = consumableDefs[craftState.itemId]
  if (!itemDef) {
    return {
      ok: false,
      message: 'Đan dược hoàn thành không hợp lệ.',
    }
  }

  const nextInventory = addItemToInventory(player.inventory || [], {
    id: craftState.itemId,
    quantity: 1,
  })

  return {
    ok: true,
    player: {
      ...player,
      inventory: nextInventory,
    },
    message: `Luyện thành công ${itemDef.name}.`,
  }
}
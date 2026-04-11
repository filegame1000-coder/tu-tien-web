import { getAlchemyRecipeList } from '../data/alchemyRecipes'
import { consumableDefs } from '../data/consumables'
import { equipmentDefs } from '../data/equipments'
import { createEquipmentInstance } from './equipment'
import { addItemToInventory } from './inventory'
import { getSkillDef, normalizePlayerSkills } from './skills'

export const SHOP_SECTIONS = [
  { id: 'equipment', label: 'Shop Trang Bị' },
  { id: 'skills', label: 'Shop Kỹ Năng' },
  { id: 'consumables', label: 'Shop Dược Phẩm' },
  { id: 'pills', label: 'Shop Đan Dược' },
]

const SHOP_CONFIG = {
  equipment: {
    items: [
      { itemId: 'beginner_sword', price: 20 },
      { itemId: 'cloth_armor', price: 20 },
      { itemId: 'wind_boots', price: 50 },
      { itemId: 'spirit_ring', price: 60 },
    ],
  },
  skills: {
    items: [
      { itemId: 'ngu_kiem_thuat', price: 180 },
      { itemId: 'liet_hoa_kiem', price: 320 },
    ],
  },
  consumables: {
    items: [
      { itemId: 'hp_potion_small', price: 15 },
      { itemId: 'mp_potion_small', price: 15 },
    ],
  },
  pills: {
    items: [
      { itemId: 'thoi_the_dan', price: 120 },
      { itemId: 'thoi_than_dan', price: 120 },
      { itemId: 'thoi_thanh_dan', price: 180 },
    ],
  },
}

function getRecipeByItemId(itemId) {
  return getAlchemyRecipeList().find((recipe) => recipe.itemId === itemId) || null
}

function buildEquipmentEntry(item) {
  const def = equipmentDefs[item.itemId]
  if (!def) return null

  return {
    ...item,
    kind: 'equipment',
    name: def.name,
    description: def.description || `Trang bị ô ${def.slot}, yêu cầu tầng ${def.levelRequired}.`,
    stats: def.stats || {},
    levelRequired: def.levelRequired || 1,
  }
}

function buildSkillEntry(item) {
  const def = getSkillDef(item.itemId)
  if (!def) return null

  return {
    ...item,
    kind: 'skill',
    name: def.name,
    description: def.description,
    manaCost: def.manaCost,
    cooldownTurns: def.cooldownTurns,
    damageMultiplier: def.damageMultiplier,
  }
}

function buildConsumableEntry(item) {
  const def = consumableDefs[item.itemId]
  if (!def) return null

  return {
    ...item,
    kind: 'consumable',
    name: def.name,
    description: def.description,
    effect: def.effect || {},
  }
}

function buildPillEntry(item) {
  const def = consumableDefs[item.itemId]
  if (!def) return null

  return {
    ...item,
    kind: 'pill',
    name: def.name,
    description: def.description,
    effect: def.effect || {},
    recipe: getRecipeByItemId(item.itemId),
  }
}

export function getShopEntries(sectionId) {
  const section = SHOP_CONFIG[sectionId]
  if (!section) return []

  return section.items
    .map((item) => {
      if (sectionId === 'equipment') return buildEquipmentEntry(item)
      if (sectionId === 'skills') return buildSkillEntry(item)
      if (sectionId === 'consumables') return buildConsumableEntry(item)
      if (sectionId === 'pills') return buildPillEntry(item)
      return null
    })
    .filter(Boolean)
}

function spendSpiritStones(player, amount) {
  const safeAmount = Math.max(0, Number(amount) || 0)

  if ((Number(player?.spiritStones) || 0) < safeAmount) {
    return {
      ok: false,
      message: `Không đủ ${safeAmount} linh thạch.`,
    }
  }

  return {
    ok: true,
    nextSpiritStones: (Number(player?.spiritStones) || 0) - safeAmount,
  }
}

export function purchaseShopItem(player, sectionId, itemId) {
  const section = SHOP_CONFIG[sectionId]
  if (!section) {
    return { ok: false, message: 'Gian hàng không tồn tại.' }
  }

  const entry = section.items.find((item) => item.itemId === itemId)
  if (!entry) {
    return { ok: false, message: 'Vật phẩm không có trong gian hàng này.' }
  }

  const spending = spendSpiritStones(player, entry.price)
  if (!spending.ok) return spending

  if (sectionId === 'equipment') {
    const def = equipmentDefs[itemId]
    if (!def) return { ok: false, message: 'Trang bị không tồn tại.' }

    return {
      ok: true,
      player: {
        ...player,
        spiritStones: spending.nextSpiritStones,
        inventory: [...(player.inventory || []), createEquipmentInstance(itemId)],
      },
      message: `Đã mua ${def.name}.`,
    }
  }

  if (sectionId === 'skills') {
    const normalizedPlayer = normalizePlayerSkills(player)
    const def = getSkillDef(itemId)

    if (!def) return { ok: false, message: 'Kỹ năng không tồn tại.' }
    if (normalizedPlayer.learnedSkills.includes(itemId)) {
      return { ok: false, message: 'Bạn đã học kỹ năng này rồi.' }
    }

    return {
      ok: true,
      player: normalizePlayerSkills({
        ...normalizedPlayer,
        spiritStones: spending.nextSpiritStones,
        learnedSkills: [...normalizedPlayer.learnedSkills, itemId],
      }),
      message: `Đã mua bí tịch ${def.name}. Hãy vào Động phủ để trang bị.`,
    }
  }

  const def = consumableDefs[itemId]
  if (!def) return { ok: false, message: 'Vật phẩm không tồn tại.' }

  return {
    ok: true,
    player: {
      ...player,
      spiritStones: spending.nextSpiritStones,
      inventory: addItemToInventory(player.inventory || [], {
        id: itemId,
        quantity: 1,
      }),
    },
    message: `Đã mua ${def.name}.`,
  }
}

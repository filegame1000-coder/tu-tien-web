import { equipmentDefs } from '../data/equipments'

const DEFAULT_TOTAL = {
  maxHp: 0,
  maxMp: 0,
  damage: 0,
  defense: 0,

  critChance: 0,
  critDamage: 0,
  dodgeChance: 0,
  lifesteal: 0,
  damageReduction: 0,
  shield: 0,

  physicalBonus: 0,
  spiritualBonus: 0,
  trueBonus: 0,

  physicalResist: 0,
  spiritualResist: 0,
  trueResist: 0,

  hitChance: 0,
  antiCritChance: 0,
  realmMultiplier: 0,
}

function addStatValue(current, value) {
  return (current ?? 0) + (value ?? 0)
}

export function getEquippedItems(player) {
  const result = []

  for (const instanceId of Object.values(player.equipment ?? {})) {
    if (!instanceId) continue

    const inventoryItem = (player.inventory ?? []).find(
      (item) => item.instanceId === instanceId
    )
    if (!inventoryItem) continue

    const def = equipmentDefs[inventoryItem.defId]
    if (!def) continue

    result.push({ instance: inventoryItem, def })
  }

  return result
}

export function getEquipmentStats(player) {
  const total = { ...DEFAULT_TOTAL }

  for (const item of getEquippedItems(player)) {
    const baseStats = item.def.stats ?? {}
    const bonusStats = item.instance.bonusStats ?? {}

    for (const [key, value] of Object.entries(baseStats)) {
      total[key] = addStatValue(total[key], value)
    }

    for (const [key, value] of Object.entries(bonusStats)) {
      total[key] = addStatValue(total[key], value)
    }
  }

  return total
}

export function getFinalStats(player) {
  const equipmentStats = getEquipmentStats(player)
  const base = player.baseStats ?? {}

  return {
    maxHp: (base.maxHp ?? 0) + (equipmentStats.maxHp ?? 0),
    maxMp: (base.maxMp ?? 0) + (equipmentStats.maxMp ?? 0),

    damage: (base.damage ?? 0) + (equipmentStats.damage ?? 0),
    defense: (base.defense ?? 0) + (equipmentStats.defense ?? 0),

    critChance: (base.critChance ?? 0) + (equipmentStats.critChance ?? 0),
    critDamage: (base.critDamage ?? 1) + (equipmentStats.critDamage ?? 0),

    dodgeChance: (base.dodgeChance ?? 0) + (equipmentStats.dodgeChance ?? 0),
    lifesteal: (base.lifesteal ?? 0) + (equipmentStats.lifesteal ?? 0),
    damageReduction: (base.damageReduction ?? 0) + (equipmentStats.damageReduction ?? 0),
    shield: (base.shield ?? 0) + (equipmentStats.shield ?? 0),

    physicalBonus: (base.physicalBonus ?? 0) + (equipmentStats.physicalBonus ?? 0),
    spiritualBonus: (base.spiritualBonus ?? 0) + (equipmentStats.spiritualBonus ?? 0),
    trueBonus: (base.trueBonus ?? 0) + (equipmentStats.trueBonus ?? 0),

    physicalResist: (base.physicalResist ?? 0) + (equipmentStats.physicalResist ?? 0),
    spiritualResist: (base.spiritualResist ?? 0) + (equipmentStats.spiritualResist ?? 0),
    trueResist: (base.trueResist ?? 0) + (equipmentStats.trueResist ?? 0),

    hitChance: (base.hitChance ?? 1) + (equipmentStats.hitChance ?? 0),
    antiCritChance: (base.antiCritChance ?? 0) + (equipmentStats.antiCritChance ?? 0),

    realmMultiplier: (base.realmMultiplier ?? 1) + (equipmentStats.realmMultiplier ?? 0),
  }
}

export function clampPlayerHp(player) {
  const finalStats = getFinalStats(player)
  const maxHp = finalStats.maxHp ?? 1
  const currentHp = player.hp ?? maxHp

  return {
    ...player,
    hp: Math.max(0, Math.min(currentHp, maxHp)),
  }
}
import { equipmentDefs } from '../data/equipments'
import { consumableDefs } from '../data/consumables'

export function isEquipmentItem(item) {
  return !!item?.defId
}

export function isConsumableItem(item) {
  return !!item?.id && !item?.defId
}

export function getItemDefinition(item) {
  if (isEquipmentItem(item)) {
    return equipmentDefs[item.defId] || null
  }

  if (isConsumableItem(item)) {
    return consumableDefs[item.id] || null
  }

  return null
}

export function normalizeInventory(inventory = []) {
  return inventory
    .filter(Boolean)
    .filter((item) => {
      if (isConsumableItem(item)) {
        return (item.quantity || 0) > 0
      }
      return true
    })
}

export function addItemToInventory(inventory = [], itemToAdd) {
  if (!itemToAdd) return inventory

  if (isConsumableItem(itemToAdd)) {
    const existingIndex = inventory.findIndex(
      (item) => isConsumableItem(item) && item.id === itemToAdd.id
    )

    if (existingIndex >= 0) {
      return inventory.map((item, index) =>
        index === existingIndex
          ? {
              ...item,
              quantity: (item.quantity || 0) + (itemToAdd.quantity || 1),
            }
          : item
      )
    }

    return [
      ...inventory,
      {
        id: itemToAdd.id,
        quantity: itemToAdd.quantity || 1,
      },
    ]
  }

  return [...inventory, itemToAdd]
}

export function addItemsToInventory(inventory = [], items = []) {
  return items.reduce((acc, item) => addItemToInventory(acc, item), inventory)
}

export function removeConsumableFromInventory(inventory = [], itemId, amount = 1) {
  const nextInventory = inventory.map((item) => {
    if (isConsumableItem(item) && item.id === itemId) {
      return {
        ...item,
        quantity: Math.max(0, (item.quantity || 0) - amount),
      }
    }
    return item
  })

  return normalizeInventory(nextInventory)
}

export function removeEquipmentInstanceFromInventory(inventory = [], instanceId) {
  return inventory.filter((item) => item.instanceId !== instanceId)
}

export function countInventoryItems(inventory = []) {
  return normalizeInventory(inventory).reduce((total, item) => {
    if (isConsumableItem(item)) {
      return total + (item.quantity || 0)
    }
    return total + 1
  }, 0)
}

export function toInventoryViewModel(item) {
  if (isEquipmentItem(item)) {
    const def = equipmentDefs[item.defId]
    if (!def) return null
    const baseStats = def.stats || {}
    const bonusStats = item.bonusStats || {}
    const mergedStats = { ...baseStats }

    for (const [key, value] of Object.entries(bonusStats)) {
      mergedStats[key] = (mergedStats[key] || 0) + (value || 0)
    }

    return {
      key: item.instanceId,
      id: item.instanceId,
      name: def.name,
      type: 'equipment',
      slot: def.slot,
      rarity: def.rarity,
      quantity: 1,
      equipped: !!item.equipped,
      stats: mergedStats,
      description: def.description || '',
      raw: item,
    }
  }

  if (isConsumableItem(item)) {
    const def = consumableDefs[item.id]
    if (!def) return null

    return {
      key: `consumable_${item.id}`,
      id: item.id,
      name: def.name,
      type: 'consumable',
      quantity: item.quantity || 0,
      equipped: false,
      effect: def.effect || {},
      description: def.description || '',
      raw: item,
    }
  }

  return null
}

export function getInventoryEntries(inventory = []) {
  return normalizeInventory(inventory)
    .map((item) => toInventoryViewModel(item))
    .filter(Boolean)
}

export function getEquipmentEntries(inventory = []) {
  return getInventoryEntries(inventory).filter((item) => item.type === 'equipment')
}

export function getConsumableEntries(inventory = []) {
  return getInventoryEntries(inventory).filter((item) => item.type === 'consumable')
}

import { equipmentDefs } from '../data/equipments'

export function createEquipmentInstance(defId, overrides = {}) {
  return {
    instanceId: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    defId,
    enhanceLevel: 0,
    equipped: false,
    bonusStats: {},
    ...overrides,
  }
}

export function getEquipmentDef(defId) {
  return equipmentDefs[defId] || null
}

export function getInventoryItemById(inventory, instanceId) {
  return inventory.find((item) => item.instanceId === instanceId) || null
}

export function canEquipItem(player, inventoryItem) {
  const def = getEquipmentDef(inventoryItem.defId)

  if (!def) {
    return { ok: false, message: 'Không tìm thấy dữ liệu trang bị.' }
  }

  if ((player.stage || 1) < (def.levelRequired || 1)) {
    return {
      ok: false,
      message: `Cần cảnh giới/tầng tối thiểu ${def.levelRequired}.`,
    }
  }

  return { ok: true }
}

export function equipItem(player, instanceId) {
  const inventoryItem = getInventoryItemById(player.inventory || [], instanceId)
  if (!inventoryItem) {
    return { ok: false, message: 'Không tìm thấy vật phẩm trong túi đồ.' }
  }

  const check = canEquipItem(player, inventoryItem)
  if (!check.ok) return check

  const def = getEquipmentDef(inventoryItem.defId)
  const slot = def.slot
  const oldInstanceId = player.equipment?.[slot] || null

  const nextInventory = (player.inventory || []).map((item) => {
    if (item.instanceId === instanceId) {
      return { ...item, equipped: true }
    }

    if (item.instanceId === oldInstanceId) {
      return { ...item, equipped: false }
    }

    return item
  })

  return {
    ok: true,
    message: `Đã trang bị ${def.name}.`,
    player: {
      ...player,
      equipment: {
        ...player.equipment,
        [slot]: instanceId,
      },
      inventory: nextInventory,
    },
  }
}

export function unequipItem(player, slot) {
  const instanceId = player.equipment?.[slot]
  if (!instanceId) {
    return { ok: false, message: 'Ô trang bị đang trống.' }
  }

  const nextInventory = (player.inventory || []).map((item) =>
    item.instanceId === instanceId
      ? { ...item, equipped: false }
      : item
  )

  return {
    ok: true,
    message: 'Đã tháo trang bị.',
    player: {
      ...player,
      equipment: {
        ...player.equipment,
        [slot]: null,
      },
      inventory: nextInventory,
    },
  }
}

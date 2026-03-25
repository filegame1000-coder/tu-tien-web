export const EQUIPMENT_ITEMS = {
  weapon1: {
    key: 'weapon1',
    name: 'Vũ khí cấp 1',
    slot: 'weapon',
    bonus: { damage: 3 }
  },
  armor1: {
    key: 'armor1',
    name: 'Áo cấp 1',
    slot: 'armor',
    bonus: { defense: 2 }
  },
  pants1: {
    key: 'pants1',
    name: 'Quần cấp 1',
    slot: 'pants',
    bonus: { maxHp: 20 }
  },
  boots1: {
    key: 'boots1',
    name: 'Giày cấp 1',
    slot: 'boots',
    bonus: { maxHp: 20 }
  }
}

export function getEquippedBonuses(player) {
  const eq = player.equipment || {}

  const total = { damage: 0, defense: 0, maxHp: 0 }

  Object.values(eq).forEach((key) => {
    if (!key) return
    const item = EQUIPMENT_ITEMS[key]
    if (!item) return

    total.damage += item.bonus.damage || 0
    total.defense += item.bonus.defense || 0
    total.maxHp += item.bonus.maxHp || 0
  })

  return total
}

export function equipItem(player, itemKey) {
  const item = EQUIPMENT_ITEMS[itemKey]
  if (!item) return { player, message: 'Item không tồn tại' }

  const inv = player.inventory || {}

  if ((inv[itemKey] || 0) <= 0) {
    return { player, message: 'Không có đồ để trang bị' }
  }

  const eq = player.equipment || {}
  const old = eq[item.slot]

  const newInv = {
    ...inv,
    [itemKey]: inv[itemKey] - 1
  }

  if (old) newInv[old] = (newInv[old] || 0) + 1

  return {
    player: {
      ...player,
      inventory: newInv,
      equipment: {
        ...eq,
        [item.slot]: itemKey
      }
    },
    message: `Đã trang bị ${item.name}`
  }
}
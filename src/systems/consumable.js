import { consumableDefs } from '../data/consumables'
import { removeConsumableFromInventory } from './inventory'
import { getFinalStats } from './stats'

export function useConsumable(player, itemId) {
  const item = (player.inventory || []).find((i) => i.id === itemId)

  if (!item || item.quantity <= 0) {
    return { ok: false, message: 'Không có vật phẩm.' }
  }

  const def = consumableDefs[itemId]
  if (!def) {
    return { ok: false, message: 'Vật phẩm không hợp lệ.' }
  }

  const finalStats = getFinalStats(player)
  const nextPlayer = { ...player }

  if (def.effect.hp) {
    nextPlayer.hp = Math.min(
      (player.hp ?? 0) + def.effect.hp,
      finalStats.maxHp ?? 0
    )
  }

  if (def.effect.mp) {
    nextPlayer.mp = Math.min(
      (player.mp ?? 0) + def.effect.mp,
      finalStats.maxMp ?? 0
    )
  }

  nextPlayer.inventory = removeConsumableFromInventory(
    player.inventory || [],
    itemId,
    1
  )

  return {
    ok: true,
    player: nextPlayer,
    message: `Đã dùng ${def.name}.`,
  }
}
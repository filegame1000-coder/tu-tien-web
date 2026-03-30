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
  const nextPlayer = {
    ...player,
    baseStats: {
      ...(player.baseStats || {}),
    },
  }

  if (def.effect?.hp) {
    nextPlayer.hp = Math.min(
      (Number(player?.hp) || 0) + Number(def.effect.hp || 0),
      Number(finalStats?.maxHp) || 0
    )
  }

  if (def.effect?.mp) {
    nextPlayer.mp = Math.min(
      (Number(player?.mp) || 0) + Number(def.effect.mp || 0),
      Number(finalStats?.maxMp) || 0
    )
  }

  if (def.effect?.baseHp) {
    nextPlayer.baseStats.maxHp =
      (Number(nextPlayer.baseStats.maxHp) || 0) + Number(def.effect.baseHp || 0)

    const nextFinalStats = getFinalStats(nextPlayer)
    nextPlayer.hp = Math.min(
      Math.max(Number(player?.hp) || 0, Number(nextPlayer.baseStats.maxHp) || 0),
      Number(nextFinalStats?.maxHp) || 0
    )
  }

  if (def.effect?.baseMp) {
    nextPlayer.baseStats.maxMp =
      (Number(nextPlayer.baseStats.maxMp) || 0) + Number(def.effect.baseMp || 0)

    const nextFinalStats = getFinalStats(nextPlayer)
    nextPlayer.mp = Math.min(
      Math.max(Number(player?.mp) || 0, Number(nextPlayer.baseStats.maxMp) || 0),
      Number(nextFinalStats?.maxMp) || 0
    )
  }

  if (def.effect?.baseDamage) {
    nextPlayer.baseStats.damage =
      (Number(nextPlayer.baseStats.damage) || 0) + Number(def.effect.baseDamage || 0)
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
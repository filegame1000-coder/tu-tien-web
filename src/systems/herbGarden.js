export const HERB_GARDEN_MAX_SLOTS = 8
export const HERB_GARDEN_START_SLOTS = 1
export const HERB_GARDEN_UNLOCK_COST = 1000
export const HERB_GARDEN_GROW_TIME_MS = 5 * 60 * 1000
export const HERB_GARDEN_HARVEST_YIELD = 1

function createEmptySlot(index) {
  return {
    index,
    plantedAt: null,
    completeAt: null,
  }
}

export function createHerbGarden() {
  return {
    unlockedSlots: HERB_GARDEN_START_SLOTS,
    slots: Array.from({ length: HERB_GARDEN_MAX_SLOTS }, (_, index) =>
      createEmptySlot(index)
    ),
  }
}

export function normalizeHerbGarden(raw) {
  const fallback = createHerbGarden()

  if (!raw || typeof raw !== 'object') {
    return fallback
  }

  const unlockedSlots = Math.max(
    HERB_GARDEN_START_SLOTS,
    Math.min(Number(raw.unlockedSlots) || HERB_GARDEN_START_SLOTS, HERB_GARDEN_MAX_SLOTS)
  )

  const rawSlots = Array.isArray(raw.slots) ? raw.slots : []

  const slots = Array.from({ length: HERB_GARDEN_MAX_SLOTS }, (_, index) => {
    const slot = rawSlots[index]

    if (!slot || typeof slot !== 'object') {
      return createEmptySlot(index)
    }

    return {
      index,
      plantedAt: slot.plantedAt ?? null,
      completeAt: slot.completeAt ?? null,
    }
  })

  return {
    unlockedSlots,
    slots,
  }
}

export function isHerbSlotUnlocked(herbGarden, slotIndex) {
  return slotIndex >= 0 && slotIndex < (Number(herbGarden?.unlockedSlots) || 0)
}

export function isHerbSlotPlanted(slot) {
  return !!slot?.plantedAt && !!slot?.completeAt
}

export function isHerbSlotReady(slot, now = Date.now()) {
  if (!isHerbSlotPlanted(slot)) return false
  return now >= Number(slot.completeAt)
}

export function getHerbSlotRemainingMs(slot, now = Date.now()) {
  if (!isHerbSlotPlanted(slot)) return 0
  return Math.max(0, Number(slot.completeAt) - now)
}

export function getHerbSlotProgress(slot, now = Date.now()) {
  if (!isHerbSlotPlanted(slot)) return 0

  const plantedAt = Number(slot.plantedAt) || 0
  const completeAt = Number(slot.completeAt) || 0

  if (completeAt <= plantedAt) return 0

  const total = completeAt - plantedAt
  const elapsed = Math.min(Math.max(now - plantedAt, 0), total)

  return Math.max(0, Math.min((elapsed / total) * 100, 100))
}

export function unlockHerbGardenSlot(player, herbGarden) {
  const unlockedSlots = Number(herbGarden?.unlockedSlots) || HERB_GARDEN_START_SLOTS

  if (unlockedSlots >= HERB_GARDEN_MAX_SLOTS) {
    return {
      ok: false,
      message: 'Linh điền đã mở tối đa 8 ô.',
    }
  }

  if ((Number(player?.spiritStones) || 0) < HERB_GARDEN_UNLOCK_COST) {
    return {
      ok: false,
      message: `Không đủ ${HERB_GARDEN_UNLOCK_COST} linh thạch để mở thêm ô linh điền.`,
    }
  }

  return {
    ok: true,
    player: {
      ...player,
      spiritStones: (Number(player?.spiritStones) || 0) - HERB_GARDEN_UNLOCK_COST,
    },
    herbGarden: {
      ...herbGarden,
      unlockedSlots: unlockedSlots + 1,
    },
    message: `Đã mở thêm 1 ô linh điền, tiêu hao ${HERB_GARDEN_UNLOCK_COST} linh thạch.`,
  }
}

export function plantHerbSeed(herbGarden, slotIndex, now = Date.now()) {
  const garden = normalizeHerbGarden(herbGarden)

  if (!isHerbSlotUnlocked(garden, slotIndex)) {
    return {
      ok: false,
      message: 'Ô linh điền này chưa được mở.',
    }
  }

  const slot = garden.slots[slotIndex]

  if (isHerbSlotPlanted(slot)) {
    return {
      ok: false,
      message: 'Ô linh điền này đang trồng dược thảo.',
    }
  }

  const nextSlots = garden.slots.map((currentSlot, index) =>
    index === slotIndex
      ? {
          ...currentSlot,
          plantedAt: now,
          completeAt: now + HERB_GARDEN_GROW_TIME_MS,
        }
      : currentSlot
  )

  return {
    ok: true,
    herbGarden: {
      ...garden,
      slots: nextSlots,
    },
    message: `Đã gieo hạt giống vào ô linh điền #${slotIndex + 1}.`,
  }
}

export function harvestHerbSlot(player, herbGarden, slotIndex, now = Date.now()) {
  const garden = normalizeHerbGarden(herbGarden)

  if (!isHerbSlotUnlocked(garden, slotIndex)) {
    return {
      ok: false,
      message: 'Ô linh điền này chưa được mở.',
    }
  }

  const slot = garden.slots[slotIndex]

  if (!isHerbSlotPlanted(slot)) {
    return {
      ok: false,
      message: 'Ô linh điền này chưa gieo trồng.',
    }
  }

  if (!isHerbSlotReady(slot, now)) {
    return {
      ok: false,
      message: 'Dược thảo vẫn chưa chín.',
    }
  }

  const nextSlots = garden.slots.map((currentSlot, index) =>
    index === slotIndex
      ? {
          ...currentSlot,
          plantedAt: null,
          completeAt: null,
        }
      : currentSlot
  )

  return {
    ok: true,
    player: {
      ...player,
      herbs: (Number(player?.herbs) || 0) + HERB_GARDEN_HARVEST_YIELD,
    },
    herbGarden: {
      ...garden,
      slots: nextSlots,
    },
    message: `Đã thu hoạch ô linh điền #${slotIndex + 1}, nhận ${HERB_GARDEN_HARVEST_YIELD} dược thảo.`,
  }
}

export function harvestAllReadyHerbs(player, herbGarden, now = Date.now()) {
  const garden = normalizeHerbGarden(herbGarden)

  let harvestedCount = 0

  const nextSlots = garden.slots.map((slot, index) => {
    if (!isHerbSlotUnlocked(garden, index)) return slot
    if (!isHerbSlotReady(slot, now)) return slot

    harvestedCount += 1

    return {
      ...slot,
      plantedAt: null,
      completeAt: null,
    }
  })

  if (harvestedCount <= 0) {
    return {
      ok: false,
      message: 'Hiện chưa có ô linh điền nào sẵn sàng thu hoạch.',
    }
  }

  return {
    ok: true,
    player: {
      ...player,
      herbs: (Number(player?.herbs) || 0) + harvestedCount * HERB_GARDEN_HARVEST_YIELD,
    },
    herbGarden: {
      ...garden,
      slots: nextSlots,
    },
    message: `Đã thu hoạch ${harvestedCount} ô linh điền, nhận ${
      harvestedCount * HERB_GARDEN_HARVEST_YIELD
    } dược thảo.`,
  }
}

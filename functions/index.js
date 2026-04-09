import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

initializeApp()

const db = getFirestore()

const REALM_MORTAL = 'Phàm Nhân'
const REALM_QI = 'Luyện Khí'
const EQUIPMENT_DEFS = {
  beginner_sword: {
    slot: 'weapon',
    levelRequired: 1,
    stats: {
      damage: 2,
    },
  },
  cloth_armor: {
    slot: 'armor',
    levelRequired: 1,
    stats: {
      maxHp: 10,
      defense: 1,
    },
  },
  wind_boots: {
    slot: 'boots',
    levelRequired: 1,
    stats: {
      dodgeChance: 0.03,
    },
  },
  spirit_ring: {
    slot: 'ring',
    levelRequired: 1,
    stats: {
      damage: 1,
      maxHp: 5,
    },
  },
}

function normalizeRealm(realm) {
  const raw = String(realm || '').trim()
  const lowered = raw.toLowerCase()

  if (
    raw === REALM_MORTAL ||
    raw === 'PhÃ m NhÃ¢n' ||
    lowered === 'pham nhan' ||
    lowered === 'phàm nhân'
  ) {
    return REALM_MORTAL
  }

  if (
    raw === REALM_QI ||
    raw === 'Luyá»‡n KhÃ­' ||
    lowered === 'luyen khi' ||
    lowered === 'luyện khí'
  ) {
    return REALM_QI
  }

  return raw || REALM_MORTAL
}

function createDefaultPlayer() {
  return normalizePlayerSkills({
    id: 'player_001',
    name: '',
    realm: REALM_MORTAL,
    stage: 1,
    exp: 0,
    spiritStones: 1200,
    herbs: 20,
    hp: 100,
    mp: 100,
    baseStats: {
      maxHp: 100,
      maxMp: 100,
      damage: 8,
      defense: 2,
      critChance: 0.1,
      critDamage: 1.5,
      dodgeChance: 0.03,
      lifesteal: 0,
      damageReduction: 0,
      shield: 0,
      physicalBonus: 0,
      spiritualBonus: 0,
      trueBonus: 0,
      physicalResist: 0,
      spiritualResist: 0,
      trueResist: 0,
      hitChance: 1,
      antiCritChance: 0,
      realmMultiplier: 1,
    },
    equipment: {
      weapon: null,
      armor: null,
      ring: null,
      boots: null,
    },
    inventory: [
      {
        defId: 'beginner_sword',
        instanceId: 'seed_weapon_001',
        enhanceLevel: 0,
        equipped: false,
        bonusStats: {},
      },
      {
        defId: 'cloth_armor',
        instanceId: 'seed_armor_001',
        enhanceLevel: 0,
        equipped: false,
        bonusStats: {},
      },
      { id: 'hp_potion_small', quantity: 3 },
      { id: 'mp_potion_small', quantity: 2 },
    ],
  })
}

function createDefaultHerbGarden() {
  return {
    unlockedSlots: 1,
    slots: Array.from({ length: 8 }, (_, index) => ({
      index,
      plantedAt: null,
      completeAt: null,
    })),
  }
}

const HERB_GARDEN_MAX_SLOTS = 8
const HERB_GARDEN_START_SLOTS = 1
const HERB_GARDEN_UNLOCK_COST = 1000
const HERB_GARDEN_GROW_TIME_MS = 5 * 60 * 1000
const HERB_GARDEN_HARVEST_YIELD = 1

const ALCHEMY_RECIPES = {
  thoi_the_dan: {
    id: 'thoi_the_dan',
    itemId: 'thoi_the_dan',
    name: 'Thoi The Dan',
    craftTimeMs: 10_000,
    cost: {
      herbs: 10,
      spiritStones: 50,
    },
  },
  thoi_than_dan: {
    id: 'thoi_than_dan',
    itemId: 'thoi_than_dan',
    name: 'Thoi Than Dan',
    craftTimeMs: 10_000,
    cost: {
      herbs: 10,
      spiritStones: 50,
    },
  },
  thoi_thanh_dan: {
    id: 'thoi_thanh_dan',
    itemId: 'thoi_thanh_dan',
    name: 'Thoi Thanh Dan',
    craftTimeMs: 10_000,
    cost: {
      herbs: 20,
      spiritStones: 50,
    },
  },
}

const CONSUMABLE_DEFS = {
  hp_potion_small: {
    id: 'hp_potion_small',
    name: 'Binh HP',
    effect: {
      hp: 100,
    },
  },
  mp_potion_small: {
    id: 'mp_potion_small',
    name: 'Binh Ki',
    effect: {
      mp: 100,
    },
  },
  thoi_the_dan: {
    id: 'thoi_the_dan',
    name: 'Thoi The Dan',
    effect: {
      baseHp: 10,
    },
  },
  thoi_than_dan: {
    id: 'thoi_than_dan',
    name: 'Thoi Than Dan',
    effect: {
      baseMp: 10,
    },
  },
  thoi_thanh_dan: {
    id: 'thoi_thanh_dan',
    name: 'Thoi Thanh Dan',
    effect: {
      baseDamage: 1,
    },
  },
}

const MAX_EQUIPPED_SKILLS = 4
const SKILL_DEFS = {
  tram_kiem_quyet: {
    id: 'tram_kiem_quyet',
    name: 'Tram Kiem Quyet',
    manaCost: 50,
    cooldownTurns: 1,
    damageMultiplier: 2.2,
  },
  ngu_kiem_thuat: {
    id: 'ngu_kiem_thuat',
    name: 'Ngu Kiem Thuat',
    manaCost: 30,
    cooldownTurns: 1,
    damageMultiplier: 1.6,
  },
  liet_hoa_kiem: {
    id: 'liet_hoa_kiem',
    name: 'Liet Hoa Kiem',
    manaCost: 80,
    cooldownTurns: 2,
    damageMultiplier: 3,
  },
}

const SHOP_DEFS = {
  equipment: {
    beginner_sword: { price: 20 },
    cloth_armor: { price: 20 },
    wind_boots: { price: 50 },
    spirit_ring: { price: 60 },
  },
  skills: {
    ngu_kiem_thuat: { price: 180 },
    liet_hoa_kiem: { price: 320 },
  },
  consumables: {
    hp_potion_small: { price: 15 },
    mp_potion_small: { price: 15 },
  },
  pills: {
    thoi_the_dan: { price: 120 },
    thoi_than_dan: { price: 120 },
    thoi_thanh_dan: { price: 180 },
  },
}

function sanitizeSkillId(skillId) {
  const normalized = String(skillId || '').trim()
  return SKILL_DEFS[normalized] ? normalized : null
}

function normalizePlayerSkills(player) {
  const rawLearned = Array.isArray(player?.learnedSkills)
    ? player.learnedSkills
    : ['tram_kiem_quyet']
  const learnedSkills = Array.from(
    new Set(
      rawLearned
        .map(sanitizeSkillId)
        .filter(Boolean)
        .concat(['tram_kiem_quyet'])
    )
  )
  const rawEquipped = Array.isArray(player?.equippedSkills)
    ? player.equippedSkills
    : ['tram_kiem_quyet', null, null, null]
  const equippedSkills = Array.from({ length: MAX_EQUIPPED_SKILLS }, (_, index) => {
    const skillId = sanitizeSkillId(rawEquipped[index])
    if (!skillId) return null
    return learnedSkills.includes(skillId) ? skillId : null
  })

  if (!equippedSkills.some(Boolean) && learnedSkills.length > 0) {
    equippedSkills[0] = learnedSkills[0]
  }

  const rawCooldowns =
    player?.skillCooldowns && typeof player.skillCooldowns === 'object'
      ? player.skillCooldowns
      : {}
  const skillCooldowns = Object.fromEntries(
    Object.entries(rawCooldowns)
      .map(([skillId, turns]) => [sanitizeSkillId(skillId), Math.max(0, Number(turns) || 0)])
      .filter(([skillId]) => Boolean(skillId))
  )

  return {
    ...player,
    learnedSkills,
    equippedSkills,
    skillCooldowns,
  }
}

function equipCombatSkill(player, skillId, slotIndex) {
  const normalized = normalizePlayerSkills(player)
  const safeSkillId = sanitizeSkillId(skillId)
  const safeSlotIndex = Number(slotIndex)

  if (!safeSkillId) {
    return { ok: false, message: 'Ky nang khong ton tai.' }
  }

  if (!Number.isInteger(safeSlotIndex) || safeSlotIndex < 0 || safeSlotIndex >= MAX_EQUIPPED_SKILLS) {
    return { ok: false, message: 'O trang bi ky nang khong hop le.' }
  }

  if (!normalized.learnedSkills.includes(safeSkillId)) {
    return { ok: false, message: 'Ban chua hoc ky nang nay.' }
  }

  return {
    ok: true,
    player: {
      ...normalized,
      equippedSkills: normalized.equippedSkills.map((equippedSkillId, index) => {
        if (equippedSkillId === safeSkillId) return null
        if (index === safeSlotIndex) return safeSkillId
        return equippedSkillId
      }),
    },
    message: `Da trang bi ${SKILL_DEFS[safeSkillId].name} vao o ${safeSlotIndex + 1}.`,
  }
}

function unequipCombatSkill(player, slotIndex) {
  const normalized = normalizePlayerSkills(player)
  const safeSlotIndex = Number(slotIndex)

  if (!Number.isInteger(safeSlotIndex) || safeSlotIndex < 0 || safeSlotIndex >= MAX_EQUIPPED_SKILLS) {
    return { ok: false, message: 'O trang bi ky nang khong hop le.' }
  }

  const currentSkillId = normalized.equippedSkills[safeSlotIndex]
  if (!currentSkillId) {
    return { ok: false, message: 'O ky nang nay dang trong.' }
  }

  return {
    ok: true,
    player: {
      ...normalized,
      equippedSkills: normalized.equippedSkills.map((skillId, index) =>
        index === safeSlotIndex ? null : skillId
      ),
    },
    message: `Da thao ${SKILL_DEFS[currentSkillId].name} khoi o ${safeSlotIndex + 1}.`,
  }
}

function advanceSkillCooldowns(player) {
  const normalized = normalizePlayerSkills(player)
  return {
    ...normalized,
    skillCooldowns: Object.fromEntries(
      Object.entries(normalized.skillCooldowns).map(([skillId, turns]) => [
        skillId,
        Math.max(0, Number(turns) - 1),
      ])
    ),
  }
}

function consumeCombatSkill(player, skillId) {
  const normalized = normalizePlayerSkills(player)
  const safeSkillId = sanitizeSkillId(skillId)
  const def = safeSkillId ? SKILL_DEFS[safeSkillId] : null

  if (!safeSkillId || !def) {
    return { ok: false, message: 'Ky nang khong ton tai.' }
  }

  if (!normalized.equippedSkills.includes(safeSkillId)) {
    return { ok: false, message: 'Ky nang chua duoc trang bi.' }
  }

  const cooldown = Math.max(0, Number(normalized.skillCooldowns?.[safeSkillId]) || 0)
  if (cooldown > 0) {
    return { ok: false, message: `${def.name} con hoi chieu ${cooldown} luot.` }
  }

  if ((Number(normalized.mp) || 0) < def.manaCost) {
    return { ok: false, message: `Khong du ${def.manaCost} Ki de thi trien ${def.name}.` }
  }

  return {
    ok: true,
    def,
    player: {
      ...normalized,
      mp: Math.max(0, (Number(normalized.mp) || 0) - def.manaCost),
      skillCooldowns: {
        ...normalized.skillCooldowns,
        [safeSkillId]: Number(def.cooldownTurns) + 1,
      },
    },
  }
}

function normalizePlayerName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ')
}

function normalizePlayerNameKey(name) {
  return normalizePlayerName(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function setInitialPlayerName(player, newName) {
  const normalizedName = normalizePlayerName(newName)
  const currentName = normalizePlayerName(player?.name || '')

  if (currentName) {
    return {
      ok: false,
      message: 'Tai khoan nay da co nhan vat roi.',
    }
  }

  if (!normalizedName) {
    return {
      ok: false,
      message: 'Vui long nhap ten nhan vat.',
    }
  }

  if (normalizedName.length < 2) {
    return {
      ok: false,
      message: 'Ten nhan vat phai tu 2 ky tu tro len.',
    }
  }

  if (normalizedName.length > 20) {
    return {
      ok: false,
      message: 'Ten nhan vat toi da 20 ky tu.',
    }
  }

  return {
    ok: true,
    player: {
      ...player,
      name: normalizedName,
    },
    message: `Dao hieu da dinh: ${normalizedName}.`,
  }
}

function createEmptyHerbSlot(index) {
  return {
    index,
    plantedAt: null,
    completeAt: null,
  }
}

function normalizeHerbGarden(herbGarden) {
  if (!herbGarden || typeof herbGarden !== 'object') {
    return createDefaultHerbGarden()
  }

  const unlockedSlots = Math.max(
    HERB_GARDEN_START_SLOTS,
    Math.min(
      Number(herbGarden.unlockedSlots) || HERB_GARDEN_START_SLOTS,
      HERB_GARDEN_MAX_SLOTS
    )
  )
  const rawSlots = Array.isArray(herbGarden.slots) ? herbGarden.slots : []

  return {
    unlockedSlots,
    slots: Array.from({ length: HERB_GARDEN_MAX_SLOTS }, (_, index) => {
      const slot = rawSlots[index]

      if (!slot || typeof slot !== 'object') {
        return createEmptyHerbSlot(index)
      }

      return {
        index,
        plantedAt: slot.plantedAt ?? null,
        completeAt: slot.completeAt ?? null,
      }
    }),
  }
}

function isHerbSlotUnlocked(herbGarden, slotIndex) {
  return slotIndex >= 0 && slotIndex < (Number(herbGarden?.unlockedSlots) || 0)
}

function isHerbSlotPlanted(slot) {
  return !!slot?.plantedAt && !!slot?.completeAt
}

function isHerbSlotReady(slot, now = Date.now()) {
  if (!isHerbSlotPlanted(slot)) return false
  return now >= Number(slot.completeAt)
}

function unlockHerbGardenSlot(player, herbGarden) {
  const garden = normalizeHerbGarden(herbGarden)
  const unlockedSlots = Number(garden.unlockedSlots) || HERB_GARDEN_START_SLOTS

  if (unlockedSlots >= HERB_GARDEN_MAX_SLOTS) {
    return {
      ok: false,
      message: 'Linh dien da mo toi da 8 o.',
    }
  }

  if ((Number(player?.spiritStones) || 0) < HERB_GARDEN_UNLOCK_COST) {
    return {
      ok: false,
      message: `Khong du ${HERB_GARDEN_UNLOCK_COST} linh thach de mo them o linh dien.`,
    }
  }

  return {
    ok: true,
    player: {
      ...player,
      spiritStones:
        (Number(player?.spiritStones) || 0) - HERB_GARDEN_UNLOCK_COST,
    },
    herbGarden: {
      ...garden,
      unlockedSlots: unlockedSlots + 1,
    },
    message: `Da mo them 1 o linh dien, tieu hao ${HERB_GARDEN_UNLOCK_COST} linh thach.`,
  }
}

function plantHerbSeed(herbGarden, slotIndex, now = Date.now()) {
  const garden = normalizeHerbGarden(herbGarden)

  if (!isHerbSlotUnlocked(garden, slotIndex)) {
    return {
      ok: false,
      message: 'O linh dien nay chua duoc mo.',
    }
  }

  const slot = garden.slots[slotIndex]

  if (isHerbSlotPlanted(slot)) {
    return {
      ok: false,
      message: 'O linh dien nay dang trong duoc thao.',
    }
  }

  return {
    ok: true,
    herbGarden: {
      ...garden,
      slots: garden.slots.map((currentSlot, index) =>
        index === slotIndex
          ? {
              ...currentSlot,
              plantedAt: now,
              completeAt: now + HERB_GARDEN_GROW_TIME_MS,
            }
          : currentSlot
      ),
    },
    message: `Da gieo hat giong vao o linh dien #${slotIndex + 1}.`,
  }
}

function harvestHerbSlot(player, herbGarden, slotIndex, now = Date.now()) {
  const garden = normalizeHerbGarden(herbGarden)

  if (!isHerbSlotUnlocked(garden, slotIndex)) {
    return {
      ok: false,
      message: 'O linh dien nay chua duoc mo.',
    }
  }

  const slot = garden.slots[slotIndex]

  if (!isHerbSlotPlanted(slot)) {
    return {
      ok: false,
      message: 'O linh dien nay chua gieo trong.',
    }
  }

  if (!isHerbSlotReady(slot, now)) {
    return {
      ok: false,
      message: 'Duoc thao van chua chin.',
    }
  }

  return {
    ok: true,
    player: {
      ...player,
      herbs: (Number(player?.herbs) || 0) + HERB_GARDEN_HARVEST_YIELD,
    },
    herbGarden: {
      ...garden,
      slots: garden.slots.map((currentSlot, index) =>
        index === slotIndex
          ? {
              ...currentSlot,
              plantedAt: null,
              completeAt: null,
            }
          : currentSlot
      ),
    },
    message: `Da thu hoach o linh dien #${slotIndex + 1}, nhan ${HERB_GARDEN_HARVEST_YIELD} duoc thao.`,
  }
}

function harvestAllReadyHerbs(player, herbGarden, now = Date.now()) {
  const garden = normalizeHerbGarden(herbGarden)
  let harvestedCount = 0

  const slots = garden.slots.map((slot, index) => {
    if (!isHerbSlotUnlocked(garden, index) || !isHerbSlotReady(slot, now)) {
      return slot
    }

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
      message: 'Hien chua co o linh dien nao san sang thu hoach.',
    }
  }

  return {
    ok: true,
    player: {
      ...player,
      herbs:
        (Number(player?.herbs) || 0) +
        harvestedCount * HERB_GARDEN_HARVEST_YIELD,
    },
    herbGarden: {
      ...garden,
      slots,
    },
    message: `Da thu hoach ${harvestedCount} o linh dien, nhan ${
      harvestedCount * HERB_GARDEN_HARVEST_YIELD
    } duoc thao.`,
  }
}

function getAlchemyRecipe(recipeId) {
  return ALCHEMY_RECIPES[recipeId] || null
}

function addItemToInventory(inventory = [], itemToAdd) {
  if (!itemToAdd) return inventory

  const existingIndex = inventory.findIndex(
    (item) => item?.id === itemToAdd.id && !item?.defId
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

function createEquipmentInstance(defId) {
  return {
    instanceId: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    defId,
    enhanceLevel: 0,
    equipped: false,
    bonusStats: {},
  }
}

function removeConsumableFromInventory(inventory = [], itemId, amount = 1) {
  return inventory
    .map((item) => {
      if (item?.id === itemId && !item?.defId) {
        return {
          ...item,
          quantity: Math.max(0, (item.quantity || 0) - amount),
        }
      }

      return item
    })
    .filter((item) => {
      if (item?.id && !item?.defId) {
        return (item.quantity || 0) > 0
      }

      return true
    })
}

function getInventoryItemByInstanceId(inventory = [], instanceId) {
  return inventory.find((item) => item?.instanceId === instanceId) || null
}

function canEquipItem(player, inventoryItem) {
  const def = EQUIPMENT_DEFS[inventoryItem?.defId]

  if (!def) {
    return {
      ok: false,
      message: 'Khong tim thay du lieu trang bi.',
    }
  }

  if ((Number(player?.stage) || 1) < (Number(def.levelRequired) || 1)) {
    return {
      ok: false,
      message: `Can canh gioi/tang toi thieu ${def.levelRequired}.`,
    }
  }

  return { ok: true, def }
}

function equipItem(player, instanceId) {
  const inventoryItem = getInventoryItemByInstanceId(player?.inventory || [], instanceId)

  if (!inventoryItem) {
    return {
      ok: false,
      message: 'Khong tim thay vat pham trong tui do.',
    }
  }

  const check = canEquipItem(player, inventoryItem)
  if (!check.ok) return check

  const slot = check.def.slot
  const oldInstanceId = player?.equipment?.[slot] || null

  return {
    ok: true,
    message: `Da trang bi ${check.def.name || inventoryItem.defId}.`,
    player: clampPlayerHp({
      ...player,
      equipment: {
        ...(player?.equipment || {}),
        [slot]: instanceId,
      },
      inventory: (player?.inventory || []).map((item) => {
        if (item?.instanceId === instanceId) {
          return { ...item, equipped: true }
        }

        if (item?.instanceId === oldInstanceId) {
          return { ...item, equipped: false }
        }

        return item
      }),
    }),
  }
}

function unequipItem(player, slot) {
  const instanceId = player?.equipment?.[slot]

  if (!instanceId) {
    return {
      ok: false,
      message: 'O trang bi dang trong.',
    }
  }

  return {
    ok: true,
    message: 'Da thao trang bi.',
    player: clampPlayerHp({
      ...player,
      equipment: {
        ...(player?.equipment || {}),
        [slot]: null,
      },
      inventory: (player?.inventory || []).map((item) =>
        item?.instanceId === instanceId ? { ...item, equipped: false } : item
      ),
    }),
  }
}

function useConsumable(player, itemId) {
  const item = (player?.inventory || []).find((entry) => entry?.id === itemId)

  if (!item || (item.quantity || 0) <= 0) {
    return {
      ok: false,
      message: 'Khong co vat pham.',
    }
  }

  const def = CONSUMABLE_DEFS[itemId]

  if (!def) {
    return {
      ok: false,
      message: 'Vat pham khong hop le.',
    }
  }

  const finalStats = getFinalStats(player)
  const nextPlayer = {
    ...player,
    baseStats: {
      ...(player?.baseStats || {}),
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
      Math.max(
        Number(player?.hp) || 0,
        Number(nextPlayer.baseStats.maxHp) || 0
      ),
      Number(nextFinalStats?.maxHp) || 0
    )
  }

  if (def.effect?.baseMp) {
    nextPlayer.baseStats.maxMp =
      (Number(nextPlayer.baseStats.maxMp) || 0) + Number(def.effect.baseMp || 0)

    const nextFinalStats = getFinalStats(nextPlayer)
    nextPlayer.mp = Math.min(
      Math.max(
        Number(player?.mp) || 0,
        Number(nextPlayer.baseStats.maxMp) || 0
      ),
      Number(nextFinalStats?.maxMp) || 0
    )
  }

  if (def.effect?.baseDamage) {
    nextPlayer.baseStats.damage =
      (Number(nextPlayer.baseStats.damage) || 0) +
      Number(def.effect.baseDamage || 0)
  }

  nextPlayer.inventory = removeConsumableFromInventory(
    player?.inventory || [],
    itemId,
    1
  )

  return {
    ok: true,
    player: nextPlayer,
    message: `Da dung ${def.name}.`,
  }
}

function purchaseShopItem(player, sectionId, itemId) {
  const section = SHOP_DEFS[sectionId]
  if (!section) {
    return { ok: false, message: 'Gian hang khong ton tai.' }
  }

  const config = section[itemId]
  if (!config) {
    return { ok: false, message: 'Vat pham khong co trong gian hang nay.' }
  }

  const price = Math.max(0, Number(config.price) || 0)

  if ((Number(player?.spiritStones) || 0) < price) {
    return { ok: false, message: `Khong du ${price} linh thach.` }
  }

  if (sectionId === 'equipment') {
    const def = EQUIPMENT_DEFS[itemId]
    if (!def) return { ok: false, message: 'Trang bi khong ton tai.' }

    return {
      ok: true,
      player: {
        ...player,
        spiritStones: (Number(player?.spiritStones) || 0) - price,
        inventory: [...(player?.inventory || []), createEquipmentInstance(itemId)],
      },
      message: `Da mua ${def.name}.`,
    }
  }

  if (sectionId === 'skills') {
    const normalizedPlayer = normalizePlayerSkills(player)
    const safeSkillId = sanitizeSkillId(itemId)
    const def = safeSkillId ? SKILL_DEFS[safeSkillId] : null

    if (!safeSkillId || !def) {
      return { ok: false, message: 'Ky nang khong ton tai.' }
    }

    if (normalizedPlayer.learnedSkills.includes(safeSkillId)) {
      return { ok: false, message: 'Ban da hoc ky nang nay roi.' }
    }

    return {
      ok: true,
      player: normalizePlayerSkills({
        ...normalizedPlayer,
        spiritStones: (Number(normalizedPlayer?.spiritStones) || 0) - price,
        learnedSkills: [...normalizedPlayer.learnedSkills, safeSkillId],
      }),
      message: `Da mua bi tich ${def.name}.`,
    }
  }

  const def = CONSUMABLE_DEFS[itemId]
  if (!def) {
    return { ok: false, message: 'Vat pham khong ton tai.' }
  }

  return {
    ok: true,
    player: {
      ...player,
      spiritStones: (Number(player?.spiritStones) || 0) - price,
      inventory: addItemToInventory(player?.inventory || [], {
        id: itemId,
        quantity: 1,
      }),
    },
    message: `Da mua ${def.name}.`,
  }
}

const REWARD_BASE_STAT_KEYS = ['maxHp', 'maxMp', 'damage', 'defense']

function normalizeGiftCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-_]/g, '')
}

function createRandomGiftCode() {
  return `HTDL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function normalizeRewardPayload(rawReward) {
  const reward = rawReward && typeof rawReward === 'object' ? rawReward : {}

  const consumables = Array.isArray(reward.consumables)
    ? reward.consumables
        .map((entry) => ({
          itemId: String(entry?.itemId || '').trim(),
          quantity: Math.max(1, Number(entry?.quantity) || 1),
        }))
        .filter((entry) => Boolean(CONSUMABLE_DEFS[entry.itemId]))
    : []

  const equipments = Array.isArray(reward.equipments)
    ? reward.equipments
        .map((entry) => ({
          defId: String(entry?.defId || '').trim(),
          quantity: Math.max(1, Number(entry?.quantity) || 1),
        }))
        .filter((entry) => Boolean(EQUIPMENT_DEFS[entry.defId]))
    : []

  const skills = Array.isArray(reward.skills)
    ? Array.from(
        new Set(
          reward.skills
            .map(sanitizeSkillId)
            .filter(Boolean)
        )
      )
    : []

  const rawBaseStats =
    reward.baseStats && typeof reward.baseStats === 'object' ? reward.baseStats : {}

  const baseStats = Object.fromEntries(
    REWARD_BASE_STAT_KEYS.map((key) => [key, Math.max(0, Number(rawBaseStats[key]) || 0)])
      .filter(([, value]) => value > 0)
  )

  return {
    spiritStones: Math.max(0, Number(reward.spiritStones) || 0),
    herbs: Math.max(0, Number(reward.herbs) || 0),
    consumables,
    equipments,
    skills,
    baseStats,
  }
}

function hasRewardPayloadContent(reward) {
  return (
    (Number(reward?.spiritStones) || 0) > 0 ||
    (Number(reward?.herbs) || 0) > 0 ||
    (reward?.consumables?.length || 0) > 0 ||
    (reward?.equipments?.length || 0) > 0 ||
    (reward?.skills?.length || 0) > 0 ||
    Object.keys(reward?.baseStats || {}).length > 0
  )
}

function applyRewardPayload(player, reward) {
  if (!hasRewardPayloadContent(reward)) {
    return {
      ok: false,
      message: 'Code nay khong co phan thuong hop le.',
    }
  }

  let nextPlayer = normalizePlayerSkills(player)
  let nextInventory = [...(nextPlayer?.inventory || [])]
  let nextLearnedSkills = [...(nextPlayer?.learnedSkills || [])]

  for (const consumable of reward.consumables || []) {
    nextInventory = addItemToInventory(nextInventory, {
      id: consumable.itemId,
      quantity: consumable.quantity,
    })
  }

  for (const equipment of reward.equipments || []) {
    for (let index = 0; index < equipment.quantity; index += 1) {
      nextInventory.push(createEquipmentInstance(equipment.defId))
    }
  }

  for (const skillId of reward.skills || []) {
    if (!nextLearnedSkills.includes(skillId)) {
      nextLearnedSkills.push(skillId)
    }
  }

  nextPlayer = normalizePlayerSkills({
    ...nextPlayer,
    spiritStones: (Number(nextPlayer?.spiritStones) || 0) + (Number(reward.spiritStones) || 0),
    herbs: (Number(nextPlayer?.herbs) || 0) + (Number(reward.herbs) || 0),
    inventory: nextInventory,
    learnedSkills: nextLearnedSkills,
    baseStats: {
      ...(nextPlayer?.baseStats || {}),
      maxHp:
        (Number(nextPlayer?.baseStats?.maxHp) || 0) +
        (Number(reward?.baseStats?.maxHp) || 0),
      maxMp:
        (Number(nextPlayer?.baseStats?.maxMp) || 0) +
        (Number(reward?.baseStats?.maxMp) || 0),
      damage:
        (Number(nextPlayer?.baseStats?.damage) || 0) +
        (Number(reward?.baseStats?.damage) || 0),
      defense:
        (Number(nextPlayer?.baseStats?.defense) || 0) +
        (Number(reward?.baseStats?.defense) || 0),
    },
  })

  return {
    ok: true,
    player: nextPlayer,
  }
}

async function assertAdmin(uid) {
  const snap = await db.collection('users').doc(uid).get()
  const role = String(snap.data()?.role || 'player')

  if (role !== 'admin') {
    throw new HttpsError('permission-denied', 'Chi admin moi duoc thuc hien thao tac nay.')
  }
}

function startAlchemyCraft(player, recipeId, now = Date.now()) {
  const recipe = getAlchemyRecipe(recipeId)

  if (!recipe) {
    return {
      ok: false,
      message: 'Dan phuong khong ton tai.',
    }
  }

  if ((Number(player?.herbs) || 0) < (Number(recipe.cost?.herbs) || 0)) {
    return {
      ok: false,
      message: `Khong du duoc thao de luyen ${recipe.name}.`,
    }
  }

  if (
    (Number(player?.spiritStones) || 0) <
    (Number(recipe.cost?.spiritStones) || 0)
  ) {
    return {
      ok: false,
      message: `Khong du linh thach de luyen ${recipe.name}.`,
    }
  }

  const itemDef = CONSUMABLE_DEFS[recipe.itemId]

  if (!itemDef) {
    return {
      ok: false,
      message: 'Vat pham dau ra cua dan phuong khong hop le.',
    }
  }

  return {
    ok: true,
    player: {
      ...player,
      herbs: (Number(player?.herbs) || 0) - (Number(recipe.cost?.herbs) || 0),
      spiritStones:
        (Number(player?.spiritStones) || 0) -
        (Number(recipe.cost?.spiritStones) || 0),
    },
    crafting: {
      recipeId: recipe.id,
      itemId: recipe.itemId,
      recipeName: recipe.name,
      itemName: itemDef.name,
      startedAt: now,
      completeAt: now + (Number(recipe.craftTimeMs) || 0),
      durationMs: Number(recipe.craftTimeMs) || 0,
    },
    message: `Bat dau luyen ${recipe.name}.`,
  }
}

function isAlchemyCraftComplete(craftState, now = Date.now()) {
  if (!craftState?.completeAt) return false
  return now >= Number(craftState.completeAt)
}

function finishAlchemyCraft(player, craftState) {
  if (!craftState?.itemId) {
    return {
      ok: false,
      message: 'Khong co tien trinh luyen dan hop le.',
    }
  }

  const itemDef = CONSUMABLE_DEFS[craftState.itemId]

  if (!itemDef) {
    return {
      ok: false,
      message: 'Dan duoc hoan thanh khong hop le.',
    }
  }

  return {
    ok: true,
    player: {
      ...player,
      inventory: addItemToInventory(player?.inventory || [], {
        id: craftState.itemId,
        quantity: 1,
      }),
    },
    message: `Luyen thanh cong ${itemDef.name}.`,
  }
}

function sanitizeLogs(rawLogs, nextMessage) {
  const logs = Array.isArray(rawLogs) ? rawLogs.filter(Boolean) : []
  return [nextMessage, ...logs].slice(0, 20)
}

function sanitizeCombatLogs(rawLogs) {
  const logs = Array.isArray(rawLogs) ? rawLogs.filter(Boolean) : []
  return logs.slice(-40)
}

function getBreakthroughCost(player) {
  const realm = normalizeRealm(player?.realm)

  if (realm === REALM_MORTAL) {
    return { spiritStones: 100, herbs: 10 }
  }

  if (realm === REALM_QI) {
    return { spiritStones: 200, herbs: 10 }
  }

  return { spiritStones: 0, herbs: 0 }
}

function canBreakthrough(player) {
  const cost = getBreakthroughCost(player)

  if ((Number(player?.exp) || 0) < 100) {
    return {
      ok: false,
      message: 'Chưa đủ 100 EXP để đột phá.',
    }
  }

  if ((Number(player?.spiritStones) || 0) < cost.spiritStones) {
    return {
      ok: false,
      message: `Không đủ ${cost.spiritStones} linh thạch.`,
    }
  }

  if ((Number(player?.herbs) || 0) < cost.herbs) {
    return {
      ok: false,
      message: `Không đủ ${cost.herbs} dược thảo.`,
    }
  }

  return { ok: true }
}

function applyBaseStatGrowth(player, growth) {
  const currentBase = player?.baseStats || {}

  const nextBaseStats = {
    ...currentBase,
    maxHp: (Number(currentBase.maxHp) || 0) + (Number(growth.maxHp) || 0),
    maxMp: (Number(currentBase.maxMp) || 0) + (Number(growth.maxMp) || 0),
    damage: (Number(currentBase.damage) || 0) + (Number(growth.damage) || 0),
    defense: (Number(currentBase.defense) || 0) + (Number(growth.defense) || 0),
  }

  return {
    ...player,
    hp: nextBaseStats.maxHp,
    mp: nextBaseStats.maxMp,
    baseStats: nextBaseStats,
  }
}

function breakthrough(player) {
  const normalizedPlayer = {
    ...player,
    realm: normalizeRealm(player?.realm),
  }

  const check = canBreakthrough(normalizedPlayer)
  if (!check.ok) return check

  const cost = getBreakthroughCost(normalizedPlayer)

  let updated = {
    ...normalizedPlayer,
    exp: 0,
    spiritStones:
      (Number(normalizedPlayer?.spiritStones) || 0) - cost.spiritStones,
    herbs: (Number(normalizedPlayer?.herbs) || 0) - cost.herbs,
  }

  if (normalizedPlayer.realm === REALM_MORTAL) {
    updated = applyBaseStatGrowth(updated, {
      maxHp: 100,
      maxMp: 100,
      damage: 1,
      defense: 1,
    })

    if ((Number(normalizedPlayer?.stage) || 1) < 10) {
      updated.stage = (Number(normalizedPlayer?.stage) || 1) + 1
      return {
        ok: true,
        player: updated,
        message: `Đột phá thành công Phàm Nhân tầng ${updated.stage}.`,
      }
    }

    updated.realm = REALM_QI
    updated.stage = 1

    return {
      ok: true,
      player: updated,
      message: 'Đột phá thành công, bước vào Luyện Khí tầng 1.',
    }
  }

  if (normalizedPlayer.realm === REALM_QI) {
    if ((Number(normalizedPlayer?.stage) || 1) >= 10) {
      return {
        ok: false,
        message: 'Tạm thời đã đạt cảnh giới cao nhất.',
      }
    }

    updated = applyBaseStatGrowth(updated, {
      maxHp: 200,
      maxMp: 200,
      damage: 2,
      defense: 1,
    })

    updated.stage = (Number(normalizedPlayer?.stage) || 1) + 1

    return {
      ok: true,
      player: updated,
      message: `Đột phá thành công Luyện Khí tầng ${updated.stage}.`,
    }
  }

  return {
    ok: false,
    message: 'Không thể đột phá.',
  }
}

function getEquippedItems(player) {
  const result = []

  for (const instanceId of Object.values(player?.equipment ?? {})) {
    if (!instanceId) continue

    const inventoryItem = (player?.inventory ?? []).find(
      (item) => item?.instanceId === instanceId
    )
    if (!inventoryItem) continue

    const def = EQUIPMENT_DEFS[inventoryItem.defId]
    if (!def) continue

    result.push({ instance: inventoryItem, def })
  }

  return result
}

function getEquipmentStats(player) {
  const total = {
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

  for (const item of getEquippedItems(player)) {
    const baseStats = item.def.stats ?? {}
    const bonusStats = item.instance.bonusStats ?? {}

    for (const [key, value] of Object.entries(baseStats)) {
      total[key] = (total[key] ?? 0) + (value ?? 0)
    }

    for (const [key, value] of Object.entries(bonusStats)) {
      total[key] = (total[key] ?? 0) + (value ?? 0)
    }
  }

  return total
}

function getFinalStats(player) {
  const equipmentStats = getEquipmentStats(player)
  const base = player?.baseStats ?? {}

  return {
    maxHp: (base.maxHp ?? 0) + (equipmentStats.maxHp ?? 0),
    maxMp: (base.maxMp ?? 0) + (equipmentStats.maxMp ?? 0),
    damage: (base.damage ?? 0) + (equipmentStats.damage ?? 0),
    defense: (base.defense ?? 0) + (equipmentStats.defense ?? 0),
    critChance: (base.critChance ?? 0) + (equipmentStats.critChance ?? 0),
    critDamage: (base.critDamage ?? 1) + (equipmentStats.critDamage ?? 0),
    dodgeChance: (base.dodgeChance ?? 0) + (equipmentStats.dodgeChance ?? 0),
    lifesteal: (base.lifesteal ?? 0) + (equipmentStats.lifesteal ?? 0),
    damageReduction:
      (base.damageReduction ?? 0) + (equipmentStats.damageReduction ?? 0),
    shield: (base.shield ?? 0) + (equipmentStats.shield ?? 0),
    physicalBonus: (base.physicalBonus ?? 0) + (equipmentStats.physicalBonus ?? 0),
    spiritualBonus:
      (base.spiritualBonus ?? 0) + (equipmentStats.spiritualBonus ?? 0),
    trueBonus: (base.trueBonus ?? 0) + (equipmentStats.trueBonus ?? 0),
    physicalResist:
      (base.physicalResist ?? 0) + (equipmentStats.physicalResist ?? 0),
    spiritualResist:
      (base.spiritualResist ?? 0) + (equipmentStats.spiritualResist ?? 0),
    trueResist: (base.trueResist ?? 0) + (equipmentStats.trueResist ?? 0),
    hitChance: (base.hitChance ?? 1) + (equipmentStats.hitChance ?? 0),
    antiCritChance:
      (base.antiCritChance ?? 0) + (equipmentStats.antiCritChance ?? 0),
    realmMultiplier:
      (base.realmMultiplier ?? 1) + (equipmentStats.realmMultiplier ?? 0),
  }
}

function getPowerScore(player) {
  const finalStats = getFinalStats(player)

  return Math.round(
    (Number(finalStats.maxHp) || 0) +
      (Number(finalStats.maxMp) || 0) * 0.3 +
      (Number(finalStats.damage) || 0) * 12 +
      (Number(finalStats.defense) || 0) * 10 +
      (Number(player?.stage) || 1) * 25
  )
}

function clampPlayerHp(player) {
  const finalStats = getFinalStats(player)
  const maxHp = Number(finalStats?.maxHp) || 1
  const currentHp = Number(player?.hp ?? maxHp) || maxHp

  return {
    ...player,
    hp: Math.max(0, Math.min(currentHp, maxHp)),
  }
}

function buildPublicPlayerPayload(uid, player, profile) {
  const finalStats = getFinalStats(player)
  const normalizedName = normalizePlayerName(
    player?.name || profile?.displayName || 'Vo Danh'
  )

  return {
    uid,
    name: normalizedName || 'Vo Danh',
    realm: normalizeRealm(player?.realm),
    stage: Number(player?.stage) || 1,
    exp: Number(player?.exp) || 0,
    power: getPowerScore(player),
    spiritStones: Number(player?.spiritStones) || 0,
    herbs: Number(player?.herbs) || 0,
    hp: Number(player?.hp) || 0,
    maxHp: Number(finalStats?.maxHp) || 0,
    damage: Number(finalStats?.damage) || 0,
    defense: Number(finalStats?.defense) || 0,
    updatedAt: FieldValue.serverTimestamp(),
    lastSeenAt: FieldValue.serverTimestamp(),
  }
}

function toNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback
}

function toNonNegativeNumber(value, fallback = 0) {
  return Math.max(0, toNumber(value, fallback))
}

function toPositiveNumber(value, fallback = 1) {
  return Math.max(1, toNumber(value, fallback))
}

function normalizeEntity(entity = {}) {
  const hp = toNonNegativeNumber(entity.hp, 0)
  const maxHp = toPositiveNumber(entity.maxHp, hp || 1)
  const mp = toNonNegativeNumber(entity.mp, 0)
  const maxMp = Math.max(0, toNumber(entity.maxMp, mp))
  const damage = toNonNegativeNumber(entity.damage, 0)
  const defense = toNonNegativeNumber(entity.defense, 0)

  return {
    id: entity.id ?? null,
    name: entity.name ?? 'Mục tiêu',
    type: entity.type ?? 'unit',
    hp: Math.min(hp, maxHp),
    maxHp,
    mp: Math.min(mp, maxMp),
    maxMp,
    damage,
    defense,
  }
}

function calculateDamage(attacker, defender) {
  const rawDamage = attacker.damage - defender.defense
  return Math.max(1, rawDamage)
}

function resolveSkillAttack(attackerInput, defenderInput, multiplier = 1) {
  const attacker = normalizeEntity(attackerInput)
  const defender = normalizeEntity(defenderInput)

  if (attacker.hp <= 0 || defender.hp <= 0) {
    return resolveAttack(attacker, defender)
  }

  const baseDamage = calculateDamage(attacker, defender)
  const damage = Math.max(1, Math.round(baseDamage * Math.max(1, Number(multiplier) || 1)))
  const defenderNextHp = Math.max(0, defender.hp - damage)

  return {
    damage,
    attackerNext: { ...attacker },
    defenderNext: {
      ...defender,
      hp: defenderNextHp,
    },
    isDefenderDead: defenderNextHp <= 0,
    log: `${attacker.name} tung ky nang gay ${damage} sat thuong len ${defender.name}.`,
  }
}

function resolveAttack(attackerInput, defenderInput) {
  const attacker = normalizeEntity(attackerInput)
  const defender = normalizeEntity(defenderInput)

  if (attacker.hp <= 0) {
    return {
      damage: 0,
      attackerNext: { ...attacker },
      defenderNext: { ...defender },
      isDefenderDead: defender.hp <= 0,
      log: `${attacker.name} đã mất sức chiến đấu.`,
    }
  }

  if (defender.hp <= 0) {
    return {
      damage: 0,
      attackerNext: { ...attacker },
      defenderNext: { ...defender },
      isDefenderDead: true,
      log: `${defender.name} đã bị đánh bại.`,
    }
  }

  const damage = calculateDamage(attacker, defender)
  const defenderNextHp = Math.max(0, defender.hp - damage)

  return {
    damage,
    attackerNext: { ...attacker },
    defenderNext: {
      ...defender,
      hp: defenderNextHp,
    },
    isDefenderDead: defenderNextHp <= 0,
    log: `${attacker.name} gây ${damage} sát thương lên ${defender.name}.`,
  }
}

function resolveCombatRound(playerInput, enemyInput) {
  const player = normalizeEntity(playerInput)
  const enemy = normalizeEntity(enemyInput)

  if (player.hp <= 0) {
    return {
      playerAttack: null,
      enemyAttack: null,
      nextPlayer: { ...player, hp: 0 },
      nextEnemy: { ...enemy },
      isPlayerDead: true,
      isEnemyDead: enemy.hp <= 0,
      logs: ['Bạn đã mất sức chiến đấu.'],
    }
  }

  if (enemy.hp <= 0) {
    return {
      playerAttack: null,
      enemyAttack: null,
      nextPlayer: { ...player },
      nextEnemy: { ...enemy, hp: 0 },
      isPlayerDead: false,
      isEnemyDead: true,
      logs: [`${enemy.name} đã bị đánh bại.`],
    }
  }

  const playerAttack = resolveAttack(player, enemy)
  const logs = [playerAttack.log]

  if (playerAttack.isDefenderDead) {
    return {
      playerAttack,
      enemyAttack: null,
      nextPlayer: { ...playerAttack.attackerNext },
      nextEnemy: { ...playerAttack.defenderNext },
      isPlayerDead: false,
      isEnemyDead: true,
      logs,
    }
  }

  const enemyAttack = resolveAttack(
    playerAttack.defenderNext,
    playerAttack.attackerNext
  )
  logs.push(enemyAttack.log)

  return {
    playerAttack,
    enemyAttack,
    nextPlayer: { ...enemyAttack.defenderNext },
    nextEnemy: { ...enemyAttack.attackerNext },
    isPlayerDead: enemyAttack.defenderNext.hp <= 0,
    isEnemyDead: false,
    logs,
  }
}

function buildCombatEntityFromPlayer(player, finalStats) {
  return normalizeEntity({
    id: player?.id ?? 'player',
    name: player?.name ?? 'Người chơi',
    type: 'player',
    hp: player?.hp ?? finalStats.maxHp ?? 1,
    maxHp: finalStats.maxHp ?? 1,
    mp: player?.mp ?? finalStats.maxMp ?? 0,
    maxMp: finalStats.maxMp ?? 0,
    damage: finalStats.damage ?? 0,
    defense: finalStats.defense ?? 0,
  })
}

function buildCombatEntityFromEnemy(enemy) {
  return normalizeEntity({
    id: enemy?.id ?? null,
    name: enemy?.name ?? 'Quái',
    type: enemy?.type ?? 'enemy',
    hp: enemy?.hp ?? 1,
    maxHp: enemy?.maxHp ?? enemy?.hp ?? 1,
    mp: enemy?.mp ?? 0,
    maxMp: enemy?.maxMp ?? enemy?.mp ?? 0,
    damage: enemy?.damage ?? 0,
    defense: enemy?.defense ?? 0,
  })
}

function createMonsterByStage(stage) {
  return {
    id: `monster_${stage}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'monster',
    name: `Quái Phàm Nhân tầng ${stage}`,
    realm: REALM_MORTAL,
    stage,
    hp: stage * 100,
    maxHp: stage * 100,
    damage: stage,
    defense: Math.floor(stage / 2),
    rewardExp: 10,
    rewardSpiritStones: 1,
    damageType: 'physical',
    critChance: 0,
    critDamage: 1.5,
    dodgeChance: 0,
    lifesteal: 0,
    damageReduction: 0,
    shield: 0,
  }
}

function createRandomFloor1Monster() {
  const stage = Math.floor(Math.random() * 10) + 1
  return createMonsterByStage(stage)
}

function createBoss(floor = 1) {
  if (floor === 2) {
    return {
      id: `boss_floor_2_${Date.now()}`,
      type: 'boss',
      name: 'Boss Bí Cảnh Tầng 2',
      realm: REALM_MORTAL,
      stage: 10,
      hp: 3000,
      maxHp: 3000,
      damage: 30,
      defense: 8,
      rewardExp: 50,
      damageType: 'physical',
      critChance: 0.08,
      critDamage: 1.7,
      dodgeChance: 0.03,
      lifesteal: 0,
      damageReduction: 0.05,
      shield: 20,
    }
  }

  return {
    id: `boss_floor_1_${Date.now()}`,
    type: 'boss',
    name: 'Boss Bí Cảnh',
    realm: REALM_MORTAL,
    stage: 10,
    hp: 3000,
    maxHp: 3000,
    damage: 30,
    defense: 5,
    rewardExp: 50,
    damageType: 'physical',
    critChance: 0.05,
    critDamage: 1.5,
    dodgeChance: 0.02,
    lifesteal: 0,
    damageReduction: 0.03,
    shield: 10,
  }
}

function getBossDrop(floor = 1) {
  const roll = Math.random()

  if (floor === 1) {
    if (roll < 0.2) {
      return {
        herbs: 1,
        spiritStones: 0,
        message: 'Boss rơi 1 dược thảo.',
      }
    }

    return {
      herbs: 0,
      spiritStones: 10,
      message: 'Boss rơi 10 linh thạch.',
    }
  }

  if (roll < 0.5) {
    return {
      herbs: 1,
      spiritStones: 0,
      message: 'Boss tầng 2 rơi 1 dược thảo.',
    }
  }

  return {
    herbs: 0,
    spiritStones: 10,
    message: 'Boss tầng 2 rơi 10 linh thạch.',
  }
}

function spawnFloor1Enemy(nextKillCount) {
  if (nextKillCount > 0 && nextKillCount % 10 === 0) {
    return createBoss(1)
  }

  return createRandomFloor1Monster()
}

function normalizeSaveData(rawSaveData) {
  const saveData =
    rawSaveData && typeof rawSaveData === 'object' ? rawSaveData : {}

  return {
    ...saveData,
    player: saveData.player
      ? normalizePlayerSkills({
          ...saveData.player,
          realm: normalizeRealm(saveData.player.realm),
        })
      : createDefaultPlayer(),
    herbGarden: saveData.herbGarden || createDefaultHerbGarden(),
    crafting: saveData.crafting ?? null,
    message: saveData.message || 'Bắt đầu con đường tu luyện.',
    logs:
      Array.isArray(saveData.logs) && saveData.logs.length > 0
        ? saveData.logs
        : ['Bắt đầu con đường tu luyện.'],
    currentDungeonFloor: saveData.currentDungeonFloor ?? null,
    currentEnemy:
      saveData.currentEnemy && typeof saveData.currentEnemy === 'object'
        ? saveData.currentEnemy
        : null,
    killCount: Number(saveData.killCount) || 0,
    dungeonCooldownUntil: saveData.dungeonCooldownUntil ?? null,
    combatLogs: sanitizeCombatLogs(saveData.combatLogs),
  }
}

async function runPlayerAction(uid, resolver) {
  const ref = db.collection('users').doc(uid)
  const publicRef = db.collection('publicPlayers').doc(uid)

  const result = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref)
    const data = snap.exists ? snap.data() : {}
    const normalizedSave = normalizeSaveData(data?.saveData)
    const resolved = await Promise.resolve(
      resolver(normalizedSave, {
        transaction,
        userRef: ref,
        publicRef,
      })
    )

    const safeMessage =
      typeof resolved?.message === 'string' && resolved.message.trim()
        ? resolved.message
        : 'Không có thay đổi.'
    const safeLogs = sanitizeLogs(normalizedSave.logs, safeMessage)
    const saveDataPatch =
      resolved?.saveDataPatch && typeof resolved.saveDataPatch === 'object'
        ? resolved.saveDataPatch
        : {}
    const profile =
      resolved?.profilePatch && typeof resolved.profilePatch === 'object'
        ? {
            ...(data?.profile || { displayName: '' }),
            ...resolved.profilePatch,
          }
        : data?.profile || { displayName: '' }

    const payload = {
      ...normalizedSave,
      ...saveDataPatch,
      player: resolved?.player || normalizedSave.player,
      herbGarden: resolved?.herbGarden || normalizedSave.herbGarden,
      crafting:
        resolved && Object.prototype.hasOwnProperty.call(resolved, 'crafting')
          ? resolved.crafting
          : normalizedSave.crafting,
      message: safeMessage,
      logs: safeLogs,
      combatLogs: sanitizeCombatLogs(
        saveDataPatch.combatLogs ?? normalizedSave.combatLogs
      ),
    }

    transaction.set(
      ref,
        {
          email: data?.email || '',
          role: data?.role || 'player',
          profile,
          saveData: payload,
          updatedAt: FieldValue.serverTimestamp(),
          lastActionAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

    transaction.set(
      publicRef,
      buildPublicPlayerPayload(uid, payload.player, profile),
      { merge: true }
    )

    const finalName = normalizePlayerName(payload.player?.name)
    const finalNameKey = normalizePlayerNameKey(finalName)

    if (finalName && finalNameKey) {
      const nameRef = db.collection('characterNames').doc(finalNameKey)
      const nameSnap = await transaction.get(nameRef)
      const reservedUid = String(nameSnap.data()?.uid || '')

      if (!nameSnap.exists || reservedUid === uid) {
        transaction.set(
          nameRef,
          {
            uid,
            name: finalName,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
      }
    }

    return {
      ok: Boolean(resolved?.ok),
      message: safeMessage,
      player: payload.player,
      herbGarden: payload.herbGarden,
      crafting: payload.crafting,
      logs: safeLogs,
      currentDungeonFloor: payload.currentDungeonFloor,
      currentEnemy: payload.currentEnemy,
      killCount: payload.killCount,
      dungeonCooldownUntil: payload.dungeonCooldownUntil,
      combatLogs: payload.combatLogs,
    }
  })

  return result
}

export const cultivateAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Bạn chưa đăng nhập.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => ({
        ok: true,
        player: {
          ...saveData.player,
          realm: normalizeRealm(saveData.player?.realm),
          exp: (Number(saveData.player?.exp) || 0) + 1,
        },
        herbGarden: saveData.herbGarden,
        crafting: saveData.crafting,
        message: 'Bạn tu luyện và nhận 1 EXP.',
      }))
    } catch (error) {
      console.error('cultivateAction error:', error)
      throw new HttpsError('internal', error?.message || 'Lỗi server khi tu luyện.')
    }
  }
)

export const breakthroughAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Bạn chưa đăng nhập.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        const result = breakthrough(saveData.player)

        return {
          ok: Boolean(result?.ok),
          player: result?.player || saveData.player,
          herbGarden: saveData.herbGarden,
          crafting: saveData.crafting,
          message: result?.message || 'Đột phá thất bại.',
        }
      })
    } catch (error) {
      console.error('breakthroughAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Lỗi server khi đột phá.'
      )
    }
  }
)

export const setInitialNameAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const newName = String(request.data?.name || '')

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      return await runPlayerAction(uid, async (saveData, context) => {
        const result = setInitialPlayerName(saveData.player, newName)

        if (!result?.ok) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: result?.message || 'Khong the dat dao hieu.',
          }
        }

        const normalizedName = normalizePlayerName(result.player?.name)
        const nameKey = normalizePlayerNameKey(normalizedName)

        if (!nameKey) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Ten nhan vat khong hop le.',
          }
        }

        const nameRef = db.collection('characterNames').doc(nameKey)
        const nameSnap = await context.transaction.get(nameRef)
        const reservedUid = String(nameSnap.data()?.uid || '')

        if (nameSnap.exists && reservedUid && reservedUid !== uid) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Ten nhan vat nay da co nguoi su dung.',
          }
        }

        return {
          ok: true,
          player: result.player,
          herbGarden: saveData.herbGarden,
          crafting: saveData.crafting,
          profilePatch: { displayName: result.player?.name || '' },
          message: result.message || 'Khong the dat dao hieu.',
        }
      })
    } catch (error) {
      console.error('setInitialNameAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi dat dao hieu.'
      )
    }
  }
)

export const syncPublicPlayerAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      const ref = db.collection('users').doc(uid)
      const publicRef = db.collection('publicPlayers').doc(uid)

      await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref)
        const data = snap.exists ? snap.data() : {}
        const normalizedSave = normalizeSaveData(data?.saveData)
        const profile = data?.profile || { displayName: '' }

        transaction.set(
          publicRef,
          buildPublicPlayerPayload(uid, normalizedSave.player, profile),
          { merge: true }
        )
      })

      return { ok: true }
    } catch (error) {
      console.error('syncPublicPlayerAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi dong bo ho so cong khai.'
      )
    }
  }
)

export const useItemAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const itemId = String(request.data?.itemId || '')

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        const result = useConsumable(saveData.player, itemId)

        return {
          ok: Boolean(result?.ok),
          player: result?.player || saveData.player,
          herbGarden: saveData.herbGarden,
          crafting: saveData.crafting,
          message: result?.message || 'Khong the su dung vat pham.',
        }
      })
    } catch (error) {
      console.error('useItemAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi su dung vat pham.'
      )
    }
  }
)

export const equipItemAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const instanceId = String(request.data?.instanceId || '')

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        const result = equipItem(saveData.player, instanceId)

        return {
          ok: Boolean(result?.ok),
          player: result?.player || saveData.player,
          herbGarden: saveData.herbGarden,
          crafting: saveData.crafting,
          message: result?.message || 'Khong the trang bi vat pham.',
        }
      })
    } catch (error) {
      console.error('equipItemAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi trang bi vat pham.'
      )
    }
  }
)

export const unequipItemAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const slot = String(request.data?.slot || '')

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        const result = unequipItem(saveData.player, slot)

        return {
          ok: Boolean(result?.ok),
          player: result?.player || saveData.player,
          herbGarden: saveData.herbGarden,
          crafting: saveData.crafting,
          message: result?.message || 'Khong the thao trang bi.',
        }
      })
    } catch (error) {
      console.error('unequipItemAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi thao trang bi.'
      )
    }
  }
)

export const equipCombatSkillAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const skillId = String(request.data?.skillId || '')
    const slotIndex = Number(request.data?.slotIndex)

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        const result = equipCombatSkill(saveData.player, skillId, slotIndex)

        return {
          ok: Boolean(result?.ok),
          player: result?.player || saveData.player,
          herbGarden: saveData.herbGarden,
          crafting: saveData.crafting,
          message: result?.message || 'Khong the trang bi ky nang.',
        }
      })
    } catch (error) {
      console.error('equipCombatSkillAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi trang bi ky nang.'
      )
    }
  }
)

export const unequipCombatSkillAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const slotIndex = Number(request.data?.slotIndex)

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        const result = unequipCombatSkill(saveData.player, slotIndex)

        return {
          ok: Boolean(result?.ok),
          player: result?.player || saveData.player,
          herbGarden: saveData.herbGarden,
          crafting: saveData.crafting,
          message: result?.message || 'Khong the thao ky nang.',
        }
      })
    } catch (error) {
      console.error('unequipCombatSkillAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi thao ky nang.'
      )
    }
  }
)

export const purchaseShopItemAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const sectionId = String(request.data?.sectionId || '').trim()
    const itemId = String(request.data?.itemId || '').trim()

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        const result = purchaseShopItem(saveData.player, sectionId, itemId)

        return {
          ok: Boolean(result?.ok),
          player: result?.player || saveData.player,
          herbGarden: saveData.herbGarden,
          crafting: saveData.crafting,
          message: result?.message || 'Khong the mua vat pham.',
        }
      })
    } catch (error) {
      console.error('purchaseShopItemAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi mua vat pham.'
      )
    }
  }
)

export const redeemRewardCodeAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const code = normalizeGiftCode(request.data?.code)

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    if (!code) {
      throw new HttpsError('invalid-argument', 'Code khong hop le.')
    }

    try {
      return await runPlayerAction(uid, async (saveData, context) => {
        const codeRef = db.collection('giftCodes').doc(code)
        const claimRef = codeRef.collection('claims').doc(uid)
        const codeSnap = await context.transaction.get(codeRef)

        if (!codeSnap.exists) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Code khong ton tai hoac da het han.',
          }
        }

        const codeData = codeSnap.data() || {}

        if (codeData.active === false) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Code nay da bi khoa.',
          }
        }

        if (Number(codeData.expiresAt) > 0 && Date.now() > Number(codeData.expiresAt)) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Code nay da het han.',
          }
        }

        if (
          Number(codeData.maxUses) > 0 &&
          Number(codeData.useCount) >= Number(codeData.maxUses)
        ) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Code nay da het luot su dung.',
          }
        }

        const claimSnap = await context.transaction.get(claimRef)
        if (claimSnap.exists) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Tai khoan nay da nhap code nay roi.',
          }
        }

        const reward = normalizeRewardPayload(codeData.reward)
        const applied = applyRewardPayload(saveData.player, reward)

        if (!applied.ok) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: applied.message || 'Khong the nhan thuong tu code.',
          }
        }

        context.transaction.set(
          codeRef,
          {
            useCount: FieldValue.increment(1),
            lastRedeemedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
        context.transaction.set(claimRef, {
          uid,
          claimedAt: FieldValue.serverTimestamp(),
        })

        return {
          ok: true,
          player: applied.player,
          herbGarden: saveData.herbGarden,
          crafting: saveData.crafting,
          message: `Da nhan code ${code} thanh cong.`,
        }
      })
    } catch (error) {
      console.error('redeemRewardCodeAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi doi code.'
      )
    }
  }
)

export const createRewardCodeAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    await assertAdmin(uid)

    const reward = normalizeRewardPayload(request.data?.reward)
    const requestedCode = normalizeGiftCode(request.data?.code)
    const note = String(request.data?.note || '').trim().slice(0, 200)
    const maxUses = Math.max(1, Number(request.data?.maxUses) || 1)

    if (!hasRewardPayloadContent(reward)) {
      throw new HttpsError('invalid-argument', 'Phan thuong code khong hop le.')
    }

    let finalCode = ''

    try {
      await db.runTransaction(async (transaction) => {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const candidate = requestedCode || createRandomGiftCode()
          const codeRef = db.collection('giftCodes').doc(candidate)
          const codeSnap = await transaction.get(codeRef)

          if (codeSnap.exists) {
            if (requestedCode) {
              throw new HttpsError('already-exists', 'Code nay da ton tai.')
            }
            continue
          }

          finalCode = candidate
          transaction.set(codeRef, {
            code: candidate,
            reward,
            maxUses,
            useCount: 0,
            note,
            active: true,
            createdBy: uid,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          })
          break
        }
      })

      if (!finalCode) {
        throw new HttpsError('already-exists', 'Khong the tao code moi, vui long thu lai.')
      }

      return {
        ok: true,
        code: finalCode,
        message: `Da tao code ${finalCode}.`,
      }
    } catch (error) {
      console.error('createRewardCodeAction error:', error)
      throw new HttpsError(
        error?.code || 'internal',
        error?.message || 'Loi server khi tao code.'
      )
    }
  }
)

export const deleteRewardCodeAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const code = normalizeGiftCode(request.data?.code)

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    if (!code) {
      throw new HttpsError('invalid-argument', 'Code khong hop le.')
    }

    await assertAdmin(uid)

    try {
      const codeRef = db.collection('giftCodes').doc(code)
      const snap = await codeRef.get()

      if (!snap.exists) {
        return {
          ok: false,
          message: 'Khong tim thay code nay.',
        }
      }

      await codeRef.set(
        {
          active: false,
          deletedAt: FieldValue.serverTimestamp(),
          deletedBy: uid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      return {
        ok: true,
        message: `Da khoa code ${code}.`,
      }
    } catch (error) {
      console.error('deleteRewardCodeAction error:', error)
      throw new HttpsError(
        error?.code || 'internal',
        error?.message || 'Loi server khi xoa code.'
      )
    }
  }
)

export const upgradeHerbGardenAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        const result = unlockHerbGardenSlot(saveData.player, saveData.herbGarden)

        return {
          ok: Boolean(result?.ok),
          player: result?.player || saveData.player,
          herbGarden: result?.herbGarden || saveData.herbGarden,
          crafting: saveData.crafting,
          message: result?.message || 'Khong the mo them o linh dien.',
        }
      })
    } catch (error) {
      console.error('upgradeHerbGardenAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi mo them o linh dien.'
      )
    }
  }
)

export const plantHerbSeedAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const slotIndex = Number(request.data?.slotIndex)

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        const result = plantHerbSeed(saveData.herbGarden, slotIndex, Date.now())

        return {
          ok: Boolean(result?.ok),
          player: saveData.player,
          herbGarden: result?.herbGarden || saveData.herbGarden,
          crafting: saveData.crafting,
          message: result?.message || 'Khong the gieo hat giong.',
        }
      })
    } catch (error) {
      console.error('plantHerbSeedAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi gieo hat giong.'
      )
    }
  }
)

export const harvestHerbSlotAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const slotIndex = Number(request.data?.slotIndex)

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        const result = harvestHerbSlot(
          saveData.player,
          saveData.herbGarden,
          slotIndex,
          Date.now()
        )

        return {
          ok: Boolean(result?.ok),
          player: result?.player || saveData.player,
          herbGarden: result?.herbGarden || saveData.herbGarden,
          crafting: saveData.crafting,
          message: result?.message || 'Khong the thu hoach o nay.',
        }
      })
    } catch (error) {
      console.error('harvestHerbSlotAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi thu hoach duoc thao.'
      )
    }
  }
)

export const harvestAllHerbsAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        const result = harvestAllReadyHerbs(
          saveData.player,
          saveData.herbGarden,
          Date.now()
        )

        return {
          ok: Boolean(result?.ok),
          player: result?.player || saveData.player,
          herbGarden: result?.herbGarden || saveData.herbGarden,
          crafting: saveData.crafting,
          message: result?.message || 'Khong co o nao san sang thu hoach.',
        }
      })
    } catch (error) {
      console.error('harvestAllHerbsAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi thu hoach toan bo.'
      )
    }
  }
)

export const startAlchemyCraftAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const recipeId = String(request.data?.recipeId || '').trim()

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        if (saveData.crafting) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Lo dan dang ban.',
          }
        }

        const result = startAlchemyCraft(saveData.player, recipeId, Date.now())

        return {
          ok: Boolean(result?.ok),
          player: result?.player || saveData.player,
          herbGarden: saveData.herbGarden,
          crafting: result?.crafting ?? saveData.crafting,
          message: result?.message || 'Khong the bat dau luyen dan.',
        }
      })
    } catch (error) {
      console.error('startAlchemyCraftAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi bat dau luyen dan.'
      )
    }
  }
)

export const claimAlchemyCraftAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Ban chua dang nhap.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        if (!saveData.crafting) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: null,
            message: 'Khong co dan duoc nao de nhan.',
          }
        }

        if (!isAlchemyCraftComplete(saveData.crafting, Date.now())) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Dan duoc van dang luyen.',
          }
        }

        const result = finishAlchemyCraft(saveData.player, saveData.crafting)

        return {
          ok: Boolean(result?.ok),
          player: result?.player || saveData.player,
          herbGarden: saveData.herbGarden,
          crafting: result?.ok ? null : saveData.crafting,
          message: result?.message || 'Khong the nhan dan duoc.',
        }
      })
    } catch (error) {
      console.error('claimAlchemyCraftAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Loi server khi nhan dan duoc.'
      )
    }
  }
)

export const enterDungeonAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const floor = Number(request.data?.floor)

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Bạn chưa đăng nhập.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        if (floor !== 1 && floor !== 2) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Tầng bí cảnh không hợp lệ.',
            saveDataPatch: {
              combatLogs: saveData.combatLogs,
            },
          }
        }

        if (saveData.currentDungeonFloor) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Bạn đang ở trong bí cảnh.',
            saveDataPatch: {
              combatLogs: saveData.combatLogs,
            },
          }
        }

        const enemy = floor === 1 ? createRandomFloor1Monster() : createBoss(2)
        const combatLogs = sanitizeCombatLogs([
          `⚔️ Bạn tiến vào Bí Cảnh tầng ${floor}.`,
          `👹 Gặp ${enemy.name}.`,
        ])

        return {
          ok: true,
          player: saveData.player,
          herbGarden: saveData.herbGarden,
          crafting: saveData.crafting,
          message: `Bạn tiến vào Bí Cảnh tầng ${floor}.`,
          saveDataPatch: {
            currentDungeonFloor: floor,
            currentEnemy: enemy,
            killCount: 0,
            dungeonCooldownUntil: null,
            combatLogs,
          },
        }
      })
    } catch (error) {
      console.error('enterDungeonAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Lỗi server khi vào bí cảnh.'
      )
    }
  }
)

export const leaveDungeonAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Bạn chưa đăng nhập.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        const combatLogs = sanitizeCombatLogs([
          ...saveData.combatLogs,
          '🚪 Bạn rời khỏi bí cảnh.',
        ])

        return {
          ok: true,
          player: saveData.player,
          herbGarden: saveData.herbGarden,
          crafting: saveData.crafting,
          message: 'Bạn rời khỏi bí cảnh.',
          saveDataPatch: {
            currentDungeonFloor: null,
            currentEnemy: null,
            killCount: 0,
            dungeonCooldownUntil: null,
            combatLogs,
          },
        }
      })
    } catch (error) {
      console.error('leaveDungeonAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Lỗi server khi rời bí cảnh.'
      )
    }
  }
)

export const attackDungeonEnemyAction = onCall(
  { region: 'asia-southeast1' },
  async (request) => {
    const uid = request.auth?.uid
    const skillId = String(request.data?.skillId || '').trim() || null

    if (!uid) {
      throw new HttpsError('unauthenticated', 'Bạn chưa đăng nhập.')
    }

    try {
      return await runPlayerAction(uid, (saveData) => {
        if (!saveData.currentEnemy || !saveData.currentDungeonFloor) {
          return {
            ok: false,
            player: saveData.player,
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Hiện không có mục tiêu trong bí cảnh.',
            saveDataPatch: {
              combatLogs: sanitizeCombatLogs([
                ...saveData.combatLogs,
                'Không có mục tiêu để tấn công.',
              ]),
            },
          }
        }

        if ((saveData.player?.hp ?? 0) <= 0) {
          return {
            ok: false,
            player: {
              ...saveData.player,
              hp: 0,
            },
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Bạn đã trọng thương, bị đẩy ra khỏi bí cảnh.',
            saveDataPatch: {
              currentDungeonFloor: null,
              currentEnemy: null,
              killCount: 0,
              dungeonCooldownUntil: null,
              combatLogs: sanitizeCombatLogs([
                ...saveData.combatLogs,
                '💀 Bạn đã trọng thương và bị đẩy ra khỏi bí cảnh.',
              ]),
            },
          }
        }

        const basePlayer = advanceSkillCooldowns(saveData.player)
        const finalStats = getFinalStats(basePlayer)
        const playerEntity = buildCombatEntityFromPlayer(basePlayer, finalStats)
        const enemyEntity = buildCombatEntityFromEnemy(saveData.currentEnemy)
        let result
        let turnPlayer = basePlayer

        if (skillId) {
          const skillUse = consumeCombatSkill(basePlayer, skillId)

          if (!skillUse.ok) {
            return {
              ok: false,
              player: saveData.player,
              herbGarden: saveData.herbGarden,
              crafting: saveData.crafting,
              message: skillUse.message,
              saveDataPatch: {
                combatLogs: sanitizeCombatLogs([
                  ...saveData.combatLogs,
                  skillUse.message,
                ]),
              },
            }
          }

          turnPlayer = skillUse.player
          const boostedPlayerEntity = buildCombatEntityFromPlayer(
            turnPlayer,
            getFinalStats(turnPlayer)
          )
          const playerAttack = resolveSkillAttack(
            boostedPlayerEntity,
            enemyEntity,
            skillUse.def.damageMultiplier
          )
          const skillLogs = [
            `${turnPlayer.name || 'Ban'} thi trien ${skillUse.def.name}, tieu hao ${skillUse.def.manaCost} Ki, con lai ${turnPlayer.mp} Ki va cuong hoa 220% sat thuong.`,
            playerAttack.log,
          ]

          if (playerAttack.isDefenderDead) {
            result = {
              playerAttack,
              enemyAttack: null,
              nextPlayer: {
                ...turnPlayer,
                hp: playerAttack.attackerNext.hp,
                mp: turnPlayer.mp,
              },
              nextEnemy: {
                ...saveData.currentEnemy,
                hp: playerAttack.defenderNext.hp,
                maxHp: playerAttack.defenderNext.maxHp ?? saveData.currentEnemy.maxHp,
              },
              isPlayerDead: false,
              isEnemyDead: true,
              logs: skillLogs,
            }
          } else {
            const enemyAttack = resolveAttack(playerAttack.defenderNext, {
              ...boostedPlayerEntity,
              hp: turnPlayer.hp,
              mp: turnPlayer.mp,
            })

            result = {
              playerAttack,
              enemyAttack,
              nextPlayer: {
                ...turnPlayer,
                hp: enemyAttack.defenderNext.hp,
                mp: turnPlayer.mp,
              },
              nextEnemy: {
                ...saveData.currentEnemy,
                hp: enemyAttack.attackerNext.hp,
                maxHp: enemyAttack.attackerNext.maxHp ?? saveData.currentEnemy.maxHp,
              },
              isPlayerDead: enemyAttack.defenderNext.hp <= 0,
              isEnemyDead: false,
              logs: [...skillLogs, enemyAttack.log],
            }
          }
        } else {
          result = resolveCombatRound(playerEntity, enemyEntity)
        }
        const combatLogs = [
          ...saveData.combatLogs,
          ...result.logs.map((text, index) =>
            index === 0 ? `🗡️ ${text}` : `👹 ${text}`
          ),
        ]

        if (result.isEnemyDead) {
          if (saveData.currentEnemy.type === 'monster') {
            const nextKillCount = (Number(saveData.killCount) || 0) + 1
            const nextEnemy =
              saveData.currentDungeonFloor === 1
                ? spawnFloor1Enemy(nextKillCount)
                : createBoss(2)

            return {
              ok: true,
              player: {
                ...turnPlayer,
                hp: result.nextPlayer.hp,
                exp: (Number(turnPlayer?.exp) || 0) + 10,
                spiritStones: (Number(turnPlayer?.spiritStones) || 0) + 1,
              },
              herbGarden: saveData.herbGarden,
              crafting: saveData.crafting,
              message: `Bạn đánh bại ${saveData.currentEnemy.name}, nhận 10 EXP và 1 linh thạch.`,
              saveDataPatch: {
                currentEnemy: nextEnemy,
                killCount: nextKillCount,
                combatLogs: sanitizeCombatLogs([
                  ...combatLogs,
                  `🔥 Bạn đánh bại ${saveData.currentEnemy.name}.`,
                  '🎁 Nhận 10 EXP và 1 linh thạch.',
                  `👹 Kẻ địch tiếp theo xuất hiện: ${nextEnemy.name}.`,
                ]),
              },
            }
          }

          const drop = getBossDrop(saveData.currentDungeonFloor)
          const nextEnemy =
            saveData.currentDungeonFloor === 1
              ? createRandomFloor1Monster()
              : createBoss(2)

          return {
            ok: true,
            player: {
              ...turnPlayer,
              hp: result.nextPlayer.hp,
              exp:
                (Number(turnPlayer?.exp) || 0) +
                (Number(saveData.currentEnemy?.rewardExp) || 0),
              spiritStones:
                (Number(turnPlayer?.spiritStones) || 0) +
                (Number(drop.spiritStones) || 0),
              herbs:
                (Number(turnPlayer?.herbs) || 0) + (Number(drop.herbs) || 0),
            },
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: `Bạn đánh bại ${saveData.currentEnemy.name}, nhận ${
              saveData.currentEnemy?.rewardExp ?? 0
            } EXP. ${drop.message}`,
            saveDataPatch: {
              currentEnemy: nextEnemy,
              combatLogs: sanitizeCombatLogs([
                ...combatLogs,
                `🔥 Bạn đánh bại ${saveData.currentEnemy.name}.`,
                `🎁 Nhận ${saveData.currentEnemy?.rewardExp ?? 0} EXP, +${
                  drop.spiritStones ?? 0
                } linh thạch, +${drop.herbs ?? 0} dược thảo.`,
                `👹 Kẻ địch tiếp theo xuất hiện: ${nextEnemy.name}.`,
              ]),
            },
          }
        }

        if (result.isPlayerDead) {
          return {
            ok: false,
            player: {
              ...turnPlayer,
              hp: 0,
            },
            herbGarden: saveData.herbGarden,
            crafting: saveData.crafting,
            message: 'Bạn bị đánh bại và bị đẩy ra khỏi bí cảnh.',
            saveDataPatch: {
              currentDungeonFloor: null,
              currentEnemy: null,
              killCount: 0,
              dungeonCooldownUntil: null,
              combatLogs: sanitizeCombatLogs([
                ...combatLogs,
                '💀 Bạn đã bị đánh bại và bị đẩy ra khỏi bí cảnh.',
              ]),
            },
          }
        }

        return {
          ok: true,
          player: {
            ...turnPlayer,
            hp: result.nextPlayer.hp,
          },
          herbGarden: saveData.herbGarden,
          crafting: saveData.crafting,
          message: 'Chiến đấu tiếp diễn.',
          saveDataPatch: {
            currentEnemy: {
              ...saveData.currentEnemy,
              hp: result.nextEnemy.hp,
              maxHp: result.nextEnemy.maxHp ?? saveData.currentEnemy.maxHp,
              shield: result.nextEnemy.shield ?? 0,
            },
            combatLogs: sanitizeCombatLogs(combatLogs),
          },
        }
      })
    } catch (error) {
      console.error('attackDungeonEnemyAction error:', error)
      throw new HttpsError(
        'internal',
        error?.message || 'Lỗi server khi chiến đấu trong bí cảnh.'
      )
    }
  }
)

export const EQUIPMENT_SLOTS = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  RING: 'ring',
  BOOTS: 'boots',
}

export const EQUIPMENT_RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
}

export const equipmentDefs = {
  beginner_sword: {
    id: 'beginner_sword',
    name: 'Tân Thủ Kiếm',
    slot: EQUIPMENT_SLOTS.WEAPON,
    rarity: EQUIPMENT_RARITY.COMMON,
    levelRequired: 1,
    stats: {
      damage: 2,
    },
    price: 20,
    effects: [],
  },

  cloth_armor: {
    id: 'cloth_armor',
    name: 'Vải Giáp',
    slot: EQUIPMENT_SLOTS.ARMOR,
    rarity: EQUIPMENT_RARITY.COMMON,
    levelRequired: 1,
    stats: {
      maxHp: 10,
      defense: 1,
    },
    price: 20,
    effects: [],
  },

  wind_boots: {
    id: 'wind_boots',
    name: 'Phong Hành Ngoa',
    slot: EQUIPMENT_SLOTS.BOOTS,
    rarity: EQUIPMENT_RARITY.RARE,
    levelRequired: 2,
    stats: {
      dodgeChance: 0.03,
    },
    price: 50,
    effects: [],
  },

  spirit_ring: {
    id: 'spirit_ring',
    name: 'Tụ Linh Giới',
    slot: EQUIPMENT_SLOTS.RING,
    rarity: EQUIPMENT_RARITY.RARE,
    levelRequired: 2,
    stats: {
      damage: 1,
      maxHp: 5,
    },
    price: 60,
    effects: [],
  },

  lang_bong: {
    id: 'lang_bong',
    name: 'Lang Bổng',
    slot: EQUIPMENT_SLOTS.WEAPON,
    rarity: EQUIPMENT_RARITY.EPIC,
    levelRequired: 1,
    stats: {},
    price: 0,
    effects: [],
    description: 'Vũ khí của Lang Vương, mang theo sát khí cuồng bạo.',
  },
}

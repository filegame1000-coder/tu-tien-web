export const alchemyRecipeDefs = {
  thoi_the_dan: {
    id: 'thoi_the_dan',
    itemId: 'thoi_the_dan',
    name: 'Thối Thể Đan',
    category: 'body',
    craftTimeMs: 10_000,
    cost: {
      herbs: 10,
      spiritStones: 50,
    },
  },

  thoi_than_dan: {
    id: 'thoi_than_dan',
    itemId: 'thoi_than_dan',
    name: 'Thối Thần Đan',
    category: 'spirit',
    craftTimeMs: 10_000,
    cost: {
      herbs: 10,
      spiritStones: 50,
    },
  },

  thoi_thanh_dan: {
    id: 'thoi_thanh_dan',
    itemId: 'thoi_thanh_dan',
    name: 'Thối Thanh Đan',
    category: 'combat',
    craftTimeMs: 10_000,
    cost: {
      herbs: 20,
      spiritStones: 50,
    },
  },
}

export function getAlchemyRecipeList() {
  return Object.values(alchemyRecipeDefs)
}

export function getAlchemyRecipe(recipeId) {
  return alchemyRecipeDefs[recipeId] || null
}
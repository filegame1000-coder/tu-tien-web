export const consumableDefs = {
  hp_potion_small: {
    id: 'hp_potion_small',
    name: 'Bình Sinh Lực',
    type: 'consumable',
    stackable: true,
    description: 'Hồi ngay 100 Sinh lực.',
    effect: {
      hp: 100,
    },
  },

  mp_potion_small: {
    id: 'mp_potion_small',
    name: 'Bình Pháp Lực',
    type: 'consumable',
    stackable: true,
    description: 'Hồi ngay 100 Pháp lực.',
    effect: {
      mp: 100,
    },
  },

  thoi_the_dan: {
    id: 'thoi_the_dan',
    name: 'Thối Thể Đan',
    type: 'consumable',
    stackable: true,
    description:
      'Dùng để rèn luyện thể phách, tăng vĩnh viễn 10 chỉ số Sinh lực gốc cho nhân vật.',
    effect: {
      baseHp: 10,
    },
  },

  thoi_than_dan: {
    id: 'thoi_than_dan',
    name: 'Thối Thần Đan',
    type: 'consumable',
    stackable: true,
    description:
      'Dùng để bồi dưỡng thần thức, tăng vĩnh viễn 10 chỉ số Pháp lực gốc cho nhân vật.',
    effect: {
      baseMp: 10,
    },
  },

  thoi_thanh_dan: {
    id: 'thoi_thanh_dan',
    name: 'Thối Thanh Đan',
    type: 'consumable',
    stackable: true,
    description:
      'Dùng để tinh luyện sát phạt chi khí, tăng vĩnh viễn 1 chỉ số công gốc cho nhân vật.',
    effect: {
      baseDamage: 1,
    },
  },

  yeu_dan: {
    id: 'yeu_dan',
    name: 'Yêu Đan',
    type: 'consumable',
    stackable: true,
    description:
      'Tinh hoa yêu lực của Boss thế giới, dùng để tăng vĩnh viễn 1 chỉ số công gốc.',
    effect: {
      baseDamage: 1,
    },
  },
}

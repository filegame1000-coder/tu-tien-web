const DAY_MS = 24 * 60 * 60 * 1000
const VN_TZ_OFFSET_MS = 7 * 60 * 60 * 1000

export const DAILY_LOGIN_REWARDS = [
  { day: 1, label: 'Ngày 1', reward: { spiritStones: 200 } },
  {
    day: 2,
    label: 'Ngày 2',
    reward: { consumables: [{ itemId: 'hp_potion_small', quantity: 2 }] },
  },
  {
    day: 3,
    label: 'Ngày 3',
    reward: { consumables: [{ itemId: 'mp_potion_small', quantity: 2 }] },
  },
  { day: 4, label: 'Ngày 4', reward: { spiritStones: 300 } },
  {
    day: 5,
    label: 'Ngày 5',
    reward: { consumables: [{ itemId: 'thoi_the_dan', quantity: 1 }] },
  },
  {
    day: 6,
    label: 'Ngày 6',
    reward: { consumables: [{ itemId: 'thoi_than_dan', quantity: 1 }] },
  },
  {
    day: 7,
    label: 'Ngày 7',
    reward: {
      spiritStones: 500,
      consumables: [{ itemId: 'yeu_dan', quantity: 1 }],
    },
  },
]

export const DAILY_MISSIONS = [
  {
    id: 'cultivate_10',
    title: 'Tu luyện 10 lần',
    target: 10,
    activityPoints: 10,
    reward: { spiritStones: 150 },
  },
  {
    id: 'dungeon_attack_10',
    title: 'Đánh bí cảnh 10 lượt',
    target: 10,
    activityPoints: 15,
    reward: { spiritStones: 200 },
  },
  {
    id: 'herb_harvest_3',
    title: 'Thu hoạch linh điền 3 lần',
    target: 3,
    activityPoints: 10,
    reward: { herbs: 10 },
  },
  {
    id: 'alchemy_1',
    title: 'Luyện đan 1 lần',
    target: 1,
    activityPoints: 10,
    reward: { consumables: [{ itemId: 'mp_potion_small', quantity: 1 }] },
  },
  {
    id: 'world_boss_attack_3',
    title: 'Tấn công Boss Thế Giới 3 lần',
    target: 3,
    activityPoints: 20,
    reward: { consumables: [{ itemId: 'yeu_dan', quantity: 1 }] },
  },
]

export const DAILY_ACTIVITY_CHESTS = [
  { threshold: 20, reward: { spiritStones: 100 } },
  {
    threshold: 40,
    reward: { consumables: [{ itemId: 'hp_potion_small', quantity: 2 }] },
  },
  {
    threshold: 60,
    reward: { consumables: [{ itemId: 'thoi_thanh_dan', quantity: 1 }] },
  },
]

const CONSUMABLE_NAMES = {
  hp_potion_small: 'Bình Sinh lực',
  mp_potion_small: 'Bình Pháp lực',
  thoi_the_dan: 'Thối Thể Đan',
  thoi_than_dan: 'Thối Thần Đan',
  thoi_thanh_dan: 'Thối Thanh Đan',
  yeu_dan: 'Yêu Đan',
}

function getVnDaySerial(input = Date.now()) {
  return Math.floor(((Number(input) || 0) + VN_TZ_OFFSET_MS) / DAY_MS)
}

function getVnDayKey(input = Date.now()) {
  const date = new Date((Number(input) || 0) + VN_TZ_OFFSET_MS)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createDefaultWelfareState(now = Date.now()) {
  return {
    loginDayIndex: 0,
    lastLoginClaimDaySerial: 0,
    lastLoginClaimAtMs: 0,
    missionDayKey: getVnDayKey(now),
    missionProgress: Object.fromEntries(DAILY_MISSIONS.map((mission) => [mission.id, 0])),
    missionClaims: {},
    activityClaims: {},
  }
}

export function normalizeWelfareState(raw, now = Date.now()) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const todayKey = getVnDayKey(now)
  const sameDay = String(source.missionDayKey || '') === todayKey

  return {
    loginDayIndex: Math.max(0, Math.min(7, Number(source.loginDayIndex) || 0)),
    lastLoginClaimDaySerial: Math.max(0, Number(source.lastLoginClaimDaySerial) || 0),
    lastLoginClaimAtMs: Math.max(0, Number(source.lastLoginClaimAtMs) || 0),
    missionDayKey: todayKey,
    missionProgress: Object.fromEntries(
      DAILY_MISSIONS.map((mission) => [
        mission.id,
        sameDay
          ? Math.max(
              0,
              Math.min(mission.target, Number(source.missionProgress?.[mission.id]) || 0)
            )
          : 0,
      ])
    ),
    missionClaims: sameDay ? { ...(source.missionClaims || {}) } : {},
    activityClaims: sameDay ? { ...(source.activityClaims || {}) } : {},
  }
}

function getEffectiveLoginDayIndex(welfare, now = Date.now()) {
  const normalized = normalizeWelfareState(welfare, now)
  const lastSerial = Number(normalized.lastLoginClaimDaySerial) || 0

  if (!lastSerial) return normalized.loginDayIndex

  const diff = getVnDaySerial(now) - lastSerial
  if (diff >= 2) return 0

  return normalized.loginDayIndex
}

function getNextLoginRewardDay(welfare, now = Date.now()) {
  const index = getEffectiveLoginDayIndex(welfare, now)
  return (index % DAILY_LOGIN_REWARDS.length) + 1
}

export function getDailyActivityPoints(welfare, now = Date.now()) {
  const normalized = normalizeWelfareState(welfare, now)

  return DAILY_MISSIONS.reduce((sum, mission) => {
    const progress = Number(normalized.missionProgress?.[mission.id]) || 0
    return sum + (progress >= mission.target ? mission.activityPoints : 0)
  }, 0)
}

export function applyWelfareProgressState(rawWelfare, progressPatch, now = Date.now()) {
  const normalized = normalizeWelfareState(rawWelfare, now)
  const safePatch = progressPatch && typeof progressPatch === 'object' ? progressPatch : {}
  const nextProgress = { ...normalized.missionProgress }

  for (const mission of DAILY_MISSIONS) {
    const increment = Math.max(0, Number(safePatch[mission.id]) || 0)
    if (increment <= 0) continue

    nextProgress[mission.id] = Math.min(
      mission.target,
      (Number(nextProgress[mission.id]) || 0) + increment
    )
  }

  return {
    ...normalized,
    missionProgress: nextProgress,
  }
}

export function formatRewardSummary(reward = {}) {
  const parts = []

  if ((Number(reward.spiritStones) || 0) > 0) {
    parts.push(`${reward.spiritStones} linh thạch`)
  }

  if ((Number(reward.herbs) || 0) > 0) {
    parts.push(`${reward.herbs} dược thảo`)
  }

  for (const item of reward.consumables || []) {
    const name = CONSUMABLE_NAMES[item.itemId] || item.itemId
    parts.push(`${item.quantity} ${name}`)
  }

  if ((Number(reward.baseStats?.maxHp) || 0) > 0) {
    parts.push(`+${reward.baseStats.maxHp} Sinh lực gốc`)
  }
  if ((Number(reward.baseStats?.maxMp) || 0) > 0) {
    parts.push(`+${reward.baseStats.maxMp} Pháp lực gốc`)
  }
  if ((Number(reward.baseStats?.damage) || 0) > 0) {
    parts.push(`+${reward.baseStats.damage} Công gốc`)
  }
  if ((Number(reward.baseStats?.defense) || 0) > 0) {
    parts.push(`+${reward.baseStats.defense} Phòng thủ gốc`)
  }

  return parts.join(', ') || 'Quà thưởng'
}

export function buildWelfareView(rawWelfare, now = Date.now()) {
  const welfare = normalizeWelfareState(rawWelfare, now)
  const todaySerial = getVnDaySerial(now)
  const claimedToday = (Number(welfare.lastLoginClaimDaySerial) || 0) === todaySerial
  const effectiveIndex = getEffectiveLoginDayIndex(welfare, now)
  const nextLoginDay = getNextLoginRewardDay(welfare, now)
  const activityPoints = getDailyActivityPoints(welfare, now)

  return {
    raw: welfare,
    login: {
      claimedToday,
      canClaimToday: !claimedToday,
      nextLoginDay,
      rewards: DAILY_LOGIN_REWARDS.map((entry) => {
        let state = 'upcoming'

        if (claimedToday && entry.day <= effectiveIndex) {
          state = 'claimed'
        } else if (!claimedToday && entry.day < nextLoginDay) {
          state = 'claimed'
        } else if (entry.day === nextLoginDay) {
          state = claimedToday ? 'claimed' : 'claimable'
        }

        return {
          ...entry,
          state,
          summary: formatRewardSummary(entry.reward),
        }
      }),
    },
    missions: DAILY_MISSIONS.map((mission) => {
      const progress = Number(welfare.missionProgress?.[mission.id]) || 0
      const completed = progress >= mission.target
      const claimed = welfare.missionClaims?.[mission.id] === true

      return {
        ...mission,
        progress,
        completed,
        claimed,
        canClaim: completed && !claimed,
        summary: formatRewardSummary(mission.reward),
      }
    }),
    activity: {
      points: activityPoints,
      maxPoints: DAILY_ACTIVITY_CHESTS[DAILY_ACTIVITY_CHESTS.length - 1]?.threshold || 60,
      chests: DAILY_ACTIVITY_CHESTS.map((chest) => {
        const claimed = welfare.activityClaims?.[String(chest.threshold)] === true
        return {
          ...chest,
          claimed,
          canClaim: activityPoints >= chest.threshold && !claimed,
          summary: formatRewardSummary(chest.reward),
        }
      }),
    },
  }
}

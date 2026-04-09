export const MAX_EQUIPPED_SKILLS = 4

export const SKILL_DEFS = {
  tram_kiem_quyet: {
    id: 'tram_kiem_quyet',
    name: 'Trảm Kiếm Quyết',
    description: 'Gây 220% sát thương thực tế sau khi đã tính phòng thủ của đối thủ.',
    manaCost: 50,
    cooldownTurns: 1,
    damageMultiplier: 2.2,
  },
}

const DEFAULT_LEARNED_SKILLS = ['tram_kiem_quyet']
const DEFAULT_EQUIPPED_SKILLS = ['tram_kiem_quyet', null, null, null]

function sanitizeSkillId(skillId) {
  const normalized = String(skillId || '').trim()
  return SKILL_DEFS[normalized] ? normalized : null
}

function buildDefaultLearnedSkills() {
  return [...DEFAULT_LEARNED_SKILLS]
}

function buildDefaultEquippedSkills() {
  return [...DEFAULT_EQUIPPED_SKILLS]
}

export function normalizePlayerSkills(player) {
  const rawLearned = Array.isArray(player?.learnedSkills)
    ? player.learnedSkills
    : buildDefaultLearnedSkills()

  const learnedSkills = Array.from(
    new Set(
      rawLearned
        .map(sanitizeSkillId)
        .filter(Boolean)
        .concat(buildDefaultLearnedSkills())
    )
  )

  const rawEquipped = Array.isArray(player?.equippedSkills)
    ? player.equippedSkills
    : buildDefaultEquippedSkills()

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

export function getSkillDef(skillId) {
  return SKILL_DEFS[sanitizeSkillId(skillId)] || null
}

export function getLearnedSkillEntries(player) {
  const normalized = normalizePlayerSkills(player)

  return normalized.learnedSkills.map((skillId) => ({
    skillId,
    def: getSkillDef(skillId),
    cooldown: Math.max(0, Number(normalized.skillCooldowns?.[skillId]) || 0),
    equippedSlots: normalized.equippedSkills
      .map((equippedSkillId, index) => (equippedSkillId === skillId ? index : null))
      .filter((value) => value !== null),
  }))
}

export function getEquippedSkillEntries(player) {
  const normalized = normalizePlayerSkills(player)

  return normalized.equippedSkills.map((skillId, index) => ({
    slotIndex: index,
    skillId,
    def: getSkillDef(skillId),
    cooldown: skillId
      ? Math.max(0, Number(normalized.skillCooldowns?.[skillId]) || 0)
      : 0,
  }))
}

export function equipSkill(player, skillId, slotIndex) {
  const normalized = normalizePlayerSkills(player)
  const safeSkillId = sanitizeSkillId(skillId)
  const safeSlotIndex = Number(slotIndex)

  if (!safeSkillId) {
    return { ok: false, message: 'Kỹ năng không tồn tại.' }
  }

  if (!Number.isInteger(safeSlotIndex) || safeSlotIndex < 0 || safeSlotIndex >= MAX_EQUIPPED_SKILLS) {
    return { ok: false, message: 'Ô trang bị kỹ năng không hợp lệ.' }
  }

  if (!normalized.learnedSkills.includes(safeSkillId)) {
    return { ok: false, message: 'Bạn chưa học kỹ năng này.' }
  }

  const equippedSkills = normalized.equippedSkills.map((equippedSkillId, index) => {
    if (equippedSkillId === safeSkillId) return null
    if (index === safeSlotIndex) return safeSkillId
    return equippedSkillId
  })

  return {
    ok: true,
    player: {
      ...normalized,
      equippedSkills,
    },
    message: `Đã trang bị ${SKILL_DEFS[safeSkillId].name} vào ô ${safeSlotIndex + 1}.`,
  }
}

export function unequipSkill(player, slotIndex) {
  const normalized = normalizePlayerSkills(player)
  const safeSlotIndex = Number(slotIndex)

  if (!Number.isInteger(safeSlotIndex) || safeSlotIndex < 0 || safeSlotIndex >= MAX_EQUIPPED_SKILLS) {
    return { ok: false, message: 'Ô trang bị kỹ năng không hợp lệ.' }
  }

  const currentSkillId = normalized.equippedSkills[safeSlotIndex]
  if (!currentSkillId) {
    return { ok: false, message: 'Ô kỹ năng này đang trống.' }
  }

  return {
    ok: true,
    player: {
      ...normalized,
      equippedSkills: normalized.equippedSkills.map((skillId, index) =>
        index === safeSlotIndex ? null : skillId
      ),
    },
    message: `Đã tháo ${SKILL_DEFS[currentSkillId].name} khỏi ô ${safeSlotIndex + 1}.`,
  }
}

export function advanceSkillCooldowns(player) {
  const normalized = normalizePlayerSkills(player)
  const nextCooldowns = Object.fromEntries(
    Object.entries(normalized.skillCooldowns).map(([skillId, turns]) => [
      skillId,
      Math.max(0, Number(turns) - 1),
    ])
  )

  return {
    ...normalized,
    skillCooldowns: nextCooldowns,
  }
}

export function canUseEquippedSkill(player, skillId) {
  const normalized = normalizePlayerSkills(player)
  const safeSkillId = sanitizeSkillId(skillId)
  const def = getSkillDef(safeSkillId)

  if (!safeSkillId || !def) {
    return { ok: false, message: 'Kỹ năng không tồn tại.' }
  }

  if (!normalized.equippedSkills.includes(safeSkillId)) {
    return { ok: false, message: 'Kỹ năng chưa được trang bị.' }
  }

  const cooldown = Math.max(0, Number(normalized.skillCooldowns?.[safeSkillId]) || 0)
  if (cooldown > 0) {
    return { ok: false, message: `${def.name} còn hồi chiêu ${cooldown} lượt.` }
  }

  if ((Number(normalized.mp) || 0) < def.manaCost) {
    return { ok: false, message: `Không đủ ${def.manaCost} Ki để thi triển ${def.name}.` }
  }

  return { ok: true, def }
}

export function consumeSkillForTurn(player, skillId) {
  const normalized = normalizePlayerSkills(player)
  const check = canUseEquippedSkill(normalized, skillId)
  if (!check.ok) return check

  return {
    ok: true,
    def: check.def,
    player: {
      ...normalized,
      mp: Math.max(0, (Number(normalized.mp) || 0) - check.def.manaCost),
      skillCooldowns: {
        ...normalized.skillCooldowns,
        [check.def.id]: Number(check.def.cooldownTurns) + 1,
      },
    },
  }
}

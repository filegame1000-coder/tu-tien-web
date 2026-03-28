import { equipmentDefs } from '../data/equipments'

const slotLabels = {
  weapon: 'Vũ khí',
  armor: 'Giáp',
  ring: 'Nhẫn',
  boots: 'Giày',
}

function formatStatLabel(key) {
  const labels = {
    maxHp: 'HP',
    maxMp: 'Ki',
    damage: 'Sát thương',
    defense: 'Phòng thủ',
    critChance: 'Bạo kích',
    critDamage: 'ST bạo kích',
    dodgeChance: 'Né tránh',
    lifesteal: 'Hút máu',
    damageReduction: 'Giảm sát thương',
    physicalBonus: 'ST vật lý',
    spiritualBonus: 'ST linh lực',
    trueBonus: 'ST chuẩn',
    physicalResist: 'Kháng vật lý',
    spiritualResist: 'Kháng linh lực',
    trueResist: 'Kháng chuẩn',
    hitChance: 'Chính xác',
    antiCritChance: 'Kháng bạo kích',
  }

  return labels[key] || key
}

function formatStatValue(key, value) {
  const percentStats = new Set([
    'critChance',
    'dodgeChance',
    'lifesteal',
    'damageReduction',
    'physicalBonus',
    'spiritualBonus',
    'trueBonus',
    'physicalResist',
    'spiritualResist',
    'trueResist',
    'hitChance',
    'antiCritChance',
  ])

  if (percentStats.has(key)) {
    return `+${Math.round(value * 100)}%`
  }

  return `+${value}`
}

function formatStats(stats = {}) {
  return Object.entries(stats)
    .map(([key, value]) => `${formatStatLabel(key)} ${formatStatValue(key, value)}`)
    .join(' • ')
}

export default function EquipmentPanel({ player, finalStats, actions }) {
  const inventory = player?.inventory ?? []
  const equipment = player?.equipment ?? {}

  function getEquippedItem(slot) {
    const instanceId = equipment[slot]
    if (!instanceId) return null

    const instance = inventory.find((item) => item.instanceId === instanceId)
    if (!instance) return null

    const def = equipmentDefs[instance.defId]
    if (!def) return null

    return { instance, def }
  }

  const equipableItems = inventory.filter((item) => {
    const def = equipmentDefs[item.defId]
    return !!def && !item.equipped
  })

  return (
    <section className="altar-card equipment-card">
      <div className="altar-header slim">
        <div>
          <div className="section-kicker">Hành trang</div>
          <h2 className="panel-title">Trang bị hộ đạo</h2>
        </div>
      </div>

      <div className="equipment-grid">
        <div className="mini-panel">
          <div className="mini-panel-title">Trang bị đang mặc</div>
          <div className="equipment-slots">
            {Object.keys(slotLabels).map((slot) => {
              const item = getEquippedItem(slot)

              return (
                <div key={slot} className="equipment-slot-card">
                  <div className="slot-label">{slotLabels[slot]}</div>
                  {item ? (
                    <>
                      <strong>{item.def.name}</strong>
                      <span className="muted-text small">
                        {formatStats(item.def.stats || {}) || 'Không có chỉ số'}
                      </span>
                      <button
                        className="dao-btn dao-btn-muted"
                        onClick={() => actions.unequipItem(slot)}
                      >
                        Tháo
                      </button>
                    </>
                  ) : (
                    <span className="muted-text small">Chưa trang bị</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mini-panel">
          <div className="mini-panel-title">Chỉ số cuối cùng</div>
          <div className="requirements-list compact-list">
            <div>
              <span>HP</span>
              <strong>
                {player?.hp ?? 0}/{finalStats?.maxHp ?? 0}
              </strong>
            </div>
            <div>
              <span>Ki</span>
              <strong>
                {player?.mp ?? 0}/{finalStats?.maxMp ?? 0}
              </strong>
            </div>
            <div>
              <span>Sát thương</span>
              <strong>{finalStats?.damage ?? 0}</strong>
            </div>
            <div>
              <span>Phòng thủ</span>
              <strong>{finalStats?.defense ?? 0}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="mini-panel" style={{ marginTop: 18 }}>
        <div className="mini-panel-title">Túi đồ khả dụng</div>

        {equipableItems.length === 0 ? (
          <div className="muted-text">Chưa có trang bị nào trong túi.</div>
        ) : null}

        <div className="inventory-list">
          {equipableItems.map((item) => {
            const def = equipmentDefs[item.defId]

            return (
              <div key={item.instanceId} className="inventory-card">
                <div>
                  <strong>{def.name}</strong>
                  <div className="muted-text small">Ô: {slotLabels[def.slot] || def.slot}</div>
                  <div className="muted-text small">
                    {formatStats(def.stats || {}) || 'Không có chỉ số'}
                  </div>
                </div>
                <button
                  className="dao-btn dao-btn-primary"
                  onClick={() => actions.equipItem(item.instanceId)}
                >
                  Trang bị
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
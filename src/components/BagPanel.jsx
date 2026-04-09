import { getInventoryEntries, countInventoryItems } from '../systems/inventory'

function rarityLabel(rarity) {
  switch (rarity) {
    case 'legendary':
      return 'Truyền thuyết'
    case 'epic':
      return 'Sử thi'
    case 'rare':
      return 'Hiếm'
    default:
      return 'Thường'
  }
}

function renderStats(stats = {}) {
  const entries = Object.entries(stats).filter(([, value]) => value !== 0 && value != null)

  if (entries.length === 0) return null

  const statLabels = {
    maxHp: 'HP',
    maxMp: 'MP',
    damage: 'Công',
    defense: 'Thủ',
    critChance: 'Bạo kích',
    critDamage: 'Sát thương bạo kích',
    dodgeChance: 'Né tránh',
    lifesteal: 'Hút máu',
    damageReduction: 'Giảm sát thương',
    shield: 'Lá chắn',
    physicalBonus: 'ST vật lý',
    spiritualBonus: 'ST linh lực',
    trueBonus: 'ST chuẩn',
    physicalResist: 'Kháng vật lý',
    spiritualResist: 'Kháng linh lực',
    trueResist: 'Kháng sát thương chuẩn',
    hitChance: 'Chính xác',
    antiCritChance: 'Kháng bạo kích',
    realmMultiplier: 'Cộng hưởng cảnh giới',
  }

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

  return (
    <div className="inventory-stat-list">
      {entries.map(([key, value]) => {
        const label = statLabels[key] || key
        const formattedValue = percentStats.has(key)
          ? `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`
          : `${value > 0 ? '+' : ''}${value}`

        return (
          <span key={key} className="inventory-stat-chip">
            {label}: {formattedValue}
          </span>
        )
      })}
    </div>
  )
}

function renderConsumableEffect(effect = {}) {
  const lines = []

  if (effect.hp) lines.push(`Hồi ngay +${effect.hp} HP`)
  if (effect.mp) lines.push(`Hồi ngay +${effect.mp} MP`)
  if (effect.baseHp) lines.push(`Tăng vĩnh viễn +${effect.baseHp} HP gốc`)
  if (effect.baseMp) lines.push(`Tăng vĩnh viễn +${effect.baseMp} MP gốc`)
  if (effect.baseDamage) lines.push(`Tăng vĩnh viễn +${effect.baseDamage} damage gốc`)

  if (lines.length === 0) return null

  return (
    <div className="inventory-stat-list">
      {lines.map((line) => (
        <span key={line} className="inventory-stat-chip">
          {line}
        </span>
      ))}
    </div>
  )
}

export default function BagPanel({ player, actions }) {
  const inventory = Array.isArray(player?.inventory) ? player.inventory : []
  const items = getInventoryEntries(inventory)
  const totalItems = countInventoryItems(inventory)

  return (
    <section className="altar-card bag-panel">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Hành trang</div>
            <h2 className="realm-title" style={{ fontSize: 32 }}>
              TÚI CHỨA ĐỒ
            </h2>
          </div>

          <div className="realm-stage-pill">
            <span>Tổng vật phẩm</span>
            <strong>{totalItems}</strong>
          </div>
        </div>

        <div className="resource-grid" style={{ marginBottom: 18 }}>
          <div className="resource-chip">
            <span>Linh thạch</span>
            <strong>{player?.spiritStones ?? 0}</strong>
          </div>
          <div className="resource-chip">
            <span>Dược thảo</span>
            <strong>{player?.herbs ?? 0}</strong>
          </div>
          <div className="resource-chip">
            <span>HP</span>
            <strong>{player?.hp ?? 0}</strong>
          </div>
          <div className="resource-chip">
            <span>MP</span>
            <strong>{player?.mp ?? 0}</strong>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mini-panel">
            <div className="mini-panel-title">Túi đồ trống</div>
            <p style={{ margin: 0, color: '#b8bfd6' }}>
              Sau này mọi vật phẩm nhặt được, chế tạo được, hoặc rơi từ quái sẽ nằm ở đây.
            </p>
          </div>
        ) : (
          <div className="inventory-grid">
            {items.map((item) => (
              <div
                key={item.key}
                className={`inventory-card ${item.equipped ? 'equipped' : ''}`}
              >
                <div className="inventory-card-top">
                  <div>
                    <div className="inventory-name">{item.name}</div>
                    <div className="inventory-sub">
                      {item.type === 'equipment'
                        ? `Trang bị • ${item.slot} • ${rarityLabel(item.rarity)}`
                        : 'Vật phẩm tiêu hao'}
                    </div>
                  </div>

                  <div className="inventory-qty">
                    {item.type === 'consumable'
                      ? `x${item.quantity}`
                      : item.equipped
                      ? 'Đang mặc'
                      : 'x1'}
                  </div>
                </div>

                {item.description ? (
                  <p className="inventory-description">{item.description}</p>
                ) : null}

                {item.type === 'equipment' && renderStats(item.stats)}
                {item.type === 'consumable' && renderConsumableEffect(item.effect)}

                <div className="inventory-actions">
                  {item.type === 'equipment' && !item.equipped && (
                    <button
                      className="dao-btn dao-btn-primary"
                      onClick={() => actions.equipItem(item.raw.instanceId)}
                    >
                      Trang bị
                    </button>
                  )}

                  {item.type === 'equipment' && item.equipped && (
                    <button
                      className="dao-btn dao-btn-muted"
                      onClick={() => actions.unequipItem(item.slot)}
                    >
                      Tháo ra
                    </button>
                  )}

                  {item.type === 'consumable' && item.quantity > 0 && (
                    <button
                      className="dao-btn dao-btn-accent"
                      onClick={() => actions.useItem(item.id)}
                    >
                      Sử dụng
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

import { useMemo, useState } from 'react'
import { getShopEntries, SHOP_SECTIONS } from '../systems/shop'

const effectLabels = {
  damage: 'Sát thương',
  defense: 'Phòng thủ',
  maxHp: 'Sinh lực',
  hp: 'Hồi Sinh lực',
  mp: 'Hồi Pháp lực',
  baseHp: 'Sinh lực gốc',
  baseMp: 'Pháp lực gốc',
  baseDamage: 'Công gốc',
  dodgeChance: 'Né tránh',
}

function renderEffectBadges(entry) {
  if (entry.kind === 'equipment') {
    return Object.entries(entry.stats || {}).map(([statKey, value]) => (
      <span key={statKey} className="inventory-stat-chip">
        {effectLabels[statKey] || statKey}: +{value}
      </span>
    ))
  }

  if (entry.kind === 'skill') {
    return [
      <span key="damage" className="inventory-stat-chip">
        {(Number(entry.damageMultiplier) * 100).toFixed(0)}% sát thương
      </span>,
      <span key="mana" className="inventory-stat-chip">
        {entry.manaCost} Pháp lực
      </span>,
      <span key="cooldown" className="inventory-stat-chip">
        Hồi chiêu {entry.cooldownTurns} lượt
      </span>,
    ]
  }

  const effect = entry.effect || {}

  return Object.entries(effect).map(([effectKey, value]) => (
    <span key={effectKey} className="inventory-stat-chip">
      {effectLabels[effectKey] || effectKey}: +{value}
    </span>
  ))
}

function ShopCard({ entry, onBuy }) {
  return (
    <div className="mini-panel alchemy-recipe-card">
      <div className="mini-panel-title">{entry.name}</div>
      <p className="inventory-description" style={{ marginTop: 0, marginBottom: 12 }}>
        {entry.description}
      </p>

      <div className="requirements-list" style={{ marginBottom: 12 }}>
        <div>
          <span>Giá</span>
          <strong>{entry.price} linh thạch</strong>
        </div>
        {entry.levelRequired ? (
          <div>
            <span>Yêu cầu</span>
            <strong>Tầng {entry.levelRequired}+</strong>
          </div>
        ) : null}
        {entry.recipe?.cost?.herbs ? (
          <div>
            <span>Luyện đan gốc</span>
            <strong>{entry.recipe.cost.herbs} thảo</strong>
          </div>
        ) : null}
      </div>

      <div className="inventory-stat-list" style={{ marginBottom: 14 }}>
        {renderEffectBadges(entry)}
      </div>

      <button className="dao-btn dao-btn-primary" onClick={() => onBuy(entry)}>
        Mua ngay
      </button>
    </div>
  )
}

export default function ShopPanel({ player, actions }) {
  const [activeSection, setActiveSection] = useState(SHOP_SECTIONS[0]?.id || 'equipment')
  const items = useMemo(() => getShopEntries(activeSection), [activeSection])

  return (
    <section className="altar-card bag-panel">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Tiên môn giao dịch</div>
            <h2 className="realm-title" style={{ fontSize: 32 }}>
              TIÊN CÁC
            </h2>
          </div>

          <div className="realm-stage-pill">
            <span>Linh thạch hiện có</span>
            <strong>{player?.spiritStones ?? 0}</strong>
          </div>
        </div>

        <div
          className="inventory-stat-list"
          style={{ marginBottom: 18, gap: 10, flexWrap: 'wrap' }}
        >
          {SHOP_SECTIONS.map((section) => (
            <button
              key={section.id}
              className={`dao-btn ${activeSection === section.id ? 'dao-btn-primary' : 'dao-btn-muted'}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div
          className="dual-panel-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
        >
          {items.map((entry) => (
            <ShopCard
              key={`${activeSection}_${entry.itemId}`}
              entry={entry}
              onBuy={(item) => actions.purchaseShopItem(activeSection, item.itemId)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

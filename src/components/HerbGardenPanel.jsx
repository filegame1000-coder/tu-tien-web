import { useEffect, useMemo, useState } from 'react'
import {
  HERB_GARDEN_GROW_TIME_MS,
  HERB_GARDEN_HARVEST_YIELD,
  HERB_GARDEN_MAX_SLOTS,
  HERB_GARDEN_UNLOCK_COST,
  getHerbSlotProgress,
  getHerbSlotRemainingMs,
  isHerbSlotPlanted,
  isHerbSlotReady,
} from '../systems/herbGarden'

function formatTime(ms = 0) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function FieldCard({ slot, slotIndex, unlocked, now, actions }) {
  const planted = isHerbSlotPlanted(slot)
  const ready = isHerbSlotReady(slot, now)
  const remainMs = getHerbSlotRemainingMs(slot, now)
  const progress = getHerbSlotProgress(slot, now)

  if (!unlocked) {
    return (
      <div className="mini-panel herb-slot-card herb-slot-locked">
        <div className="mini-panel-title">Ô linh điền #{slotIndex + 1}</div>
        <p className="inventory-description" style={{ marginBottom: 0 }}>
          Ô này chưa được mở khóa.
        </p>
      </div>
    )
  }

  return (
    <div className="mini-panel herb-slot-card">
      <div className="mini-panel-title">Ô linh điền #{slotIndex + 1}</div>

      {!planted ? (
        <>
          <p className="inventory-description">
            Trạng thái: Đất trống. Có thể gieo 1 hạt giống để trồng dược thảo.
          </p>

          <div className="inventory-stat-list" style={{ marginBottom: 14 }}>
            <span className="inventory-stat-chip">
              Thời gian: {formatTime(HERB_GARDEN_GROW_TIME_MS)}
            </span>
            <span className="inventory-stat-chip">
              Thu hoạch: +{HERB_GARDEN_HARVEST_YIELD} dược thảo
            </span>
          </div>

          <button
            className="dao-btn dao-btn-primary"
            onClick={() => actions.plantHerbSeed(slotIndex)}
          >
            Gieo hạt
          </button>
        </>
      ) : ready ? (
        <>
          <p className="inventory-description">
            Dược thảo đã trưởng thành, có thể thu hoạch ngay.
          </p>

          <div className="breakthrough-progress compact">
            <div className="breakthrough-progress-fill" style={{ width: '100%' }} />
          </div>

          <div className="alchemy-progress-meta">
            <span>Tiến độ</span>
            <strong>100%</strong>
          </div>

          <button
            className="dao-btn dao-btn-accent"
            onClick={() => actions.harvestHerbSlot(slotIndex)}
          >
            Thu hoạch
          </button>
        </>
      ) : (
        <>
          <p className="inventory-description">
            Dược thảo đang phát triển. Chờ thêm để thu hoạch.
          </p>

          <div className="breakthrough-progress compact">
            <div
              className="breakthrough-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="alchemy-progress-meta">
            <span>Còn lại</span>
            <strong>{formatTime(remainMs)}</strong>
          </div>

          <button className="dao-btn dao-btn-muted" disabled>
            Đang trồng...
          </button>
        </>
      )}
    </div>
  )
}

export default function HerbGardenPanel({ player, herbGarden, actions }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const readyCount = useMemo(() => {
    const slots = Array.isArray(herbGarden?.slots) ? herbGarden.slots : []

    return slots.reduce((total, slot, index) => {
      if (index >= (Number(herbGarden?.unlockedSlots) || 0)) return total
      return total + (isHerbSlotReady(slot, now) ? 1 : 0)
    }, 0)
  }, [herbGarden, now])

  const unlockedSlots = Number(herbGarden?.unlockedSlots) || 1
  const slots = Array.isArray(herbGarden?.slots) ? herbGarden.slots : []

  return (
    <section className="altar-card bag-panel">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Động phủ</div>
            <h2 className="realm-title" style={{ fontSize: 32 }}>
              LINH ĐIỀN
            </h2>
          </div>

          <div className="realm-stage-pill">
            <span>Đã mở</span>
            <strong>
              {unlockedSlots}/{HERB_GARDEN_MAX_SLOTS}
            </strong>
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
            <span>Ô sẵn sàng</span>
            <strong>{readyCount}</strong>
          </div>
          <div className="resource-chip">
            <span>Giá mở ô</span>
            <strong>{HERB_GARDEN_UNLOCK_COST}</strong>
          </div>
        </div>

        <div className="mini-panel herb-garden-top-panel">
          <div className="mini-panel-title">Thông tin linh điền</div>

          <p className="inventory-description">
            Hiện tại mỗi ô linh điền có thể gieo 1 hạt giống và sau{' '}
            <strong>{formatTime(HERB_GARDEN_GROW_TIME_MS)}</strong> sẽ thu hoạch được{' '}
            <strong>{HERB_GARDEN_HARVEST_YIELD} dược thảo</strong>.
          </p>

          <div className="inventory-stat-list">
            <span className="inventory-stat-chip">1 ô mở sẵn miễn phí</span>
            <span className="inventory-stat-chip">
              Mỗi lần nâng: +1 ô / {HERB_GARDEN_UNLOCK_COST} linh thạch
            </span>
            <span className="inventory-stat-chip">
              Tối đa {HERB_GARDEN_MAX_SLOTS} ô
            </span>
          </div>

          <div className="action-row" style={{ marginTop: 12 }}>
            <button
              className="dao-btn dao-btn-primary"
              onClick={actions.upgradeHerbGarden}
              disabled={unlockedSlots >= HERB_GARDEN_MAX_SLOTS}
            >
              {unlockedSlots >= HERB_GARDEN_MAX_SLOTS
                ? 'Đã mở tối đa'
                : 'Mở thêm 1 ô linh điền'}
            </button>

            <button
              className="dao-btn dao-btn-accent"
              onClick={actions.harvestAllHerbs}
              disabled={readyCount <= 0}
            >
              Thu hoạch tất cả
            </button>
          </div>
        </div>

        <div
          className="dual-panel-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}
        >
          {Array.from({ length: HERB_GARDEN_MAX_SLOTS }, (_, slotIndex) => (
            <FieldCard
              key={slotIndex}
              slot={slots[slotIndex]}
              slotIndex={slotIndex}
              unlocked={slotIndex < unlockedSlots}
              now={now}
              actions={actions}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

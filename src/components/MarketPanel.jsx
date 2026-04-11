import { useEffect, useMemo, useState } from 'react'
import { equipmentDefs } from '../data/equipments'
import { getEquipmentEntries } from '../systems/inventory'

function mergeStats(baseStats = {}, bonusStats = {}) {
  const merged = { ...baseStats }

  for (const [key, value] of Object.entries(bonusStats || {})) {
    merged[key] = (merged[key] || 0) + (value || 0)
  }

  return merged
}

function statLabel(statKey) {
  const labels = {
    maxHp: 'Sinh lực',
    maxMp: 'Pháp lực',
    damage: 'Công',
    defense: 'Thủ',
    dodgeChance: 'Né tránh',
  }

  return labels[statKey] || statKey
}

function formatStatValue(statKey, value) {
  if (statKey === 'dodgeChance') return `+${Math.round(value * 100)}%`
  return `+${value}`
}

function formatCreatedTime(createdAtMs) {
  if (!createdAtMs) return 'Vừa đăng'

  const diffMinutes = Math.max(0, Math.floor((Date.now() - createdAtMs) / 60000))
  if (diffMinutes < 1) return 'Vừa đăng'
  if (diffMinutes < 60) return `${diffMinutes} phút trước`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} ngày trước`
}

function getListingView(listing) {
  const def = equipmentDefs[listing?.item?.defId]
  if (!def) return null

  return {
    ...listing,
    itemName: def.name,
    rarity: def.rarity,
    slot: def.slot,
    stats: mergeStats(def.stats, listing?.item?.bonusStats),
    description: def.description || '',
  }
}

function ListingCard({ listing, isOwner, onBuy, onCancel }) {
  const view = getListingView(listing)
  if (!view) return null

  return (
    <div className="inventory-card">
      <div className="inventory-card-top">
        <div>
          <div className="inventory-name">{view.itemName}</div>
          <div className="inventory-sub">
            {view.sellerName} • {formatCreatedTime(view.createdAtMs)}
          </div>
        </div>

        <div className="inventory-qty">{view.price} LT</div>
      </div>

      {view.description ? <p className="inventory-description">{view.description}</p> : null}

      <div className="inventory-stat-list">
        <span className="inventory-stat-chip">{view.slot}</span>
        {Object.entries(view.stats || {}).map(([key, value]) => (
          <span key={key} className="inventory-stat-chip">
            {statLabel(key)}: {formatStatValue(key, value)}
          </span>
        ))}
      </div>

      <div className="inventory-actions">
        {isOwner ? (
          <button className="dao-btn dao-btn-muted" onClick={() => onCancel(listing.id)}>
            Gỡ khỏi chợ
          </button>
        ) : (
          <button className="dao-btn dao-btn-primary" onClick={() => onBuy(listing.id)}>
            Mua ngay
          </button>
        )}
      </div>
    </div>
  )
}

export default function MarketPanel({ player, currentUid, actions }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInstanceId, setSelectedInstanceId] = useState('')
  const [price, setPrice] = useState('100')
  const [keyword, setKeyword] = useState('')

  const sellableItems = useMemo(() => {
    return getEquipmentEntries(player?.inventory || []).filter((item) => !item.equipped)
  }, [player?.inventory])

  async function reloadListings() {
    setLoading(true)
    const nextListings = await actions.listMarketListings()
    setListings(Array.isArray(nextListings) ? nextListings : [])
    setLoading(false)
  }

  useEffect(() => {
    void reloadListings()
  }, [])

  useEffect(() => {
    if (!selectedInstanceId && sellableItems[0]?.raw?.instanceId) {
      setSelectedInstanceId(sellableItems[0].raw.instanceId)
    }
  }, [selectedInstanceId, sellableItems])

  const filteredListings = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase()
    const sorted = [...listings].sort((left, right) => (right.createdAtMs || 0) - (left.createdAtMs || 0))

    if (!trimmedKeyword) return sorted

    return sorted.filter((listing) => {
      const view = getListingView(listing)
      if (!view) return false

      return (
        String(view.itemName || '').toLowerCase().includes(trimmedKeyword) ||
        String(view.sellerName || '').toLowerCase().includes(trimmedKeyword)
      )
    })
  }, [keyword, listings])

  const ownListings = useMemo(
    () => filteredListings.filter((listing) => listing.sellerUid === currentUid),
    [currentUid, filteredListings]
  )

  const marketListings = useMemo(
    () => filteredListings.filter((listing) => listing.sellerUid !== currentUid),
    [currentUid, filteredListings]
  )

  async function handleCreateListing() {
    if (!selectedInstanceId) return

    const safePrice = Math.max(1, Number(price) || 0)
    const result = await actions.createMarketListing(selectedInstanceId, safePrice)

    if (result?.ok) {
      setPrice(String(safePrice))
      setSelectedInstanceId('')
      await reloadListings()
    }
  }

  async function handleCancelListing(listingId) {
    const ok = await actions.cancelMarketListing(listingId)
    if (ok) {
      await reloadListings()
    }
  }

  async function handleBuyListing(listingId) {
    const ok = await actions.buyMarketListing(listingId)
    if (ok) {
      await reloadListings()
    }
  }

  return (
    <section className="altar-card bag-panel">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Giao dịch giữa đạo hữu</div>
            <h2 className="realm-title" style={{ fontSize: 32 }}>
              CHỢ GIAO DỊCH
            </h2>
          </div>

          <div className="realm-stage-pill">
            <span>Linh thạch hiện có</span>
            <strong>{player?.spiritStones ?? 0}</strong>
          </div>
        </div>

        <div className="resource-grid" style={{ marginBottom: 18 }}>
          <div className="resource-chip">
            <span>Tổng sạp đang mở</span>
            <strong>{listings.length}</strong>
          </div>
          <div className="resource-chip">
            <span>Sạp của bạn</span>
            <strong>{ownListings.length}</strong>
          </div>
          <div className="resource-chip">
            <span>Trang bị có thể bán</span>
            <strong>{sellableItems.length}</strong>
          </div>
          <div className="resource-chip">
            <span>Hàng có thể mua</span>
            <strong>{marketListings.length}</strong>
          </div>
        </div>

        <div className="dual-panel-grid" style={{ alignItems: 'start' }}>
          <div className="mini-panel">
            <div className="mini-panel-title">Đăng bán trang bị</div>

            {sellableItems.length === 0 ? (
              <p style={{ margin: 0, color: '#b8bfd6' }}>
                Bạn chưa có trang bị trống để đăng bán. Hãy tháo trang bị trước khi đem lên chợ.
              </p>
            ) : (
              <>
                <div className="requirements-list" style={{ marginBottom: 14 }}>
                  <div>
                    <span>Chọn trang bị</span>
                    <select
                      className="dao-input"
                      value={selectedInstanceId}
                      onChange={(event) => setSelectedInstanceId(event.target.value)}
                    >
                      {sellableItems.map((item) => (
                        <option key={item.raw.instanceId} value={item.raw.instanceId}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span>Giá bán</span>
                    <input
                      className="dao-input"
                      type="number"
                      min="1"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                    />
                  </div>
                </div>

                <button className="dao-btn dao-btn-primary" onClick={handleCreateListing}>
                  Đăng bán
                </button>
              </>
            )}

            <div className="mini-panel-title" style={{ marginTop: 18 }}>
              Sạp hàng của bạn
            </div>

            {ownListings.length === 0 ? (
              <p style={{ margin: 0, color: '#b8bfd6' }}>Bạn chưa đăng bán vật phẩm nào.</p>
            ) : (
              <div className="inventory-grid">
                {ownListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isOwner
                    onCancel={handleCancelListing}
                    onBuy={handleBuyListing}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mini-panel">
            <div
              className="inventory-card-top"
              style={{ marginBottom: 14, alignItems: 'center' }}
            >
              <div className="mini-panel-title" style={{ marginBottom: 0 }}>
                Gian hàng toàn cõi
              </div>

              <button className="dao-btn dao-btn-muted" onClick={() => void reloadListings()}>
                Tải lại
              </button>
            </div>

            <input
              className="dao-input"
              placeholder="Tìm theo vật phẩm hoặc người bán..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              style={{ marginBottom: 14 }}
            />

            {loading ? (
              <p style={{ margin: 0, color: '#b8bfd6' }}>Đang tải gian hàng...</p>
            ) : null}

            {!loading && marketListings.length === 0 ? (
              <p style={{ margin: 0, color: '#b8bfd6' }}>
                Chưa có vật phẩm phù hợp trong chợ giao dịch.
              </p>
            ) : null}

            {!loading && marketListings.length > 0 ? (
              <div className="inventory-grid">
                {marketListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isOwner={false}
                    onCancel={handleCancelListing}
                    onBuy={handleBuyListing}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

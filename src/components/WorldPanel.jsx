import { useMemo, useState } from 'react'

const rankingModes = [
  { id: 'power', label: 'Lực chiến' },
  { id: 'realm', label: 'Cảnh giới' },
  { id: 'wealth', label: 'Linh thạch' },
  { id: 'damage', label: 'Công kích' },
]

const realmWeights = {
  'Phàm Nhân': 1,
  'Pham Nhan': 1,
  'PhÃ m NhÃ¢n': 1,
  'Luyện Khí': 2,
  'Luyen Khi': 2,
  'Luyá»‡n KhÃ­': 2,
}

function formatLastSeen(lastSeenAtMs) {
  if (!lastSeenAtMs) return 'Chưa hoạt động'

  const diffMs = Date.now() - lastSeenAtMs
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 1) return 'Vừa xong'
  if (diffMinutes < 60) return `${diffMinutes} phút trước`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} ngày trước`
}

function getRealmScore(player) {
  const realmWeight = realmWeights[player.realm] || 0
  return realmWeight * 100000 + (Number(player.stage) || 0) * 1000 + (Number(player.exp) || 0)
}

function getRankingValue(player, mode) {
  switch (mode) {
    case 'realm':
      return getRealmScore(player)
    case 'wealth':
      return Number(player.spiritStones) || 0
    case 'damage':
      return Number(player.damage) || 0
    case 'power':
    default:
      return Number(player.power) || 0
  }
}

function formatRankingValue(player, mode) {
  switch (mode) {
    case 'realm':
      return `${player.realm} • Tầng ${player.stage} • ${player.exp} EXP`
    case 'wealth':
      return `${player.spiritStones} linh thạch`
    case 'damage':
      return `${player.damage} công`
    case 'power':
    default:
      return `${player.power} lực chiến`
  }
}

function PlayerRow({ player, mode, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`inventory-card ${selected ? 'equipped' : ''}`}
      onClick={() => onSelect(player.uid)}
      style={{ textAlign: 'left', width: '100%' }}
    >
      <div className="inventory-card-top">
        <div>
          <div className="inventory-name">
            #{player.rank} {player.name} {player.isSelf ? '(Bạn)' : ''}
          </div>
          <div className="inventory-sub">{formatRankingValue(player, mode)}</div>
        </div>

        <div className="inventory-qty">{player.isOnline ? 'Online' : 'Offline'}</div>
      </div>

      <div className="inventory-stat-list">
        <span className="inventory-stat-chip">{player.realm}</span>
        <span className="inventory-stat-chip">Tầng {player.stage}</span>
        <span className="inventory-stat-chip">Công {player.damage}</span>
        <span className="inventory-stat-chip">Thủ {player.defense}</span>
      </div>
    </button>
  )
}

export default function WorldPanel({ players = [], loading = false }) {
  const [selectedUid, setSelectedUid] = useState('')
  const [rankingMode, setRankingMode] = useState('power')
  const [keyword, setKeyword] = useState('')

  const rankedPlayers = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase()

    const sortedPlayers = [...players].sort((left, right) => {
      const diff = getRankingValue(right, rankingMode) - getRankingValue(left, rankingMode)
      if (diff !== 0) return diff

      return String(left.name || '').localeCompare(String(right.name || ''), 'vi')
    })

    const allRanked = sortedPlayers.map((player, index) => ({
      ...player,
      rank: index + 1,
    }))

    if (!trimmedKeyword) return allRanked

    return allRanked.filter((player) =>
      String(player.name || '').toLowerCase().includes(trimmedKeyword)
    )
  }, [keyword, players, rankingMode])

  const selfEntry = useMemo(() => {
    const sortedPlayers = [...players].sort((left, right) => {
      const diff = getRankingValue(right, rankingMode) - getRankingValue(left, rankingMode)
      if (diff !== 0) return diff

      return String(left.name || '').localeCompare(String(right.name || ''), 'vi')
    })

    const foundIndex = sortedPlayers.findIndex((player) => player.isSelf)
    if (foundIndex < 0) return null

    return {
      ...sortedPlayers[foundIndex],
      rank: foundIndex + 1,
    }
  }, [players, rankingMode])

  const selectedPlayer = useMemo(() => {
    if (!rankedPlayers.length) return null
    return rankedPlayers.find((player) => player.uid === selectedUid) || rankedPlayers[0]
  }, [rankedPlayers, selectedUid])

  const onlineCount = useMemo(
    () => players.filter((player) => player.isOnline).length,
    [players]
  )

  return (
    <section className="altar-card bag-panel">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Thiên bảng vạn đạo</div>
            <h2 className="realm-title" style={{ fontSize: 32 }}>
              THIÊN HẠ
            </h2>
          </div>

          <div className="realm-stage-pill">
            <span>Đạo hữu toàn cõi</span>
            <strong>{players.length}</strong>
          </div>
        </div>

        <div className="resource-grid" style={{ marginBottom: 18 }}>
          <div className="resource-chip">
            <span>Tổng người chơi</span>
            <strong>{players.length}</strong>
          </div>
          <div className="resource-chip">
            <span>Đang online</span>
            <strong>{onlineCount}</strong>
          </div>
          <div className="resource-chip">
            <span>Bảng đang xem</span>
            <strong>{rankingModes.find((mode) => mode.id === rankingMode)?.label || 'Lực chiến'}</strong>
          </div>
          <div className="resource-chip">
            <span>Hạng của bạn</span>
            <strong>{selfEntry ? `#${selfEntry.rank}` : '--'}</strong>
          </div>
        </div>

        <div className="mini-panel" style={{ marginBottom: 18 }}>
          <div className="mini-panel-title">Bộ lọc xếp hạng</div>

          <div className="inventory-stat-list" style={{ marginBottom: 12 }}>
            {rankingModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`dao-btn ${rankingMode === mode.id ? 'dao-btn-primary' : 'dao-btn-muted'}`}
                onClick={() => setRankingMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <input
            className="dao-input"
            placeholder="Tìm theo đạo hiệu..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="mini-panel">
            <div className="mini-panel-title">Đang tải Thiên Hạ...</div>
          </div>
        ) : null}

        {!loading && players.length === 0 ? (
          <div className="mini-panel">
            <div className="mini-panel-title">Chưa có đạo hữu nào</div>
            <p style={{ margin: 0, color: '#b8bfd6' }}>
              Khi người chơi hoạt động online, hồ sơ công khai sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : null}

        {!loading && rankedPlayers.length > 0 ? (
          <div className="dual-panel-grid" style={{ alignItems: 'start' }}>
            <div className="inventory-grid">
              {rankedPlayers.map((player) => (
                <PlayerRow
                  key={`${rankingMode}_${player.uid}`}
                  player={player}
                  mode={rankingMode}
                  selected={player.uid === selectedPlayer?.uid}
                  onSelect={setSelectedUid}
                />
              ))}
            </div>

            <div className="mini-panel">
              <div className="mini-panel-title">Hồ sơ đạo hữu</div>

              {selectedPlayer ? (
                <div className="requirements-list">
                  <div>
                    <span>Thứ hạng</span>
                    <strong>#{selectedPlayer.rank}</strong>
                  </div>
                  <div>
                    <span>Đạo hiệu</span>
                    <strong>{selectedPlayer.name}</strong>
                  </div>
                  <div>
                    <span>Cảnh giới</span>
                    <strong>
                      {selectedPlayer.realm} • Tầng {selectedPlayer.stage}
                    </strong>
                  </div>
                  <div>
                    <span>Lực chiến</span>
                    <strong>{selectedPlayer.power}</strong>
                  </div>
                  <div>
                    <span>EXP</span>
                    <strong>{selectedPlayer.exp}</strong>
                  </div>
                  <div>
                    <span>Sinh lực</span>
                    <strong>
                      {selectedPlayer.hp}/{selectedPlayer.maxHp}
                    </strong>
                  </div>
                  <div>
                    <span>Công / Thủ</span>
                    <strong>
                      {selectedPlayer.damage} / {selectedPlayer.defense}
                    </strong>
                  </div>
                  <div>
                    <span>Linh thạch</span>
                    <strong>{selectedPlayer.spiritStones}</strong>
                  </div>
                  <div>
                    <span>Dược thảo</span>
                    <strong>{selectedPlayer.herbs}</strong>
                  </div>
                  <div>
                    <span>Trạng thái</span>
                    <strong>
                      {selectedPlayer.isOnline
                        ? 'Đang online'
                        : formatLastSeen(selectedPlayer.lastSeenAtMs)}
                    </strong>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {!loading && players.length > 0 && rankedPlayers.length === 0 ? (
          <div className="mini-panel">
            <div className="mini-panel-title">Không tìm thấy đạo hữu phù hợp</div>
            <p style={{ margin: 0, color: '#b8bfd6' }}>
              Hãy thử đổi từ khóa tìm kiếm hoặc chuyển sang một bảng xếp hạng khác.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

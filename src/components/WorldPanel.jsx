import { useMemo, useState } from 'react'

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

function PlayerRow({ player, selected, onSelect }) {
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
          <div className="inventory-sub">
            {player.realm} • Tầng {player.stage}
          </div>
        </div>

        <div className="inventory-qty">
          {player.isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="inventory-stat-list">
        <span className="inventory-stat-chip">Lực chiến: {player.power}</span>
        <span className="inventory-stat-chip">Công: {player.damage}</span>
        <span className="inventory-stat-chip">Thủ: {player.defense}</span>
      </div>
    </button>
  )
}

export default function WorldPanel({ players = [], loading = false }) {
  const [selectedUid, setSelectedUid] = useState('')

  const selectedPlayer = useMemo(() => {
    if (!players.length) return null

    return (
      players.find((player) => player.uid === selectedUid) ||
      players[0]
    )
  }, [players, selectedUid])

  return (
    <section className="altar-card bag-panel">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Thế giới tu tiên</div>
            <h2 className="realm-title" style={{ fontSize: 32 }}>
              THIÊN HẠ
            </h2>
          </div>

          <div className="realm-stage-pill">
            <span>Nhân vật hiển thị</span>
            <strong>{players.length}</strong>
          </div>
        </div>

        {loading ? (
          <div className="mini-panel">
            <div className="mini-panel-title">Đang tải thiên hạ...</div>
          </div>
        ) : null}

        {!loading && players.length === 0 ? (
          <div className="mini-panel">
            <div className="mini-panel-title">Chưa có đạo hữu nào</div>
            <p style={{ margin: 0, color: '#b8bfd6' }}>
              Khi người chơi có hành động online, hồ sơ công khai sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : null}

        {!loading && players.length > 0 ? (
          <div className="dual-panel-grid" style={{ alignItems: 'start' }}>
            <div className="inventory-grid">
              {players.map((player) => (
                <PlayerRow
                  key={player.uid}
                  player={player}
                  selected={player.uid === selectedPlayer?.uid}
                  onSelect={setSelectedUid}
                />
              ))}
            </div>

            <div className="mini-panel">
              <div className="mini-panel-title">Hồ sơ đạo hữu</div>

              {selectedPlayer ? (
                <>
                  <div className="requirements-list">
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
                      <span>HP</span>
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
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

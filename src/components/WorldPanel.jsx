import { useMemo, useState } from 'react'

function formatLastSeen(lastSeenAtMs) {
  if (!lastSeenAtMs) return 'Chua hoat dong'

  const diffMs = Date.now() - lastSeenAtMs
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 1) return 'Vua xong'
  if (diffMinutes < 60) return `${diffMinutes} phut truoc`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} gio truoc`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} ngay truoc`
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
            #{player.rank} {player.name} {player.isSelf ? '(Ban)' : ''}
          </div>
          <div className="inventory-sub">
            {player.realm} • Tang {player.stage}
          </div>
        </div>

        <div className="inventory-qty">
          {player.isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="inventory-stat-list">
        <span className="inventory-stat-chip">Luc chien: {player.power}</span>
        <span className="inventory-stat-chip">Cong: {player.damage}</span>
        <span className="inventory-stat-chip">Thu: {player.defense}</span>
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
            <div className="section-kicker">The gioi tu tien</div>
            <h2 className="realm-title" style={{ fontSize: 32 }}>
              THIEN HA
            </h2>
          </div>

          <div className="realm-stage-pill">
            <span>Nhan vat hien thi</span>
            <strong>{players.length}</strong>
          </div>
        </div>

        {loading ? (
          <div className="mini-panel">
            <div className="mini-panel-title">Dang tai thien ha...</div>
          </div>
        ) : null}

        {!loading && players.length === 0 ? (
          <div className="mini-panel">
            <div className="mini-panel-title">Chua co dao huu nao</div>
            <p style={{ margin: 0, color: '#b8bfd6' }}>
              Khi nguoi choi co hanh dong online, ho so cong khai se xuat hien tai day.
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
              <div className="mini-panel-title">Ho so dao huu</div>

              {selectedPlayer ? (
                <>
                  <div className="requirements-list">
                    <div>
                      <span>Dao hieu</span>
                      <strong>{selectedPlayer.name}</strong>
                    </div>
                    <div>
                      <span>Canh gioi</span>
                      <strong>
                        {selectedPlayer.realm} • Tang {selectedPlayer.stage}
                      </strong>
                    </div>
                    <div>
                      <span>Luc chien</span>
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
                      <span>Cong / Thu</span>
                      <strong>
                        {selectedPlayer.damage} / {selectedPlayer.defense}
                      </strong>
                    </div>
                    <div>
                      <span>Linh thach</span>
                      <strong>{selectedPlayer.spiritStones}</strong>
                    </div>
                    <div>
                      <span>Duoc thao</span>
                      <strong>{selectedPlayer.herbs}</strong>
                    </div>
                    <div>
                      <span>Trang thai</span>
                      <strong>
                        {selectedPlayer.isOnline
                          ? 'Dang online'
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

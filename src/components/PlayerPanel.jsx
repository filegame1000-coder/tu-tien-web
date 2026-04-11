import { useState } from 'react'

function InfoRow({ label, value, emphasize = false }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong className={emphasize ? 'gold-text' : ''}>{value}</strong>
    </div>
  )
}

export default function PlayerPanel({ player, finalStats, actions, actionState }) {
  const [showStats, setShowStats] = useState(true)

  if (!player) return null

  const exp = Number(player.exp) || 0
  const currentHp = Number(player.hp) || 0
  const maxHp = Number(finalStats?.maxHp) || 0
  const currentMp = Number(player.mp) || 0
  const maxMp = Number(finalStats?.maxMp) || 0
  const percent = Math.max(0, Math.min((exp / 100) * 100, 100))

  return (
    <section className="altar-card player-card">
      <div className="player-header" onClick={() => setShowStats((prev) => !prev)}>
        <div className="avatar-seal">仙</div>
        <div>
          <div className="section-kicker">Đạo hiệu</div>
          <h2>{player.name || 'Vô Danh'}</h2>
          <div className="muted-text">
            {player.realm} • Tầng {player.stage}
          </div>
        </div>
      </div>

      <div className="side-progress">
        <div className="side-progress-top">
          <span>Linh lực</span>
          <strong>{exp}/100</strong>
        </div>
        <div className="breakthrough-progress compact">
          <div className="breakthrough-progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {showStats ? (
        <div className="info-group">
          <InfoRow label="Sinh lực" value={`${currentHp}/${maxHp}`} emphasize />
          <InfoRow label="Pháp lực" value={`${currentMp}/${maxMp}`} />
          <InfoRow label="Sát thương" value={finalStats?.damage ?? 0} />
          <InfoRow label="Phòng thủ" value={finalStats?.defense ?? 0} />
          <InfoRow label="Linh thạch" value={player.spiritStones ?? 0} />
          <InfoRow label="Dược thảo" value={player.herbs ?? 0} />
        </div>
      ) : null}

      <div className="player-actions-grid">
        <button
          className="dao-btn dao-btn-primary"
          onClick={actions.cultivate}
          disabled={actionState?.isActionLocked}
        >
          {actionState?.isCultivating ? 'Đang tu luyện...' : 'Tu luyện nhanh'}
        </button>
        <button
          className="dao-btn dao-btn-accent"
          onClick={actions.breakthrough}
          disabled={actionState?.isActionLocked}
        >
          {actionState?.isBreakingThrough ? 'Đang đột phá...' : 'Đột phá'}
        </button>
      </div>
    </section>
  )
}

import LogPanel from './LogPanel'
import { getEquippedSkillEntries } from '../systems/skills'

function Bar({ value, max, label }) {
  const safeValue = Number(value) || 0
  const safeMax = Math.max(1, Number(max) || 1)
  const percent = Math.max(0, Math.min((safeValue / safeMax) * 100, 100))

  return (
    <div className="bar-block">
      <div className="bar-meta">
        <span>{label}</span>
        <strong>
          {safeValue}/{safeMax}
        </strong>
      </div>
      <div className="battle-bar">
        <div className="battle-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export default function DungeonPanel({
  player,
  dungeon,
  actions,
  finalStats,
  combatLogs = [],
}) {
  const enemy = dungeon?.currentEnemy
  const playerHp = Number(player?.hp) || 0
  const equippedSkills = getEquippedSkillEntries(player)

  return (
    <section className="altar-card dungeon-card">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Chiến trường</div>
            <h2 className="panel-title">Bí Cảnh Thí Luyện</h2>
          </div>
          <div className="realm-stage-pill">
            <span>Tầng hiện tại</span>
            <strong>{dungeon?.currentFloor || 'Chưa vào'}</strong>
          </div>
        </div>

        {!dungeon?.currentFloor ? (
          <div className="dungeon-entry-grid">
            <button className="dao-btn dao-btn-primary" onClick={() => actions.enterDungeon(1)}>
              Vào Bí Cảnh tầng 1
            </button>
            <button className="dao-btn dao-btn-accent" onClick={() => actions.enterDungeon(2)}>
              Vào Bí Cảnh tầng 2
            </button>
          </div>
        ) : (
          <>
            <div className="battle-grid">
              <div className="battle-panel">
                <div className="battle-name">{player?.name || 'Đạo hữu'}</div>
                <div className="muted-text">
                  {player?.realm} • Tầng {player?.stage}
                </div>
                <Bar label="HP" value={player?.hp ?? 0} max={finalStats?.maxHp ?? 1} />
                <Bar label="Ki" value={player?.mp ?? 0} max={finalStats?.maxMp ?? 1} />
                <div className="battle-stats">
                  <span>Sát thương: {finalStats?.damage ?? 0}</span>
                  <span>Phòng thủ: {finalStats?.defense ?? 0}</span>
                </div>
              </div>

              <div className="battle-vs">VS</div>

              <div className="battle-panel enemy-panel">
                <div className="battle-name">{enemy?.name || 'Yêu thú chưa xuất hiện'}</div>
                <div className="muted-text">
                  {enemy?.type === 'boss'
                    ? 'Boss'
                    : `${enemy?.realm ?? 'Phàm Nhân'} • Tầng ${enemy?.stage ?? 1}`}
                </div>
                <Bar label="HP" value={enemy?.hp ?? 0} max={enemy?.maxHp ?? 1} />
                <div className="battle-stats">
                  <span>Sát thương: {enemy?.damage ?? 0}</span>
                  <span>Phòng thủ: {enemy?.defense ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="action-row centered">
              <button
                className="dao-btn dao-btn-danger"
                onClick={() => actions.attackEnemy()}
                disabled={!enemy || playerHp <= 0}
              >
                Tấn công
              </button>
              <button className="dao-btn dao-btn-muted" onClick={actions.leaveDungeon}>
                Rời bí cảnh
              </button>
            </div>

            <div className="mini-panel" style={{ marginTop: 18 }}>
              <div className="mini-panel-title">Kỹ năng chiến đấu</div>
              <div className="inventory-grid">
                {equippedSkills.map((entry) => {
                  const disabled =
                    !entry.skillId ||
                    !enemy ||
                    playerHp <= 0 ||
                    entry.cooldown > 0 ||
                    (Number(player?.mp) || 0) < (Number(entry.def?.manaCost) || 0)

                  return (
                    <div key={`skill-slot-${entry.slotIndex}`} className="inventory-card">
                      <div className="inventory-card-top">
                        <div>
                          <div className="inventory-name">Ô {entry.slotIndex + 1}</div>
                          <div className="inventory-sub">
                            {entry.def ? entry.def.name : 'Chưa trang bị kỹ năng'}
                          </div>
                        </div>

                        {entry.def ? (
                          <div className="inventory-qty">
                            {entry.cooldown > 0 ? `CD ${entry.cooldown}` : 'Sẵn sàng'}
                          </div>
                        ) : null}
                      </div>

                      {entry.def ? (
                        <>
                          <p className="inventory-description">{entry.def.description}</p>
                          <div className="inventory-stat-list">
                            <span className="inventory-stat-chip">Hao Ki: {entry.def.manaCost}</span>
                            <span className="inventory-stat-chip">
                              Hồi chiêu: {entry.def.cooldownTurns} lượt
                            </span>
                          </div>
                          <button
                            className="dao-btn dao-btn-accent"
                            onClick={() => actions.attackEnemy(entry.skillId)}
                            disabled={disabled}
                          >
                            {entry.cooldown > 0
                              ? `Còn hồi ${entry.cooldown} lượt`
                              : `Dùng ${entry.def.name}`}
                          </button>
                        </>
                      ) : (
                        <p className="inventory-description">
                          Hãy vào Động phủ để trang bị kỹ năng vào ô này.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mini-panel" style={{ marginTop: 24 }}>
              <div className="mini-panel-title">Nhật ký chiến đấu</div>
              <LogPanel logs={combatLogs} />
            </div>
          </>
        )}
      </div>
    </section>
  )
}

import { useEffect, useMemo, useState } from 'react'
import LogPanel from './LogPanel'
import { getEquippedSkillEntries } from '../systems/skills'

function formatRemainMs(remainMs) {
  const safeRemainMs = Math.max(0, Number(remainMs) || 0)
  const totalSeconds = Math.ceil(safeRemainMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

function Bar({ label, value, max }) {
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

export default function WorldBossPanel({ player, finalStats, actions }) {
  const [bossState, setBossState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const equippedSkills = getEquippedSkillEntries(player)

  async function loadBoss() {
    setLoading(true)
    const result = await actions.fetchWorldBoss()
    setBossState(result)
    setLoading(false)
  }

  useEffect(() => {
    void loadBoss()
  }, [refreshNonce])

  useEffect(() => {
    const countdown = setInterval(() => {
      setBossState((prev) => (prev?.boss?.respawnAtMs ? { ...prev } : prev))
    }, 1000)

    return () => clearInterval(countdown)
  }, [])

  useEffect(() => {
    const reload = setInterval(() => {
      setRefreshNonce((prev) => prev + 1)
    }, 15000)

    return () => clearInterval(reload)
  }, [])

  const boss = bossState?.boss
  const rankings = bossState?.rankings || []
  const logs = bossState?.logs || []
  const rewardInfo = bossState?.rankingReward || {
    claimable: false,
    claimed: false,
    rank: 0,
    reward: 0,
  }
  const playerHp = Number(player?.hp) || 0
  const playerMp = Number(player?.mp) || 0
  const playerMaxHp = Number(finalStats?.maxHp) || 1
  const playerMaxMp = Number(finalStats?.maxMp) || 1
  const remainMs = Math.max(0, Number(boss?.respawnAtMs) - Date.now())
  const isAlive = boss?.status === 'alive'
  const canAttack = isAlive && playerHp > 0
  const myRanking = useMemo(
    () => rankings.find((entry) => entry.uid === bossState?.viewerUid) || null,
    [bossState?.viewerUid, rankings]
  )

  async function handleAttack(skillId = null) {
    const result = await actions.attackWorldBoss(skillId)
    if (result) setBossState(result)
  }

  async function handleQuickRevive() {
    const result = await actions.quickReviveWorldBoss()
    if (result) setBossState(result)
  }

  async function handleClaimReward() {
    const result = await actions.claimWorldBossRankingReward()
    if (result) setBossState(result)
  }

  return (
    <section className="altar-card dungeon-card">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Chiến trường liên server</div>
            <h2 className="panel-title">Boss Thế Giới</h2>
          </div>

          <div className="realm-stage-pill">
            <span>Chu kỳ boss</span>
            <strong>#{boss?.cycleId || 1}</strong>
          </div>
        </div>

        <div className="resource-grid" style={{ marginBottom: 18 }}>
          <div className="resource-chip">
            <span>Sinh lực boss</span>
            <strong>{boss?.hp ?? 0}</strong>
          </div>
          <div className="resource-chip">
            <span>Sát thương boss</span>
            <strong>{boss?.damage ?? 0}</strong>
          </div>
          <div className="resource-chip">
            <span>Thưởng kết liễu</span>
            <strong>1000 LT + Yêu Đan</strong>
          </div>
          <div className="resource-chip">
            <span>Top sát thương</span>
            <strong>100 / 50 / 20 LT</strong>
          </div>
        </div>

        {loading ? (
          <div className="mini-panel">
            <div className="mini-panel-title">Đang tải Boss thế giới...</div>
          </div>
        ) : null}

        {!loading && boss ? (
          <>
            <div className="battle-grid">
              <div className="battle-panel">
                <div className="battle-name">{player?.name || 'Đạo hữu'}</div>
                <div className="muted-text">
                  {player?.realm} • Tầng {player?.stage}
                </div>
                <Bar label="Sinh lực" value={playerHp} max={playerMaxHp} />
                <Bar label="Pháp lực" value={playerMp} max={playerMaxMp} />
                <div className="battle-stats">
                  <span>Công: {finalStats?.damage ?? 0}</span>
                  <span>Thủ: {finalStats?.defense ?? 0}</span>
                  <span>Linh thạch: {player?.spiritStones ?? 0}</span>
                </div>
              </div>

              <div className="battle-vs">VS</div>

              <div className="battle-panel enemy-panel">
                <div className="battle-name">{boss.name}</div>
                <div className="muted-text">
                  {isAlive ? 'Đang xuất hiện' : `Đã bị hạ • ${boss.lastKilledByName || 'Ẩn danh'}`}
                </div>
                <Bar label="Sinh lực" value={boss.hp} max={boss.maxHp} />
                <div className="battle-stats">
                  <span>Sát thương: {boss.damage}</span>
                  <span>Trạng thái: {isAlive ? 'Có thể chiến đấu' : 'Đang hồi sinh'}</span>
                  {!isAlive ? <span>Hồi sinh sau: {formatRemainMs(remainMs)}</span> : null}
                </div>
              </div>
            </div>

            <div className="action-row centered" style={{ marginTop: 18 }}>
              <button
                className="dao-btn dao-btn-danger"
                onClick={() => handleAttack()}
                disabled={!canAttack}
              >
                {playerHp <= 0 ? 'Cần hồi Sinh lực' : 'Tấn công thường'}
              </button>

              <button
                className="dao-btn dao-btn-accent"
                onClick={handleQuickRevive}
                disabled={isAlive}
              >
                Hồi sinh nhanh ({boss.quickReviveCost} LT)
              </button>

              <button
                className="dao-btn dao-btn-muted"
                onClick={() => setRefreshNonce((prev) => prev + 1)}
              >
                Tải lại
              </button>
            </div>

            <div className="mini-panel" style={{ marginTop: 18 }}>
              <div className="mini-panel-title">Kỹ năng đối Boss</div>
              <div className="inventory-grid">
                {equippedSkills.map((entry) => {
                  const disabled =
                    !entry.skillId ||
                    !canAttack ||
                    entry.cooldown > 0 ||
                    playerMp < (Number(entry.def?.manaCost) || 0)

                  return (
                    <div key={`boss-skill-${entry.slotIndex}`} className="inventory-card">
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
                            <span className="inventory-stat-chip">
                              Hao pháp lực: {entry.def.manaCost}
                            </span>
                            <span className="inventory-stat-chip">
                              Hồi chiêu: {entry.def.cooldownTurns} lượt
                            </span>
                          </div>
                          <button
                            className="dao-btn dao-btn-primary"
                            onClick={() => handleAttack(entry.skillId)}
                            disabled={disabled}
                          >
                            {entry.cooldown > 0
                              ? `Còn hồi ${entry.cooldown} lượt`
                              : `Dùng ${entry.def.name}`}
                          </button>
                        </>
                      ) : (
                        <p className="inventory-description">
                          Hãy vào Động Phủ để gắn kỹ năng vào ô này.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="dual-panel-grid" style={{ alignItems: 'start' }}>
              <div className="mini-panel">
                <div className="mini-panel-title">Bảng sát thương</div>

                {rankings.length === 0 ? (
                  <p style={{ margin: 0, color: '#b8bfd6' }}>
                    Chưa có ai để lại sát thương trong chu kỳ boss này.
                  </p>
                ) : (
                  <div className="inventory-grid">
                    {rankings.map((entry) => (
                      <div
                        key={`${boss.cycleId}_${entry.uid}`}
                        className={`inventory-card ${entry.uid === bossState?.viewerUid ? 'equipped' : ''}`}
                      >
                        <div className="inventory-card-top">
                          <div>
                            <div className="inventory-name">
                              #{entry.rank} {entry.name}
                            </div>
                            <div className="inventory-sub">Đã gây {entry.damage} sát thương</div>
                          </div>
                          <div className="inventory-qty">{entry.share}%</div>
                        </div>
                        {entry.rank <= 3 ? (
                          <div className="inventory-stat-list">
                            <span className="inventory-stat-chip">
                              Thưởng top {entry.rank}:{' '}
                              {entry.rank === 1 ? 100 : entry.rank === 2 ? 50 : 20} LT
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mini-panel">
                <div className="mini-panel-title">Dấu ấn của bạn</div>
                <div className="requirements-list">
                  <div>
                    <span>Hạng hiện tại</span>
                    <strong>{myRanking ? `#${myRanking.rank}` : '--'}</strong>
                  </div>
                  <div>
                    <span>Sát thương đã gây</span>
                    <strong>{myRanking?.damage ?? 0}</strong>
                  </div>
                  <div>
                    <span>Tỷ lệ đóng góp</span>
                    <strong>{myRanking ? `${myRanking.share}%` : '0%'}</strong>
                  </div>
                  <div>
                    <span>Thưởng top</span>
                    <strong>
                      {rewardInfo.rank > 0 ? `Top ${rewardInfo.rank} • ${rewardInfo.reward} LT` : 'Không có'}
                    </strong>
                  </div>
                </div>

                <div className="action-row" style={{ marginTop: 14 }}>
                  <button
                    className="dao-btn dao-btn-primary"
                    onClick={handleClaimReward}
                    disabled={!rewardInfo.claimable}
                  >
                    {rewardInfo.claimed
                      ? 'Đã nhận thưởng'
                      : rewardInfo.claimable
                      ? `Nhận ${rewardInfo.reward} LT`
                      : 'Chưa có thưởng'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mini-panel" style={{ marginTop: 18 }}>
              <div className="mini-panel-title">Nhật ký chiến đấu boss</div>
              <LogPanel logs={logs} />
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}

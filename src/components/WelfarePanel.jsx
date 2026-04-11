import { useEffect, useMemo, useState } from 'react'
import { buildWelfareView } from '../systems/welfare'

function ProgressBar({ value, max }) {
  const safeValue = Math.max(0, Number(value) || 0)
  const safeMax = Math.max(1, Number(max) || 1)
  const percent = Math.max(0, Math.min((safeValue / safeMax) * 100, 100))

  return (
    <div className="breakthrough-progress">
      <div className="breakthrough-progress-fill" style={{ width: `${percent}%` }} />
    </div>
  )
}

export default function WelfarePanel({ player, welfare, actions, latestMessage = '' }) {
  const [busyKey, setBusyKey] = useState('')
  const view = useMemo(() => buildWelfareView(welfare), [welfare])

  useEffect(() => {
    void actions.fetchWelfareState?.()
  }, [])

  async function runAction(key, task) {
    setBusyKey(key)
    try {
      await task()
    } finally {
      setBusyKey('')
    }
  }

  return (
    <section className="altar-card bag-panel">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Phúc trợ từ tông môn</div>
            <h2 className="realm-title" style={{ fontSize: 32 }}>
              PHÚC LỢI
            </h2>
          </div>

          <div className="realm-stage-pill">
            <span>Đạo hữu</span>
            <strong>{player?.name || 'Vô Danh'}</strong>
          </div>
        </div>

        <div className="mini-panel" style={{ marginBottom: 20 }}>
          <div className="mini-panel-title">Quà đăng nhập 7 ngày</div>
          <div className="action-row" style={{ marginBottom: 12 }}>
            <button
              className="dao-btn dao-btn-muted"
              disabled={busyKey === 'refresh'}
              onClick={() => runAction('refresh', () => actions.fetchWelfareState?.())}
            >
              Tải lại Phúc Lợi
            </button>
          </div>
          <div className="inventory-grid">
            {view.login.rewards.map((entry) => (
              <div
                key={`login-${entry.day}`}
                className={`inventory-card ${entry.state === 'claimed' ? 'equipped' : ''}`}
              >
                <div className="inventory-card-top">
                  <div>
                    <div className="inventory-name">{entry.label}</div>
                    <div className="inventory-sub">{entry.summary}</div>
                  </div>
                  <div className="inventory-qty">
                    {entry.state === 'claimed'
                      ? 'Đã nhận'
                      : entry.state === 'claimable'
                      ? 'Hôm nay'
                      : 'Sắp mở'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="action-row" style={{ marginTop: 14 }}>
            <button
              className="dao-btn dao-btn-primary"
              disabled={!view.login.canClaimToday || busyKey === 'login'}
              onClick={() =>
                runAction('login', () => actions.claimLoginReward?.())
              }
            >
              {view.login.canClaimToday
                ? `Nhận quà ngày ${view.login.nextLoginDay}`
                : 'Đã nhận hôm nay'}
            </button>
          </div>
        </div>

        <div className="mini-panel" style={{ marginBottom: 20 }}>
          <div className="mini-panel-title">Nhiệm vụ ngày</div>
          <div className="inventory-grid">
            {view.missions.map((mission) => (
              <div
                key={mission.id}
                className={`inventory-card ${mission.claimed ? 'equipped' : ''}`}
              >
                <div className="inventory-card-top">
                  <div>
                    <div className="inventory-name">{mission.title}</div>
                    <div className="inventory-sub">{mission.summary}</div>
                  </div>
                  <div className="inventory-qty">
                    +{mission.activityPoints} điểm
                  </div>
                </div>

                <div className="requirements-list" style={{ marginTop: 12 }}>
                  <div>
                    <span>Tiến độ</span>
                    <strong>
                      {mission.progress}/{mission.target}
                    </strong>
                  </div>
                </div>

                <button
                  className="dao-btn dao-btn-primary"
                  style={{ marginTop: 12 }}
                  disabled={!mission.canClaim || busyKey === mission.id}
                  onClick={() =>
                    runAction(mission.id, () => actions.claimDailyMissionReward?.(mission.id))
                  }
                >
                  {mission.claimed
                    ? 'Đã nhận'
                    : mission.canClaim
                    ? 'Nhận thưởng'
                    : 'Chưa hoàn thành'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mini-panel">
          <div className="mini-panel-title">Mốc hoạt động ngày</div>
          <div className="requirements-list" style={{ marginBottom: 12 }}>
            <div>
              <span>Điểm hoạt động</span>
              <strong>
                {view.activity.points}/{view.activity.maxPoints}
              </strong>
            </div>
          </div>
          <ProgressBar value={view.activity.points} max={view.activity.maxPoints} />

          <div className="inventory-grid" style={{ marginTop: 16 }}>
            {view.activity.chests.map((chest) => (
              <div
                key={`activity-${chest.threshold}`}
                className={`inventory-card ${chest.claimed ? 'equipped' : ''}`}
              >
                <div className="inventory-card-top">
                  <div>
                    <div className="inventory-name">Mốc {chest.threshold} điểm</div>
                    <div className="inventory-sub">{chest.summary}</div>
                  </div>
                  <div className="inventory-qty">
                    {chest.claimed ? 'Đã nhận' : `${chest.threshold}+`}
                  </div>
                </div>

                <button
                  className="dao-btn dao-btn-accent"
                  style={{ marginTop: 12 }}
                  disabled={!chest.canClaim || busyKey === `activity-${chest.threshold}`}
                  onClick={() =>
                    runAction(
                      `activity-${chest.threshold}`,
                      () => actions.claimDailyActivityReward?.(chest.threshold)
                    )
                  }
                >
                  {chest.claimed
                    ? 'Đã nhận'
                    : chest.canClaim
                    ? 'Mở rương'
                    : 'Chưa đủ điểm'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {latestMessage ? (
          <div className="dao-auth-note" style={{ marginTop: 16 }}>
            {latestMessage}
          </div>
        ) : null}
      </div>
    </section>
  )
}

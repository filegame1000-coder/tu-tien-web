import { useEffect, useState } from 'react'

function formatTime(createdAtMs) {
  if (!createdAtMs) return '--'

  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(createdAtMs))
  } catch {
    return String(createdAtMs)
  }
}

export default function SystemMailPanel({ player, actions, latestMessage = '' }) {
  const [mails, setMails] = useState([])
  const [loading, setLoading] = useState(false)
  const [busyKey, setBusyKey] = useState('')
  const [status, setStatus] = useState('')

  const unreadCount = mails.filter((mail) => !mail.claimed).length

  useEffect(() => {
    if (!latestMessage) return
    setStatus(latestMessage)
  }, [latestMessage])

  async function refreshMails(showStatus = true) {
    setLoading(true)
    if (showStatus) {
      setStatus('Đang tải thư hệ thống...')
    }

    const nextMails = await actions.listSystemMails?.()
    const safeMails = Array.isArray(nextMails) ? nextMails : []
    setMails(safeMails)

    if (showStatus) {
      setStatus(
        safeMails.length > 0
          ? `Đã tải ${safeMails.length} thư hệ thống.`
          : 'Bạn chưa có thư hệ thống nào.'
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    void refreshMails(false)
  }, [])

  async function handleClaim(mailId) {
    setBusyKey(mailId)
    const result = await actions.claimSystemMail?.(mailId)
    if (result?.ok) {
      await refreshMails(false)
      setStatus(result.message || 'Đã nhận thư hệ thống.')
    } else {
      setStatus(result?.message || 'Không nhận được thư này.')
    }
    setBusyKey('')
  }

  async function handleClaimAll() {
    setBusyKey('all')
    const result = await actions.claimAllSystemMails?.()
    if (result?.ok) {
      await refreshMails(false)
      setStatus(result.message || 'Đã nhận tất cả thư hệ thống.')
    } else {
      setStatus(result?.message || 'Không có thư nào để nhận.')
    }
    setBusyKey('')
  }

  async function handleDeleteMail(mailId) {
    setBusyKey(`delete-${mailId}`)
    const result = await actions.deleteSystemMail?.(mailId)
    if (result?.ok) {
      await refreshMails(false)
      setStatus(result.message || 'Đã xóa thư này.')
    } else {
      setStatus(result?.message || 'Không xóa được thư này.')
    }
    setBusyKey('')
  }

  async function handleDeleteClaimed() {
    setBusyKey('delete-claimed')
    const result = await actions.deleteClaimedSystemMails?.()
    if (result?.ok) {
      await refreshMails(false)
      setStatus(result.message || 'Đã xóa các thư đã nhận.')
    } else {
      setStatus(result?.message || 'Không có thư đã nhận để xóa.')
    }
    setBusyKey('')
  }

  return (
    <section className="altar-card bag-panel">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Thư tín từ quản trị và hệ thống</div>
            <h2 className="realm-title" style={{ fontSize: 32 }}>
              THƯ HỆ THỐNG
            </h2>
          </div>

          <div className="realm-stage-pill">
            <span>Đạo hữu</span>
            <strong>{player?.name || 'Vô Danh'}</strong>
          </div>
        </div>

        <div className="mini-panel" style={{ marginBottom: 20 }}>
          <div className="mini-panel-title">Hòm thư hiện tại</div>
          <div className="requirements-list" style={{ marginBottom: 14 }}>
            <div>
              <span>Tổng thư</span>
              <strong>{mails.length}</strong>
            </div>
            <div>
              <span>Chưa nhận</span>
              <strong>{unreadCount}</strong>
            </div>
          </div>

          <div className="action-row">
            <button
              className="dao-btn dao-btn-muted"
              onClick={() => void refreshMails(true)}
              disabled={loading}
            >
              {loading ? 'Đang tải...' : 'Tải lại thư'}
            </button>
            <button
              className="dao-btn dao-btn-primary"
              onClick={() => void handleClaimAll()}
              disabled={busyKey === 'all' || unreadCount === 0}
            >
              {busyKey === 'all' ? 'Đang nhận...' : 'Nhận tất cả'}
            </button>
            <button
              className="dao-btn dao-btn-danger"
              onClick={() => void handleDeleteClaimed()}
              disabled={busyKey === 'delete-claimed' || mails.every((mail) => !mail.claimed)}
            >
              {busyKey === 'delete-claimed' ? 'Đang xóa...' : 'Xóa thư đã nhận'}
            </button>
          </div>
        </div>

        <div className="content-stack">
          {mails.length > 0 ? (
            mails.map((mail) => (
              <div
                key={mail.id}
                className={`inventory-card ${mail.claimed ? 'equipped' : ''}`}
                style={{ padding: 18 }}
              >
                <div className="inventory-card-top">
                  <div>
                    <div className="inventory-name">{mail.title}</div>
                    <div className="inventory-sub">
                      Từ {mail.senderName || 'Hệ thống'} • {formatTime(mail.createdAtMs)}
                    </div>
                  </div>
                  <div className="inventory-qty">
                    {mail.claimed ? 'Đã nhận' : 'Chưa nhận'}
                  </div>
                </div>

                <p className="inventory-description">
                  {mail.body || 'Hệ thống gửi tới bạn một phần quà.'}
                </p>

                <div className="inventory-stat-list">
                  <span className="inventory-stat-chip">{mail.rewardSummary}</span>
                </div>

                <div className="action-row" style={{ marginTop: 12 }}>
                  <button
                    className="dao-btn dao-btn-accent"
                    disabled={mail.claimed || busyKey === mail.id}
                    onClick={() => void handleClaim(mail.id)}
                  >
                    {mail.claimed
                      ? 'Đã nhận'
                      : busyKey === mail.id
                      ? 'Đang nhận...'
                      : 'Nhận thư này'}
                  </button>
                  <button
                    className="dao-btn dao-btn-danger"
                    disabled={!mail.claimed || busyKey === `delete-${mail.id}`}
                    onClick={() => void handleDeleteMail(mail.id)}
                  >
                    {busyKey === `delete-${mail.id}` ? 'Đang xóa...' : 'Xóa thư'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="dao-auth-note">Hiện chưa có thư nào trong hòm thư.</div>
          )}
        </div>

        {status ? (
          <div className="dao-auth-note" style={{ marginTop: 16 }}>
            {status}
          </div>
        ) : null}
      </div>
    </section>
  )
}

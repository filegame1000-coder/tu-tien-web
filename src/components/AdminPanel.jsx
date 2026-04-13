import { useEffect, useMemo, useState } from 'react'

const categories = [
  { value: 'all', label: 'Tat ca' },
  { value: 'admin', label: 'Admin' },
  { value: 'mail', label: 'Thu' },
  { value: 'code', label: 'Code' },
  { value: 'market', label: 'Cho' },
  { value: 'boss', label: 'Boss' },
  { value: 'welfare', label: 'Phuc Loi' },
]

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

function formatDetails(details) {
  if (!details || typeof details !== 'object') return ''

  const parts = Object.entries(details)
    .filter(([, value]) => value !== '' && value !== null && value !== undefined)
    .slice(0, 5)
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)

  return parts.join(' | ')
}

function PlayerSummaryCard({ player, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`inventory-card ${selected ? 'equipped' : ''}`}
      onClick={() => onSelect(player.uid)}
      style={{ textAlign: 'left', width: '100%' }}
    >
      <div className="inventory-card-top">
        <div>
          <div className="inventory-name">{player.name}</div>
          <div className="inventory-sub">{player.email || player.uid}</div>
        </div>
        <div className="inventory-qty">{player.role}</div>
      </div>

      <div className="inventory-stat-list">
        <span className="inventory-stat-chip">{player.realm}</span>
        <span className="inventory-stat-chip">Tang {player.stage}</span>
        <span className="inventory-stat-chip">Power {player.power}</span>
        <span className="inventory-stat-chip">
          {player.hasActiveSession ? 'Dang co phien' : 'Khong co phien'}
        </span>
      </div>
    </button>
  )
}

export default function AdminPanel({ actions, latestMessage = '' }) {
  const [category, setCategory] = useState('all')
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [status, setStatus] = useState('')
  const [logs, setLogs] = useState([])
  const [keyword, setKeyword] = useState('')
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [players, setPlayers] = useState([])
  const [selectedUid, setSelectedUid] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [giftJson, setGiftJson] = useState('{\n  "spiritStones": 500\n}')
  const [giftNote, setGiftNote] = useState('Ho tro tu admin')
  const [sendingGift, setSendingGift] = useState(false)
  const [broadcastJson, setBroadcastJson] = useState('{\n  "spiritStones": 200\n}')
  const [broadcastNote, setBroadcastNote] = useState('Qua su kien toan server')
  const [broadcasting, setBroadcasting] = useState(false)

  const groupedCount = useMemo(() => {
    return logs.reduce((acc, item) => {
      const key = item.category || 'system'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  }, [logs])

  async function refreshLogs(nextCategory = category, showStatus = true) {
    setLoadingLogs(true)
    if (showStatus) {
      setStatus('Dang tai nhat ky he thong...')
    }

    const nextLogs = await actions.listAuditLogs(nextCategory, 80)
    setLogs(Array.isArray(nextLogs) ? nextLogs : [])

    if (showStatus) {
      setStatus(
        Array.isArray(nextLogs)
          ? `Da tai ${nextLogs.length} dong nhat ky.`
          : 'Khong tai duoc nhat ky he thong.'
      )
    }
    setLoadingLogs(false)
  }

  async function refreshPlayers(nextKeyword = keyword, showStatus = true) {
    setLoadingPlayers(true)
    if (showStatus) {
      setStatus('Dang tai danh sach nguoi choi...')
    }

    const nextPlayers = await actions.listAdminPlayers(nextKeyword, 80)
    const safePlayers = Array.isArray(nextPlayers) ? nextPlayers : []
    setPlayers(safePlayers)

    if (!safePlayers.find((player) => player.uid === selectedUid)) {
      const firstUid = safePlayers[0]?.uid || ''
      setSelectedUid(firstUid)
      if (firstUid) {
        void refreshPlayerDetail(firstUid, false)
      } else {
        setSelectedPlayer(null)
      }
    }

    if (showStatus) {
      setStatus(
        safePlayers.length > 0
          ? `Da tai ${safePlayers.length} nguoi choi.`
          : 'Khong tim thay nguoi choi nao.'
      )
    }

    setLoadingPlayers(false)
  }

  async function refreshPlayerDetail(targetUid, showStatus = false) {
    if (!targetUid) {
      setSelectedPlayer(null)
      return
    }

    setDetailLoading(true)
    if (showStatus) {
      setStatus('Dang tai ho so nguoi choi...')
    }

    const detail = await actions.getAdminPlayerDetail(targetUid)
    setSelectedPlayer(detail)

    if (showStatus) {
      setStatus(detail ? `Da tai ho so ${detail.name}.` : 'Khong tai duoc ho so nguoi choi.')
    }
    setDetailLoading(false)
  }

  useEffect(() => {
    void refreshLogs('all', false)
    void refreshPlayers('', false)
  }, [])

  useEffect(() => {
    if (!latestMessage) return
    setStatus(latestMessage)
  }, [latestMessage])

  async function handleSendGift() {
    if (!selectedPlayer?.uid) {
      setStatus('Hay chon mot nguoi choi de gui qua.')
      return
    }

    let reward
    try {
      reward = JSON.parse(giftJson)
    } catch {
      setStatus('Reward JSON khong hop le.')
      return
    }

    setSendingGift(true)
    setStatus(`Dang gui qua cho ${selectedPlayer.name}...`)

    const result = await actions.sendAdminGift(selectedPlayer.uid, reward, giftNote)

    if (result?.ok) {
      setStatus(result.message || `Da gui qua cho ${selectedPlayer.name}.`)
      await refreshPlayerDetail(selectedPlayer.uid, false)
      await refreshPlayers(keyword, false)
      await refreshLogs('all', false)
    } else {
      setStatus(result?.message || 'Khong gui duoc qua cho nguoi choi nay.')
    }

    setSendingGift(false)
  }

  async function handleBroadcastGift() {
    let reward
    try {
      reward = JSON.parse(broadcastJson)
    } catch {
      setStatus('Reward JSON thu toan server khong hop le.')
      return
    }

    setBroadcasting(true)
    setStatus('Dang gui thu toan server...')

    const result = await actions.sendBroadcastSystemMail(reward, broadcastNote)

    if (result?.ok) {
      setStatus(result.message || 'Da gui thu toan server.')
      await refreshLogs('all', false)
    } else {
      setStatus(result?.message || 'Khong gui duoc thu toan server.')
    }

    setBroadcasting(false)
  }

  async function handleToggleBlocked() {
    if (!selectedPlayer?.uid) {
      setStatus('Hay chon mot nguoi choi de khoa mo tai khoan.')
      return
    }

    const nextBlocked = !selectedPlayer.blocked
    setStatus(
      nextBlocked
        ? `Dang khoa tai khoan ${selectedPlayer.name}...`
        : `Dang mo khoa tai khoan ${selectedPlayer.name}...`
    )

    const result = await actions.setPlayerBlocked(selectedPlayer.uid, nextBlocked)

    if (result?.ok) {
      setStatus(result.message || 'Da cap nhat trang thai tai khoan.')
      await refreshPlayerDetail(selectedPlayer.uid, false)
      await refreshPlayers(keyword, false)
      await refreshLogs('all', false)
    } else {
      setStatus(result?.message || 'Khong cap nhat duoc trang thai tai khoan.')
    }
  }

  return (
    <section className="altar-card bag-panel">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Cong cu van hanh</div>
            <h2 className="realm-title" style={{ fontSize: 32 }}>
              QUAN TRI
            </h2>
          </div>
          <div className="realm-stage-pill">
            <span>Audit + Player</span>
            <strong>{players.length} tai khoan</strong>
          </div>
        </div>

        <div className="dual-panel-grid" style={{ alignItems: 'start', marginBottom: 20 }}>
          <div className="mini-panel">
            <div className="mini-panel-title">Tra nguoi choi</div>
            <div className="dao-auth-form">
              <label className="dao-auth-label">Tim theo dao hieu, email, uid</label>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Nhap ten, email hoac uid..."
                className="dao-input dao-auth-input"
              />

              <div className="action-row">
                <button
                  className="dao-btn dao-btn-primary"
                  onClick={() => void refreshPlayers(keyword, true)}
                  disabled={loadingPlayers}
                >
                  {loadingPlayers ? 'Dang tai...' : 'Tai danh sach'}
                </button>
              </div>

              <div className="content-stack" style={{ marginTop: 12 }}>
                {players.length > 0 ? (
                  players.map((player) => (
                    <PlayerSummaryCard
                      key={player.uid}
                      player={player}
                      selected={selectedUid === player.uid}
                      onSelect={(uid) => {
                        setSelectedUid(uid)
                        void refreshPlayerDetail(uid, true)
                      }}
                    />
                  ))
                ) : (
                  <div className="dao-auth-note">Chua co nguoi choi nao trong bo loc nay.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mini-panel">
            <div className="mini-panel-title">Ho so tom tat</div>
            {detailLoading ? (
              <div className="dao-auth-note">Dang tai ho so nguoi choi...</div>
            ) : selectedPlayer ? (
              <div className="content-stack">
                <div className="requirements-list">
                <div>
                  <span>Dao hieu</span>
                  <strong>{selectedPlayer.name}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{selectedPlayer.email || '--'}</strong>
                </div>
                <div>
                  <span>UID</span>
                  <strong>{selectedPlayer.uid}</strong>
                </div>
                <div>
                  <span>Role</span>
                  <strong>{selectedPlayer.role}</strong>
                </div>
                <div>
                  <span>Trang thai tai khoan</span>
                  <strong>{selectedPlayer.blocked ? 'Dang bi khoa' : 'Dang hoat dong'}</strong>
                </div>
                <div>
                  <span>Canh gioi</span>
                  <strong>
                    {selectedPlayer.realm} • Tang {selectedPlayer.stage}
                  </strong>
                </div>
                <div>
                  <span>Sinh luc / Phap luc</span>
                  <strong>
                    {selectedPlayer.hp}/{selectedPlayer.maxHp} • {selectedPlayer.mp}/
                    {selectedPlayer.maxMp}
                  </strong>
                </div>
                <div>
                  <span>Cong / Thu</span>
                  <strong>
                    {selectedPlayer.damage} / {selectedPlayer.defense}
                  </strong>
                </div>
                <div>
                  <span>Linh thach / Duoc thao</span>
                  <strong>
                    {selectedPlayer.spiritStones} / {selectedPlayer.herbs}
                  </strong>
                </div>
                <div>
                  <span>Tui do / Ky nang hoc</span>
                  <strong>
                    {selectedPlayer.inventoryCount} / {selectedPlayer.learnedSkillCount}
                  </strong>
                </div>
                <div>
                  <span>Ky nang trang bi</span>
                  <strong>{selectedPlayer.equippedSkillCount}</strong>
                </div>
                <div>
                  <span>Dang o bi canh</span>
                  <strong>{selectedPlayer.currentDungeonFloor || '--'}</strong>
                </div>
                <div>
                  <span>Session</span>
                  <strong>
                    {selectedPlayer.hasActiveSession ? 'Dang co phien hoat dong' : 'Khong co phien'}
                  </strong>
                </div>
                <div>
                  <span>Phuc loi da nhan</span>
                  <strong>
                    NV {selectedPlayer.welfareMissionClaimCount} • Moc{' '}
                    {selectedPlayer.welfareActivityClaimCount}
                  </strong>
                </div>
                <div>
                  <span>Cap nhat</span>
                  <strong>{formatTime(selectedPlayer.updatedAtMs)}</strong>
                </div>
                <div>
                  <span>Hanh dong cuoi</span>
                  <strong>{formatTime(selectedPlayer.lastActionAtMs)}</strong>
                </div>
                </div>

                <div className="mini-panel" style={{ padding: 16 }}>
                  <div className="mini-panel-title">Quan ly tai khoan</div>
                  <div className="action-row">
                    <button
                      className={`dao-btn ${
                        selectedPlayer.blocked ? 'dao-btn-primary' : 'dao-btn-danger'
                      }`}
                      onClick={() => void handleToggleBlocked()}
                    >
                      {selectedPlayer.blocked ? 'Mo khoa tai khoan' : 'Khoa tai khoan'}
                    </button>
                  </div>
                </div>

                <div className="mini-panel" style={{ padding: 16 }}>
                  <div className="mini-panel-title">Gửi thư quà cho người chơi này</div>
                  <div className="dao-auth-form">
                    <label className="dao-auth-label">Ghi chú admin</label>
                    <input
                      value={giftNote}
                      onChange={(event) => setGiftNote(event.target.value)}
                      className="dao-input dao-auth-input"
                      placeholder="Hỗ trợ từ admin"
                    />

                    <label className="dao-auth-label">Reward JSON</label>
                    <textarea
                      value={giftJson}
                      onChange={(event) => setGiftJson(event.target.value)}
                      className="dao-input dao-auth-input"
                      rows={9}
                      style={{ resize: 'vertical', minHeight: 180 }}
                    />

                    <div className="action-row">
                      <button
                        className="dao-btn dao-btn-danger"
                        onClick={() => void handleSendGift()}
                        disabled={sendingGift}
                      >
                        {sendingGift ? 'Đang gửi thư...' : 'Gửi thư quà ngay'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="dao-auth-note">Hay chon mot nguoi choi de xem ho so.</div>
            )}
          </div>
        </div>

        <div className="mini-panel" style={{ marginBottom: 20 }}>
          <div className="mini-panel-title">Bo loc nhat ky</div>
          <div className="dao-auth-form">
            <label className="dao-auth-label">Nhom log</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="dao-input dao-auth-input"
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <div className="action-row">
              <button
                className="dao-btn dao-btn-primary"
                onClick={() => void refreshLogs(category, true)}
                disabled={loadingLogs}
              >
                {loadingLogs ? 'Dang tai...' : 'Tai lai nhat ky'}
              </button>
            </div>

            <div className="requirements-list">
              {Object.keys(groupedCount).length > 0 ? (
                Object.entries(groupedCount).map(([key, value]) => (
                  <div key={key}>
                    <span>{key}</span>
                    <strong>{value}</strong>
                  </div>
                ))
              ) : (
                <div>
                  <span>Chua co du lieu</span>
                  <strong>0</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mini-panel" style={{ marginBottom: 20 }}>
          <div className="mini-panel-title">Gui thu toan server</div>
          <div className="dao-auth-form">
            <label className="dao-auth-label">Ghi chu su kien</label>
            <input
              value={broadcastNote}
              onChange={(event) => setBroadcastNote(event.target.value)}
              placeholder="Qua su kien toan server"
              className="dao-input dao-auth-input"
            />

            <label className="dao-auth-label">Reward JSON toan server</label>
            <textarea
              value={broadcastJson}
              onChange={(event) => setBroadcastJson(event.target.value)}
              className="dao-input dao-auth-input"
              rows={8}
              style={{ resize: 'vertical', minHeight: 170 }}
            />

            <div className="action-row">
              <button
                className="dao-btn dao-btn-danger"
                onClick={() => void handleBroadcastGift()}
                disabled={broadcasting}
              >
                {broadcasting ? 'Dang gui...' : 'Gui thu toan server'}
              </button>
            </div>
          </div>
        </div>

        <div className="mini-panel">
          <div className="mini-panel-title">Nhat ky gan day</div>
          <div className="content-stack">
            {logs.length > 0 ? (
              logs.map((item) => (
                <div key={item.id} className="inventory-item">
                  <div className="inventory-item-main">
                    <div className="inventory-item-title">
                      [{item.category || 'system'}] {item.summary || item.action}
                    </div>
                    <div className="inventory-item-subtitle">
                      {item.actorName || 'Vo Danh'} | {item.action} | {formatTime(item.createdAtMs)}
                    </div>
                    {formatDetails(item.details) ? (
                      <div className="inventory-item-subtitle">{formatDetails(item.details)}</div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="dao-auth-note">Chua co dong nhat ky nao trong bo loc nay.</div>
            )}
          </div>
        </div>

        {status ? (
          <div className="dao-auth-message" style={{ marginTop: 18 }}>
            {status}
          </div>
        ) : null}
      </div>
    </section>
  )
}

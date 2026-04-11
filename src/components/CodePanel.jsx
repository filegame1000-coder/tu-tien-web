import { useEffect, useState } from 'react'

const defaultRewardJson = `{
  "spiritStones": 5000
}`

function pickMessage(latestMessage, fallback) {
  const normalized = typeof latestMessage === 'string' ? latestMessage.trim() : ''
  return normalized || fallback
}

export default function CodePanel({ player, actions, isAdmin, latestMessage = '' }) {
  const [codeInput, setCodeInput] = useState('')
  const [adminCode, setAdminCode] = useState('TANG-5000-LT')
  const [deleteCodeInput, setDeleteCodeInput] = useState('KHAI-TONG-2026')
  const [maxUses, setMaxUses] = useState('1')
  const [note, setNote] = useState('Tặng 5000 linh thạch')
  const [rewardJson, setRewardJson] = useState(defaultRewardJson)
  const [lastCreatedCode, setLastCreatedCode] = useState('')
  const [status, setStatus] = useState('')
  const [codeList, setCodeList] = useState([])
  const [selectedCode, setSelectedCode] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (!latestMessage) return
    setStatus(latestMessage)
  }, [latestMessage])

  async function refreshCodeList(showStatus = true) {
    if (!isAdmin) return

    if (showStatus) {
      setStatus('Đang tải lại danh sách code...')
    }

    const codes = await actions.listRewardCodes()
    setCodeList(Array.isArray(codes) ? codes : [])

    if (showStatus) {
      setStatus(`Đã tải ${Array.isArray(codes) ? codes.length : 0} code.`)
    }
  }

  useEffect(() => {
    void refreshCodeList(false)
  }, [isAdmin])

  async function handleRedeem() {
    if (!codeInput.trim()) {
      setStatus('Hãy nhập mã trước khi nhận quà.')
      return
    }

    setStatus('Đang kiểm tra mã...')
    const success = await actions.redeemCode(codeInput.trim())

    if (success) {
      setCodeInput('')
      setStatus(pickMessage(latestMessage, 'Nhận mã thành công.'))
      return
    }

    setStatus(pickMessage(latestMessage, 'Sai mã, mã đã hết lượt hoặc bạn đã dùng mã này rồi.'))
  }

  async function handleCreate() {
    let parsedReward

    try {
      parsedReward = JSON.parse(rewardJson)
    } catch {
      setStatus('Reward JSON chưa đúng định dạng.')
      return
    }

    setStatus('Đang tạo code...')
    const result = await actions.createRewardCode({
      code: adminCode,
      maxUses: Number(maxUses) || 1,
      note,
      reward: parsedReward,
    })

    if (result?.code) {
      setLastCreatedCode(result.code)
      setAdminCode(result.code)
      setSelectedCode(result.code)
      setStatus(pickMessage(latestMessage, `Đã tạo code ${result.code}.`))
      await refreshCodeList(false)
      return
    }

    setStatus(pickMessage(latestMessage, 'Tạo code thất bại.'))
  }

  async function handleUpdate() {
    if (!selectedCode) {
      setStatus('Hãy chọn một code trong danh sách để chỉnh sửa.')
      return
    }

    let parsedReward

    try {
      parsedReward = JSON.parse(rewardJson)
    } catch {
      setStatus('Reward JSON chưa đúng định dạng.')
      return
    }

    setStatus('Đang cập nhật code...')
    const result = await actions.updateRewardCode({
      code: selectedCode,
      maxUses: Number(maxUses) || 1,
      note,
      reward: parsedReward,
      active,
    })

    if (result?.ok) {
      setStatus(pickMessage(latestMessage, `Đã cập nhật code ${selectedCode}.`))
      await refreshCodeList(false)
      return
    }

    setStatus(pickMessage(latestMessage, 'Cập nhật code thất bại.'))
  }

  async function handleDelete() {
    if (!deleteCodeInput.trim()) {
      setStatus('Hãy nhập code cần khóa.')
      return
    }

    setStatus('Đang khóa code...')
    const success = await actions.deleteRewardCode(deleteCodeInput.trim())

    if (success) {
      const deletedCode = deleteCodeInput.trim()
      setDeleteCodeInput('')
      setStatus(pickMessage(latestMessage, `Đã khóa code ${deletedCode}.`))
      await refreshCodeList(false)
      return
    }

    setStatus(pickMessage(latestMessage, 'Không khóa được code này.'))
  }

  function handleSelectCode(codeItem) {
    setSelectedCode(codeItem.code)
    setAdminCode(codeItem.code)
    setDeleteCodeInput(codeItem.code)
    setMaxUses(String(codeItem.maxUses || 1))
    setNote(codeItem.note || '')
    setRewardJson(JSON.stringify(codeItem.reward || {}, null, 2))
    setActive(codeItem.active !== false)
    setStatus(`Đang chỉnh sửa code ${codeItem.code}.`)
  }

  return (
    <section className="altar-card bag-panel">
      <div className="altar-frame">
        <div className="altar-header">
          <div>
            <div className="section-kicker">Mật lệnh tông môn</div>
            <h2 className="realm-title" style={{ fontSize: 32 }}>
              MẬT LỆNH
            </h2>
          </div>

          <div className="realm-stage-pill">
            <span>Đạo hữu</span>
            <strong>{player?.name || 'Vô Danh'}</strong>
          </div>
        </div>

        <div className="mini-panel" style={{ marginBottom: 20 }}>
          <div className="mini-panel-title">Nhập code nhận quà</div>
          <div className="dao-auth-form">
            <label className="dao-auth-label">Gift code</label>
            <input
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
              placeholder="Ví dụ: TANG-5000-LT"
              className="dao-input dao-auth-input"
            />
            <button className="dao-btn dao-btn-primary" onClick={handleRedeem}>
              Nhận quà
            </button>
          </div>
        </div>

        {isAdmin ? (
          <div className="content-stack">
            <div className="mini-panel">
              <div className="mini-panel-title">Danh sách code đã tạo</div>
              <div className="dao-auth-form">
                <button className="dao-btn dao-btn-muted" onClick={() => refreshCodeList(true)}>
                  Tải lại danh sách
                </button>

                <div className="content-stack" style={{ marginTop: 12 }}>
                  {codeList.length > 0 ? (
                    codeList.map((codeItem) => (
                      <button
                        key={codeItem.code}
                        className={`dao-btn ${selectedCode === codeItem.code ? 'dao-btn-primary' : 'dao-btn-muted'}`}
                        onClick={() => handleSelectCode(codeItem)}
                      >
                        {codeItem.code} | {codeItem.useCount}/{codeItem.maxUses} |{' '}
                        {codeItem.active ? 'Đang mở' : 'Đã khóa'}
                      </button>
                    ))
                  ) : (
                    <div className="dao-auth-note">Chưa có code nào hoặc chưa tải được danh sách.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mini-panel">
              <div className="mini-panel-title">Khóa/Xóa code admin</div>
              <div className="dao-auth-form">
                <label className="dao-auth-label">Mã code cần khóa</label>
                <input
                  value={deleteCodeInput}
                  onChange={(event) => setDeleteCodeInput(event.target.value.toUpperCase())}
                  placeholder="Ví dụ: KHAI-TONG-2026"
                  className="dao-input dao-auth-input"
                />
                <button className="dao-btn dao-btn-accent" onClick={handleDelete}>
                  Khóa code này
                </button>
              </div>
            </div>

            <div className="mini-panel">
              <div className="mini-panel-title">Tạo / chỉnh sửa code admin</div>

              <div className="dao-auth-form">
                <label className="dao-auth-label">Mã code</label>
                <input
                  value={adminCode}
                  onChange={(event) => setAdminCode(event.target.value.toUpperCase())}
                  placeholder="Bỏ trống để server tự sinh"
                  className="dao-input dao-auth-input"
                />

                <label className="dao-auth-label">Số lượt dùng</label>
                <input
                  value={maxUses}
                  onChange={(event) => setMaxUses(event.target.value)}
                  placeholder="1"
                  className="dao-input dao-auth-input"
                />

                <label className="dao-auth-label">Ghi chú</label>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Ví dụ: quà khai mở server"
                  className="dao-input dao-auth-input"
                />

                <label className="dao-auth-label">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) => setActive(event.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Code đang hoạt động
                </label>

                <label className="dao-auth-label">Reward JSON</label>
                <textarea
                  value={rewardJson}
                  onChange={(event) => setRewardJson(event.target.value)}
                  className="dao-input dao-auth-input"
                  rows={12}
                  style={{ resize: 'vertical', fontFamily: 'monospace' }}
                />

                <div className="dao-auth-note">
                  Mẫu hiện tại đang là code tặng 5000 linh thạch.
                </div>

                <div className="action-row">
                  <button className="dao-btn dao-btn-accent" onClick={handleCreate}>
                    Tạo code
                  </button>
                  <button className="dao-btn dao-btn-primary" onClick={handleUpdate}>
                    Lưu chỉnh sửa
                  </button>
                </div>

                {lastCreatedCode ? (
                  <div className="dao-auth-message">
                    Code vừa tạo: <strong>{lastCreatedCode}</strong>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {status ? (
          <div className="dao-auth-message" style={{ marginTop: 18 }}>
            {status}
          </div>
        ) : null}
      </div>
    </section>
  )
}

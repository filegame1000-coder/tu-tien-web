import { useState } from 'react'

const defaultRewardJson = `{
  "spiritStones": 5000
}`

export default function CodePanel({ player, actions, isAdmin }) {
  const [codeInput, setCodeInput] = useState('')
  const [adminCode, setAdminCode] = useState('TANG-5000-LT')
  const [deleteCodeInput, setDeleteCodeInput] = useState('KHAI-TONG-2026')
  const [maxUses, setMaxUses] = useState('1')
  const [note, setNote] = useState('Tặng 5000 linh thạch')
  const [rewardJson, setRewardJson] = useState(defaultRewardJson)
  const [lastCreatedCode, setLastCreatedCode] = useState('')
  const [status, setStatus] = useState('')

  async function handleRedeem() {
    if (!codeInput.trim()) {
      setStatus('Hãy nhập code trước khi nhận quà.')
      return
    }

    setStatus('Đang kiểm tra code...')
    const success = await actions.redeemCode(codeInput)

    if (success) {
      setCodeInput('')
      setStatus('Nhận code thành công.')
      return
    }

    setStatus('Không nhận được code. Hãy kiểm tra code có tồn tại, còn lượt dùng và frontend đã lên bản mới chưa.')
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
      setStatus(`Đã tạo code ${result.code}.`)
      return
    }

    setStatus('Tạo code thất bại.')
  }

  async function handleDelete() {
    if (!deleteCodeInput.trim()) {
      setStatus('Hãy nhập code cần khóa.')
      return
    }

    setStatus('Đang khóa code...')
    const success = await actions.deleteRewardCode(deleteCodeInput)

    if (success) {
      setDeleteCodeInput('')
      setStatus('Đã khóa code thành công.')
      return
    }

    setStatus('Không khóa được code này.')
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
              <div className="mini-panel-title">Tạo code admin</div>

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

                <button className="dao-btn dao-btn-accent" onClick={handleCreate}>
                  Tạo code
                </button>

                {lastCreatedCode ? (
                  <div className="dao-auth-message">
                    Code vừa tạo: <strong>{lastCreatedCode}</strong>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {status ? <div className="dao-auth-message" style={{ marginTop: 18 }}>{status}</div> : null}
      </div>
    </section>
  )
}

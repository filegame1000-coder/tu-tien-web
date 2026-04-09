import { useState } from 'react'

const defaultRewardJson = `{
  "spiritStones": 500,
  "herbs": 10,
  "consumables": [
    { "itemId": "hp_potion_small", "quantity": 3 }
  ],
  "equipments": [
    { "defId": "wind_boots", "quantity": 1 }
  ],
  "skills": ["ngu_kiem_thuat"],
  "baseStats": {
    "maxHp": 20,
    "damage": 2
  }
}`

export default function CodePanel({ player, actions, isAdmin }) {
  const [codeInput, setCodeInput] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [maxUses, setMaxUses] = useState('1')
  const [note, setNote] = useState('')
  const [rewardJson, setRewardJson] = useState(defaultRewardJson)
  const [lastCreatedCode, setLastCreatedCode] = useState('')

  async function handleRedeem() {
    const success = await actions.redeemCode(codeInput)
    if (success) {
      setCodeInput('')
    }
  }

  async function handleCreate() {
    let parsedReward

    try {
      parsedReward = JSON.parse(rewardJson)
    } catch {
      return
    }

    const result = await actions.createRewardCode({
      code: adminCode,
      maxUses: Number(maxUses) || 1,
      note,
      reward: parsedReward,
    })

    if (result?.code) {
      setLastCreatedCode(result.code)
      setAdminCode('')
      setNote('')
    }
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
              placeholder="Ví dụ: HTDL-KHAI-TONG"
              className="dao-input dao-auth-input"
            />
            <button className="dao-btn dao-btn-primary" onClick={handleRedeem}>
              Nhận quà
            </button>
          </div>
        </div>

        {isAdmin ? (
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
                rows={14}
                style={{ resize: 'vertical', fontFamily: 'monospace' }}
              />

              <div className="dao-auth-note">
                Có thể thưởng linh thạch, dược thảo, consumable, equipment, kỹ năng và
                cộng chỉ số gốc.
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
        ) : null}
      </div>
    </section>
  )
}

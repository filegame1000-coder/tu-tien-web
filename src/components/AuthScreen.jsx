import { useState } from 'react'

export default function AuthScreen({ onConfirm, message, email, onLogout }) {
  const [name, setName] = useState('')

  return (
    <div className="dao-auth-screen">
      <div className="dao-auth-card">
        <div className="section-kicker">Khai mở tiên lộ</div>
        <h1 className="dao-auth-title">HUYỀN THIÊN ĐẠI LỤC</h1>
        <p className="dao-auth-subtitle">
          Tài khoản hiện tại: <strong>{email || 'Ẩn danh'}</strong>
        </p>

        <div className="dao-auth-form">
          <label className="dao-auth-label">Tên nhân vật</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Mặc Trần, Diệp Phàm..."
            className="dao-input dao-auth-input"
            maxLength={20}
          />

          <div className="action-row">
            <button
              className="dao-btn dao-btn-primary dao-auth-button"
              onClick={() => onConfirm(name)}
            >
              Bắt đầu tu luyện
            </button>

            <button
              className="dao-btn dao-btn-accent dao-auth-button"
              onClick={onLogout}
            >
              Đăng xuất
            </button>
          </div>

          <div className="dao-auth-note">
            Tên sẽ được lưu theo tài khoản. Đổi máy vẫn còn.
          </div>

          {message ? <div className="dao-auth-message">{message}</div> : null}
        </div>
      </div>
    </div>
  )
}

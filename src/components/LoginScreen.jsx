import { useState } from 'react'

export default function LoginScreen({
  email,
  password,
  setEmail,
  setPassword,
  onLogin,
  onRegister,
  loading,
  message,
}) {
  const [mode, setMode] = useState('login')

  return (
    <div className="dao-auth-screen">
      <div className="dao-auth-card">
        <div className="section-kicker">Tiên môn nhập thế</div>
        <h1 className="dao-auth-title">THIÊN ĐẠO CÁC</h1>
        <p className="dao-auth-subtitle">
          Đăng nhập để đồng bộ nhân vật của bạn giữa nhiều thiết bị.
        </p>

        <div className="dao-auth-form">
          <label className="dao-auth-label">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="dao-input dao-auth-input"
            autoComplete="email"
          />

          <label className="dao-auth-label">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            className="dao-input dao-auth-input"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          <div className="action-row">
            <button
              className="dao-btn dao-btn-primary dao-auth-button"
              onClick={mode === 'login' ? onLogin : onRegister}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>

            <button
              className="dao-btn dao-btn-accent dao-auth-button"
              onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
              disabled={loading}
            >
              {mode === 'login' ? 'Chuyển sang đăng ký' : 'Chuyển sang đăng nhập'}
            </button>
          </div>

          <div className="dao-auth-note">
            {mode === 'login'
              ? 'Đăng nhập để tiếp tục nhân vật đang chơi.'
              : 'Mỗi tài khoản sẽ có save riêng trên cloud.'}
          </div>

          {message ? <div className="dao-auth-message">{message}</div> : null}
        </div>
      </div>
    </div>
  )
}
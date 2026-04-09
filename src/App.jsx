import { useAuthState } from './hooks/useAuthState'
import { usePlayer } from './hooks/usePlayer'
import PlayerPanel from './components/PlayerPanel'
import DungeonPanel from './components/DungeonPanel'
import HerbGardenPanel from './components/HerbGardenPanel'
import AlchemyPanel from './components/AlchemyPanel'
import GameTabs from './components/GameTabs'
import EquipmentPanel from './components/EquipmentPanel'
import LogPanel from './components/LogPanel'
import BagPanel from './components/BagPanel'
import WorldPanel from './components/WorldPanel'
import AuthScreen from './components/AuthScreen'
import LoginScreen from './components/LoginScreen'
import DongPhuPanel from './components/DongPhuPanel'
import { usePublicPlayers } from './hooks/usePublicPlayers'
import './App.css'

function getMinorStageLabel(exp) {
  const safeExp = Number(exp) || 0
  if (safeExp >= 100) return 'Viên mãn'
  if (safeExp >= 75) return 'Hậu kỳ'
  if (safeExp >= 40) return 'Trung kỳ'
  return 'Sơ kỳ'
}

function getRealmFlavor(realm) {
  const map = {
    'Phàm Nhân': 'Cảm ngộ thiên đạo, rèn thân luyện tâm.',
    'Luyện Khí': 'Hấp thu linh khí, khai mở kinh mạch.',
  }

  return map[realm] || 'Con đường đại đạo vẫn còn rất dài.'
}

function ProgressBar({ value, max = 100, label }) {
  const safeValue = Math.max(0, Number(value) || 0)
  const safeMax = Math.max(1, Number(max) || 1)
  const percent = Math.max(0, Math.min((safeValue / safeMax) * 100, 100))

  return (
    <div className="breakthrough-progress-wrap">
      <div className="breakthrough-progress-meta">
        <span>{label}</span>
        <strong>
          {safeValue} / {safeMax}
        </strong>
      </div>
      <div className="breakthrough-progress">
        <div className="breakthrough-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function CultivationScreen({ player, actions, breakthroughCost, logs, finalStats, actionState }) {
  const exp = Number(player?.exp) || 0
  const stage = Number(player?.stage) || 1
  const realm = player?.realm || 'Phàm Nhân'
  const spiritStones = Number(player?.spiritStones) || 0
  const herbs = Number(player?.herbs) || 0
  const minorStage = getMinorStageLabel(exp)

  return (
    <div className="content-stack">
      <section className="altar-card cultivation-altar">
        <div className="altar-frame">
          <div className="altar-header">
            <div>
              <div className="section-kicker">Cảnh giới hiện tại</div>
              <h1 className="realm-title">{realm.toUpperCase()}</h1>
            </div>
            <div className="realm-stage-pill">
              <span>{minorStage}</span>
              <strong>Tầng {stage}/10</strong>
            </div>
          </div>

          <div className="altar-centerpiece">
            <div className="orbit orbit-outer" />
            <div className="orbit orbit-inner" />
            <div className="orbit-label orbit-top">道</div>
            <div className="orbit-label orbit-right">仙</div>
            <div className="orbit-label orbit-bottom">乾</div>
            <div className="orbit-label orbit-left">元</div>
            <div className="yin-yang-core">☯</div>
          </div>

          <p className="altar-description">{getRealmFlavor(realm)}</p>

          <div className="resource-grid">
            <div className="resource-chip">
              <span>Linh thạch</span>
              <strong>{spiritStones}</strong>
            </div>
            <div className="resource-chip">
              <span>Dược thảo</span>
              <strong>{herbs}</strong>
            </div>
            <div className="resource-chip">
              <span>Sát thương</span>
              <strong>{finalStats?.damage ?? 0}</strong>
            </div>
            <div className="resource-chip">
              <span>Phòng thủ</span>
              <strong>{finalStats?.defense ?? 0}</strong>
            </div>
          </div>

          <ProgressBar value={exp} max={100} label="Tiến độ đột phá" />

          <div className="dual-panel-grid">
            <div className="mini-panel">
              <div className="mini-panel-title">Nhật ký tu luyện</div>
              <LogPanel logs={logs} />
            </div>

            <div className="mini-panel">
              <div className="mini-panel-title">Điều kiện đột phá</div>
              <div className="requirements-list">
                <div>
                  <span>EXP yêu cầu</span>
                  <strong>100</strong>
                </div>
                <div>
                  <span>Linh thạch</span>
                  <strong>{breakthroughCost?.spiritStones ?? 0}</strong>
                </div>
                <div>
                  <span>Dược thảo</span>
                  <strong>{breakthroughCost?.herbs ?? 0}</strong>
                </div>
              </div>

              <div className="action-row">
                <button
                  className="dao-btn dao-btn-primary"
                  onClick={actions.cultivate}
                  disabled={actionState?.isActionLocked}
                >
                  {actionState?.isCultivating ? 'Đang tu luyện...' : 'Tu luyện'}
                </button>
                <button
                  className="dao-btn dao-btn-accent"
                  onClick={actions.breakthrough}
                  disabled={actionState?.isActionLocked}
                >
                  {actionState?.isBreakingThrough ? 'Đang đột phá...' : 'Đột phá'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EquipmentPanel player={player} finalStats={finalStats} actions={actions} />
    </div>
  )
}

function LoadingScreen({ text = 'Đang tải...' }) {
  return (
    <div className="dao-auth-screen">
      <div className="dao-auth-card">
        <h1 className="dao-auth-title">HUYỀN THIÊN ĐẠI LỤC</h1>
        <p className="dao-auth-subtitle">{text}</p>
      </div>
    </div>
  )
}

export default function App() {
  const auth = useAuthState()
  const {
    user,
    ready,
    loading: authLoading,
    message: authMessage,
    email,
    password,
    setEmail,
    setPassword,
    handleLogin,
    handleRegister,
    handleLogout,
  } = auth

  const {
    loading: gameLoading,
    player,
    herbGarden,
    actions,
    breakthroughCost,
    logs,
    combatLogs,
    activeTab,
    dungeon,
    finalStats,
    skills,
    needsInitialNaming,
    message,
    crafting,
    craftingRemainMs,
    actionState,
  } = usePlayer(user)
  const { publicPlayers, loading: playersLoading } = usePublicPlayers(user?.uid)

  if (!ready) {
    return <LoadingScreen text="Đang kết nối hệ thống tài khoản..." />
  }

  if (!user) {
    return (
      <LoginScreen
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        onLogin={handleLogin}
        onRegister={handleRegister}
        loading={authLoading}
        message={authMessage}
      />
    )
  }

  if (gameLoading) {
    return <LoadingScreen text="Đang tải dữ liệu nhân vật..." />
  }

  if (needsInitialNaming) {
    return (
      <AuthScreen
        onConfirm={actions.setInitialName}
        message={message}
        email={user.email}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <div className="dao-app">
      <div className="dao-shell">
        <header className="dao-topbar">
          <div className="back-link">{user.email}</div>
          <h1 className="dao-brand">HUYỀN THIÊN ĐẠI LỤC</h1>
          <button className="dao-btn dao-btn-accent" onClick={handleLogout}>
            Đăng xuất
          </button>
        </header>

        <GameTabs activeTab={activeTab} onChange={actions.setActiveTab} />

        <div className="dao-layout">
          <aside className="left-column">
            <PlayerPanel
              player={player}
              finalStats={finalStats}
              actions={actions}
              actionState={actionState}
            />
          </aside>

          <main className="right-column">
            {activeTab === 'dong-phu' && (
              <DongPhuPanel skills={skills} actions={actions} />
            )}

            {activeTab === 'cultivation' && (
              <CultivationScreen
                player={player}
                actions={actions}
                breakthroughCost={breakthroughCost}
                logs={logs}
                finalStats={finalStats}
                actionState={actionState}
              />
            )}

            {activeTab === 'farm' && (
              <HerbGardenPanel
                player={player}
                herbGarden={herbGarden}
                actions={actions}
              />
            )}

            {activeTab === 'bag' && <BagPanel player={player} actions={actions} />}

            {activeTab === 'alchemy' && (
              <AlchemyPanel
                player={player}
                actions={actions}
                crafting={crafting}
                craftingRemainMs={craftingRemainMs}
              />
            )}

            {activeTab === 'dungeon' && (
              <DungeonPanel
                player={player}
                dungeon={dungeon}
                actions={actions}
                finalStats={finalStats}
                combatLogs={combatLogs}
              />
            )}

            {activeTab === 'thien-ha' && (
              <WorldPanel players={publicPlayers} loading={playersLoading} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

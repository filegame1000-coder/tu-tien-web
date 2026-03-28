import AlchemyPanel from '../components/AlchemyPanel'
import BagPanel from '../components/BagPanel'
import EquipmentPanel from '../components/EquipmentPanel'
import LogPanel from '../components/LogPanel'
import MonsterPanel from '../components/MonsterPanel'
import PlayerPanel from '../components/PlayerPanel'
import StatsPanel from '../components/StatsPanel'

function MenuTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { key: 'cultivate', label: 'Luyện khí' },
    { key: 'bag', label: 'Túi' },
    { key: 'alchemy', label: 'Luyện đan' },
    { key: 'shop', label: 'Shop' },
    { key: 'dungeon', label: 'Bí cảnh' }
  ]

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid',
            borderColor: activeTab === tab.key ? '#818cf8' : '#334155',
            background: activeTab === tab.key ? '#4338ca' : '#1f2937',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default function MainContent({ auth, game }) {
  if (!auth) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          fontFamily: 'Arial'
        }}
      >
        Auth chưa sẵn sàng...
      </div>
    )
  }

  if (!game) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          fontFamily: 'Arial'
        }}
      >
        Game chưa sẵn sàng...
      </div>
    )
  }

  const { user, handleLogout } = auth
  const { state, derived, actions } = game

  if (!state || !derived || !actions) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          fontFamily: 'Arial'
        }}
      >
        Dữ liệu game chưa đầy đủ...
      </div>
    )
  }

  const {
    player,
    log,
    autoTraining,
    currentMonster,
    offlineReward,
    activeTab,
    isMobile
  } = state

  if (!player) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          fontFamily: 'Arial'
        }}
      >
        Player chưa tải xong...
      </div>
    )
  }

  const safeUserEmail = user?.email || 'Chưa có tài khoản'
  const safeLogs = Array.isArray(log) ? log : log ? [log] : []
  const safeSetActiveTab = actions.setActiveTab || (() => {})
  const safeHandleLogout = handleLogout || (() => {})

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
        color: 'white',
        padding: isMobile ? 12 : 24,
        fontFamily: 'Arial'
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          background: '#111827',
          borderRadius: 24,
          padding: isMobile ? 14 : 24,
          boxShadow: '0 0 30px rgba(0,0,0,0.35)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 16
          }}
        >
          <h1 style={{ textAlign: 'center', margin: 0, fontSize: isMobile ? 28 : 42 }}>
            Game Tu Tiên
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 12,
                background: '#0f172a',
                color: '#cbd5e1',
                border: '1px solid #334155'
              }}
            >
              {safeUserEmail}
            </div>

            <button
              onClick={safeHandleLogout}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: 'none',
                background: '#b91c1c',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>

        <MenuTabs activeTab={activeTab} setActiveTab={safeSetActiveTab} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '360px minmax(0, 1fr)',
            gap: 18
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              position: isMobile ? 'static' : 'sticky',
              top: isMobile ? 'auto' : 16,
              alignSelf: 'start'
            }}
          >
            <PlayerPanel
              player={player}
              autoTraining={autoTraining}
              isMobile={isMobile}
              offlineReward={offlineReward}
              derived={derived}
              onCultivate={actions.cultivate}
              onToggleAutoTraining={actions.toggleAutoTraining}
              onBreakthrough={actions.breakthrough}
              onReset={actions.resetSave}
            />

            <LogPanel logs={safeLogs} />

            <EquipmentPanel player={player} onEquip={actions.equip} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {activeTab === 'cultivate' && (
              <StatsPanel
  autoExpPerSecond={1} 
  maxOfflineSeconds={3600}
/>
            )}

            {activeTab === 'bag' && (
              <BagPanel
                player={player}
                isMobile={isMobile}
                onUseHpPotion={actions.useHpPotion}
                onUseMpPotion={actions.useMpPotion}
              />
            )}

            {activeTab === 'alchemy' && (
              <AlchemyPanel
                player={player}
                isMobile={isMobile}
                onCraftPill1={actions.craftPill1}
                onCraftPill2={actions.craftPill2}
              />
            )}

            {activeTab === 'shop' && (
              <MonsterPanel
                mode="shop"
                player={player}
                isMobile={isMobile}
                onBuyHpPotion={actions.buyHpPotion}
                onBuyMpPotion={actions.buyMpPotion}
                onBuyLife={actions.buyLife}
              />
            )}

            {activeTab === 'dungeon' && (
              <MonsterPanel
                mode="dungeon"
                player={player}
                currentMonster={currentMonster}
                onSpawnMonster={actions.spawnMonster}
                onSpawnBoss={actions.spawnBoss}
                onAttackMonster={actions.attackMonster}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
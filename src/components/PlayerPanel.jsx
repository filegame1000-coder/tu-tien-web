import { useState } from 'react'

function ProgressBar({ value, max, color = '#22c55e', background = '#374151' }) {
  const safeMax = max || 1
  const percent = Math.max(0, Math.min((value / safeMax) * 100, 100))

  return (
    <div
      style={{
        width: '100%',
        height: 20,
        background,
        borderRadius: 999,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'width 0.25s ease'
        }}
      />
    </div>
  )
}

export default function PlayerPanel({
  player,
  log,
  autoTraining,
  offlineReward,
  onCultivate,
  onToggleAuto,
  onBreakthrough,
  onCraftPill1,
  onCraftPill2,
  onUseHpPotion,
  onUseMpPotion,
  onBuyHpPotion,
  onBuyMpPotion,
  onBuyLife,
  onResetSave
}) {
  const [showBag, setShowBag] = useState(false)

  const maxHp = player.maxHp || player.hp || 1
  const maxMp = player.maxMp || player.mp || 1

  return (
    <div style={{ background: '#1f2937', borderRadius: 16, padding: 20 }}>
      <h2>Nhân vật</h2>

      <p><strong>{player.realm} - Tầng {player.stage}</strong></p>

      {/* HP */}
      <ProgressBar value={player.hp} max={maxHp} color="#ef4444" />
      <div>{player.hp}/{maxHp}</div>

      {/* MP */}
      <ProgressBar value={player.mp} max={maxMp} color="#3b82f6" />
      <div>{player.mp}/{maxMp}</div>

      {/* EXP */}
      <ProgressBar value={player.exp} max={player.expToNext} color="#eab308" />
      <div>{player.exp}/{player.expToNext}</div>

      <p>Damage: {player.damage}</p>
      <p>Defense: {player.defense}</p>
      <p>❤️ Mạng: {player.lives}</p>

      {/* MỞ TÚI */}
      <button onClick={() => setShowBag(!showBag)}>
        {showBag ? 'Đóng túi' : 'Mở túi'}
      </button>

      {showBag && (
        <>
          {/* 🎒 INVENTORY */}
          <div style={{ marginTop: 10 }}>
            <strong>Túi đồ</strong>
            <div>Linh thạch: {player.spiritStones}</div>
            <div>Thảo dược 1: {player.herb1}</div>
            <div>Thảo dược 2: {player.herb2}</div>
            <div>Đan cấp 1: {player.pill1}</div>
            <div>Đan cấp 2: {player.pill2}</div>
            <div>🧴 Bình máu: {player.hpPotion}</div>
            <div>🔵 Bình MP: {player.mpPotion}</div>
          </div>

          {/* 🧴 DÙNG BÌNH */}
          <div style={{ marginTop: 10 }}>
            <button onClick={onUseHpPotion}>Dùng bình máu</button>
            <button onClick={onUseMpPotion}>Dùng bình MP</button>
          </div>

          {/* 🧪 Luyện đan */}
          <div style={{ marginTop: 10 }}>
            <strong>Luyện đan</strong>
            <button onClick={onCraftPill1}>
              Đan cấp 1 (10 herb + 50 đá)
            </button>
            <button onClick={onCraftPill2}>
              Đan cấp 2 (10 herb2 + 200 đá)
            </button>
          </div>

          {/* 🛒 SHOP */}
          <div style={{ marginTop: 10 }}>
            <strong>Shop</strong>
            <button onClick={onBuyHpPotion}>Bình máu (5)</button>
            <button onClick={onBuyMpPotion}>Bình MP (5)</button>
            <button onClick={onBuyLife}>+1 mạng (1000)</button>
          </div>
        </>
      )}

      {/* ACTION */}
      <div style={{ marginTop: 10 }}>
        <button onClick={onCultivate}>Tu luyện</button>
        <button onClick={onToggleAuto}>
          {autoTraining ? 'Auto ON' : 'Auto OFF'}
        </button>
        <button onClick={onBreakthrough}>Đột phá</button>
        <button onClick={onResetSave}>Reset</button>
      </div>

      {/* LOG */}
      <div style={{ marginTop: 10 }}>
        <strong>Log:</strong>
        <div>{log}</div>
      </div>
    </div>
  )
}
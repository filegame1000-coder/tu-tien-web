function ProgressBar({ value, max, color = '#ef4444', background = '#374151' }) {
  const safeMax = max || 1
  const percent = Math.max(0, Math.min((value / safeMax) * 100, 100))

  return (
    <div
      style={{
        width: '100%',
        height: 22,
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

export default function MonsterPanel({
  monster,
  onSpawnMonster,
  onSpawnBoss,
  onAttackMonster,
  combatBusy
}) {
  return (
    <div
      style={{
        background: '#1f2937',
        borderRadius: 16,
        padding: 20,
        marginTop: 24
      }}
    >
      <h2 style={{ marginTop: 0 }}>Khu vực chiến đấu</h2>

      {!monster ? (
        <>
          <p>Hiện chưa có quái nào xuất hiện.</p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={onSpawnMonster}
              disabled={combatBusy}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#dc2626',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Tìm quái
            </button>

            <button
              onClick={onSpawnBoss}
              disabled={combatBusy}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#7c3aed',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Gọi Boss
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            <strong>Tên:</strong> {monster.name}
          </p>
          <p>
            <strong>Loại:</strong> {monster.isBoss ? 'Boss' : 'Quái thường'}
          </p>
          <p>
            <strong>Cảnh giới:</strong> {monster.realm} tầng {monster.stage}
          </p>

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>{monster.isBoss ? 'HP Boss' : 'HP Quái'}</span>
              <span>{monster.currentHp}/{monster.hp}</span>
            </div>
            <ProgressBar
              value={monster.currentHp}
              max={monster.hp}
              color={monster.isBoss ? '#a855f7' : '#ef4444'}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <p><strong>Công:</strong> {monster.attack}</p>
            <p><strong>Thủ:</strong> {monster.defense}</p>
            <p><strong>Thưởng:</strong> {monster.expReward} EXP</p>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <button
              onClick={onAttackMonster}
              disabled={combatBusy}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#b91c1c',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Tấn công
            </button>

            <button
              onClick={onSpawnMonster}
              disabled={combatBusy}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#374151',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Đổi quái
            </button>

            <button
              onClick={onSpawnBoss}
              disabled={combatBusy}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#6d28d9',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Đổi sang Boss
            </button>
          </div>
        </>
      )}
    </div>
  )
}
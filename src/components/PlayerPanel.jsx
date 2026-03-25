import OfflineReward from './OfflineReward'

export default function PlayerPanel({
  player,
  log,
  expPercent,
  autoTraining,
  offlineReward,
  onCultivate,
  onToggleAuto,
  onResetSave
}) {
  return (
    <div
      style={{
        background: '#1f2937',
        borderRadius: 16,
        padding: 24,
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: 120, marginBottom: 12 }}>🧘</div>

      <h2>
        {player.realm} tầng {player.stage}
      </h2>

      <p style={{ color: '#cbd5e1', minHeight: 24 }}>{log}</p>

      <OfflineReward offlineReward={offlineReward} />

      <div style={{ marginTop: 20 }}>
        <div
          style={{
            width: '100%',
            height: 20,
            background: '#374151',
            borderRadius: 999,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${expPercent}%`,
              height: '100%',
              background: '#22c55e',
              transition: 'width 0.2s ease'
            }}
          />
        </div>
        <p style={{ marginTop: 8 }}>
          EXP: {player.exp} / {player.expToNext}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: 20
        }}
      >
        <button
          onClick={onCultivate}
          style={{
            padding: '14px 28px',
            background: '#22c55e',
            color: '#0f172a',
            border: 'none',
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Tu luyện
        </button>

        <button
          onClick={onToggleAuto}
          style={{
            padding: '14px 28px',
            background: autoTraining ? '#ef4444' : '#38bdf8',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {autoTraining ? 'Dừng auto' : 'Auto tu luyện'}
        </button>
      </div>

      <button
        onClick={onResetSave}
        style={{
          marginTop: 14,
          padding: '12px 20px',
          background: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          cursor: 'pointer'
        }}
      >
        Xóa dữ liệu lưu
      </button>

      <p style={{ marginTop: 14, color: '#94a3b8', fontSize: 14 }}>
        Trạng thái auto: <b>{autoTraining ? 'ĐANG BẬT' : 'ĐANG TẮT'}</b>
      </p>
    </div>
  )
}
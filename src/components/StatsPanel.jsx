export default function StatsPanel({
  autoExpPerSecond = 0,
  maxOfflineSeconds = 0
}) {
  const safeAutoExpPerSecond = Number(autoExpPerSecond) || 0
  const safeMaxOfflineSeconds = Number(maxOfflineSeconds) || 0

  const offlineHours = Math.floor(safeMaxOfflineSeconds / 3600)
  const offlineMinutes = Math.floor((safeMaxOfflineSeconds % 3600) / 60)
  const offlineSeconds = safeMaxOfflineSeconds % 60

  const offlineText = [
    offlineHours > 0 ? `${offlineHours} giờ` : '',
    offlineMinutes > 0 ? `${offlineMinutes} phút` : '',
    offlineSeconds > 0 ? `${offlineSeconds} giây` : ''
  ]
    .filter(Boolean)
    .join(' ')

  function StatRow({ label, value }) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          padding: '10px 0',
          borderBottom: '1px solid #334155'
        }}
      >
        <span style={{ color: '#cbd5e1' }}>{label}</span>
        <strong style={{ color: 'white', textAlign: 'right' }}>{value}</strong>
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#1f2937',
        borderRadius: 16,
        padding: 20,
        border: '1px solid #334155',
        color: 'white'
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 14 }}>Thông tin tu luyện</h2>

      <div
        style={{
          padding: 12,
          borderRadius: 12,
          background: '#0f172a',
          border: '1px solid #334155',
          marginBottom: 16,
          color: '#cbd5e1',
          lineHeight: 1.6
        }}
      >
        Khu này hiển thị các thông số hỗ trợ tu luyện tự động và phần thưởng offline.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <StatRow
          label="EXP tự động / giây"
          value={`${safeAutoExpPerSecond}`}
        />

        <StatRow
          label="Giới hạn offline"
          value={offlineText || '0 giây'}
        />
      </div>
    </div>
  )
}
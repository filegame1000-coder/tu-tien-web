export default function OfflineReward({ offlineReward }) {
  if (!offlineReward || offlineReward.exp <= 0) return null

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        background: '#312e81',
        color: '#e0e7ff',
        fontSize: 14
      }}
    >
      Offline reward: +{offlineReward.exp} EXP sau {offlineReward.seconds} giây vắng mặt
    </div>
  )
}
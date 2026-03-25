export default function StatsPanel({ player }) {
  return (
    <div
      style={{
        background: '#1f2937',
        borderRadius: 16,
        padding: 24
      }}
    >
      <h2>Chỉ số nhân vật</h2>

      <div style={{ lineHeight: 2, fontSize: 18 }}>
        <div>Damage: {player.damage}</div>
        <div>HP: {player.hp}</div>
        <div>Defense: {player.defense}</div>
        <div>MP: {player.mp}</div>
        <div>Crit Rate: {(player.critRate * 100).toFixed(0)}%</div>
        <div>Crit Damage: {(player.critDamage * 100).toFixed(0)}%</div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Thiết kế hiện tại</h3>
        <div style={{ color: '#cbd5e1', lineHeight: 1.8 }}>
          <div>• Phàm Nhân: tầng 1 đến 10, mỗi tầng 100 EXP</div>
          <div>• Luyện Khí: tầng 1 đến 10, mỗi tầng 1000 EXP</div>
          <div>• Auto tu luyện: 1 EXP / giây</div>
          <div>• Offline tu luyện: 1 EXP / giây</div>
          <div>• Giới hạn offline reward: 8 giờ</div>
        </div>
      </div>
    </div>
  )
}
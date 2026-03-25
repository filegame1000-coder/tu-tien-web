export default function EquipmentPanel({ player }) {
  const slotStyle = {
    background: '#0f172a',
    padding: 10,
    borderRadius: 10,
    textAlign: 'center'
  }

  return (
    <div style={{
      marginTop: 16,
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 10
    }}>
      <div style={slotStyle}>👕 Áo</div>
      <div style={slotStyle}>👖 Quần</div>
      <div style={slotStyle}>👟 Giày</div>
      <div style={slotStyle}>⚔️ Vũ khí</div>
      <div style={slotStyle}>🔮 Pháp bảo</div>
      <div style={slotStyle}>🐎 Thú cưỡi</div>
      <div style={slotStyle}>🐾 Pet</div>
      <div style={slotStyle}>📜 Phù</div>
    </div>
  )
}
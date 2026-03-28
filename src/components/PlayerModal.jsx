import { useState } from 'react'

export default function PlayerModal({ player, onRename, onClose }) {
  const [name, setName] = useState(player.name)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#1f2937',
        padding: 20,
        borderRadius: 12,
        width: 300
      }}>
        <h3>Đổi tên nhân vật</h3>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: 10 }}
        />

        <div style={{ marginTop: 10 }}>
          <button onClick={() => onRename(name)}>Xác nhận (1000 linh thạch)</button>
          <button onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  )
}
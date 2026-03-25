export default function BagPanel({ player, onUseHpPotion, onUseMpPotion }) {
  return (
    <div>
      <h3>Túi đồ</h3>

      <p>💰 {player.spiritStones}</p>
      <p>🌿 {player.herb1}</p>
      <p>🌿2 {player.herb2}</p>

      <p>🧴 HP: {player.hpPotion}</p>
      <p>🔵 MP: {player.mpPotion}</p>

      <button onClick={onUseHpPotion}>Dùng HP</button>
      <button onClick={onUseMpPotion}>Dùng MP</button>
    </div>
  )
}
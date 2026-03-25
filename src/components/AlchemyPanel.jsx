export default function AlchemyPanel({ onCraftPill1, onCraftPill2 }) {
  return (
    <div>
      <h3>Luyện đan</h3>

      <button onClick={onCraftPill1}>
        Đan cấp 1
      </button>

      <button onClick={onCraftPill2}>
        Đan cấp 2
      </button>
    </div>
  )
}
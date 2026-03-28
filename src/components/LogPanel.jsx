export default function LogPanel({ logs }) {
  const safeLogs = Array.isArray(logs) ? logs : []

  if (safeLogs.length === 0) {
    return <div className="log-empty">Chưa có cảm ngộ mới.</div>
  }

  return (
    <div className="log-panel">
      {safeLogs.slice().reverse().map((log, index) => (
        <div key={`${log}-${index}`} className="log-line">
          {index === 0 ? '➤ ' : '• '} {log}
        </div>
      ))}
    </div>
  )
}

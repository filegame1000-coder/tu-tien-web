import { useCallback, useState } from 'react'

export function useGameLog(initialData = {}) {
  const initialMessage = initialData.message || 'Bắt đầu con đường tu luyện.'
  const initialLogs =
    Array.isArray(initialData.logs) && initialData.logs.length > 0
      ? initialData.logs
      : ['Bắt đầu con đường tu luyện.']

  const [message, setMessage] = useState(initialMessage)
  const [logs, setLogs] = useState(initialLogs)

  const pushLog = useCallback((text) => {
    setLogs((prev) => [text, ...prev].slice(0, 20))
    setMessage(text)
  }, [])

  return {
    message,
    logs,
    pushLog,
    setMessage,
    setLogs,
  }
}
import { useCallback, useState } from 'react'

export function useCombatLog() {
  const [logs, setLogs] = useState([])

  const pushCombatLog = useCallback((text) => {
    setLogs((prev) => [...prev, text].slice(-40))
  }, [])

  const clearCombatLog = useCallback(() => {
    setLogs([])
  }, [])

  return {
    combatLogs: logs,
    pushCombatLog,
    clearCombatLog,
  }
}
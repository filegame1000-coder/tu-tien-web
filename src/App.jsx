import { useEffect, useState } from 'react'
import PlayerPanel from './components/PlayerPanel'
import StatsPanel from './components/StatsPanel'
import { clearGameSave, loadGame, saveGame } from './utils/save'
import {
  applyExpGain,
  AUTO_EXP_PER_SECOND,
  createDefaultPlayer,
  MAX_OFFLINE_SECONDS,
  OFFLINE_EXP_PER_SECOND
} from './systems/cultivation'

export default function App() {
  const [player, setPlayer] = useState(createDefaultPlayer)
  const [log, setLog] = useState('Bắt đầu con đường tu luyện...')
  const [autoTraining, setAutoTraining] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [offlineReward, setOfflineReward] = useState({
    seconds: 0,
    exp: 0
  })

  function cultivate(amount = 1, source = '') {
    setPlayer((prev) => {
      const result = applyExpGain(prev, amount, source)
      setLog(result.message)
      return result.player
    })
  }

  function handleCultivate() {
    cultivate(1, 'Tu luyện')
  }

  function handleToggleAutoTraining() {
    setAutoTraining((prev) => !prev)
  }

  function handleResetSave() {
    const confirmReset = window.confirm('Bạn có chắc muốn xóa toàn bộ dữ liệu tu luyện không?')
    if (!confirmReset) return

    clearGameSave()
    setAutoTraining(false)
    setPlayer(createDefaultPlayer())
    setOfflineReward({ seconds: 0, exp: 0 })
    setLog('Đã xóa dữ liệu. Bắt đầu lại từ Phàm Nhân tầng 1.')
  }

  useEffect(() => {
    const savedData = loadGame()

    if (savedData) {
      let loadedPlayer = savedData.player || createDefaultPlayer()
      let loadedAutoTraining =
        typeof savedData.autoTraining === 'boolean' ? savedData.autoTraining : false
      let loadedLog = savedData.log || 'Đã tải dữ liệu tu luyện trước đó.'

      if (savedData.lastSeenAt) {
        const now = Date.now()
        const offlineMs = now - savedData.lastSeenAt
        const offlineSecondsRaw = Math.floor(offlineMs / 1000)
        const offlineSeconds = Math.max(
          0,
          Math.min(offlineSecondsRaw, MAX_OFFLINE_SECONDS)
        )

        if (offlineSeconds > 0) {
          const offlineExp = offlineSeconds * OFFLINE_EXP_PER_SECOND
          const result = applyExpGain(
            loadedPlayer,
            offlineExp,
            'Offline tu luyện'
          )

          loadedPlayer = result.player
          loadedLog = `Bạn đã offline ${offlineSeconds} giây và nhận ${offlineExp} EXP.`
          setOfflineReward({
            seconds: offlineSeconds,
            exp: offlineExp
          })
        }
      }

      setPlayer(loadedPlayer)
      setAutoTraining(loadedAutoTraining)
      setLog(loadedLog)
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    saveGame({
      player,
      autoTraining,
      log,
      lastSeenAt: Date.now()
    })
  }, [player, autoTraining, log, isLoaded])

  useEffect(() => {
    if (!autoTraining) return

    const interval = setInterval(() => {
      cultivate(AUTO_EXP_PER_SECOND, 'Tự động tu luyện')
    }, 1000)

    return () => clearInterval(interval)
  }, [autoTraining])

  useEffect(() => {
    if (!isLoaded) return

    const handleBeforeUnload = () => {
      saveGame({
        player,
        autoTraining,
        log,
        lastSeenAt: Date.now()
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [player, autoTraining, log, isLoaded])

  const expPercent = Math.min((player.exp / player.expToNext) * 100, 100)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        fontFamily: 'Arial'
      }}
    >
      <div
        style={{
          width: 960,
          background: '#111827',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 0 30px rgba(0,0,0,0.35)'
        }}
      >
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>
          Game Tu Tiên - Bản Khung
        </h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24
          }}
        >
          <PlayerPanel
            player={player}
            log={log}
            expPercent={expPercent}
            autoTraining={autoTraining}
            offlineReward={offlineReward}
            onCultivate={handleCultivate}
            onToggleAuto={handleToggleAutoTraining}
            onResetSave={handleResetSave}
          />

          <StatsPanel player={player} />
        </div>
      </div>
    </div>
  )
}
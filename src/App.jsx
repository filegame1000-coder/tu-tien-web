import { useEffect, useState } from 'react'

const REALMS = {
  MORTAL: 'Phàm Nhân',
  QI: 'Luyện Khí'
}

const SAVE_KEY = 'tu-tien-save-v2'
const AUTO_EXP_PER_SECOND = 1
const OFFLINE_EXP_PER_SECOND = 1
const MAX_OFFLINE_SECONDS = 8 * 60 * 60

function getRequiredExp(realm) {
  if (realm === REALMS.MORTAL) return 100
  if (realm === REALMS.QI) return 1000
  return 999999
}

function getNextRealm(currentRealm, currentStage) {
  if (currentRealm === REALMS.MORTAL && currentStage >= 10) {
    return {
      realm: REALMS.QI,
      stage: 1,
      expToNext: getRequiredExp(REALMS.QI),
      message: 'Chúc mừng! Bạn đã đột phá lên Luyện Khí tầng 1!'
    }
  }

  return null
}

function createDefaultPlayer() {
  return {
    realm: REALMS.MORTAL,
    stage: 1,
    exp: 0,
    expToNext: 100,
    damage: 1,
    hp: 100,
    defense: 0,
    mp: 50,
    critRate: 0.05,
    critDamage: 1.5
  }
}

function increaseStats(oldPlayer) {
  return {
    ...oldPlayer,
    damage: oldPlayer.damage + 1,
    hp: oldPlayer.hp + 20,
    defense: oldPlayer.defense + 1,
    mp: oldPlayer.mp + 20,
    critRate: +(oldPlayer.critRate + 0.01).toFixed(2),
    critDamage: +(oldPlayer.critDamage + 0.05).toFixed(2)
  }
}

function applyExpGain(player, amount, source = '') {
  let updated = {
    ...player,
    exp: player.exp + amount
  }

  let message = source ? `${source} +${amount} EXP` : `+${amount} EXP`

  while (updated.exp >= updated.expToNext) {
    updated.exp -= updated.expToNext

    const nextRealmData = getNextRealm(updated.realm, updated.stage)

    if (nextRealmData) {
      updated = increaseStats(updated)
      updated = {
        ...updated,
        realm: nextRealmData.realm,
        stage: nextRealmData.stage,
        expToNext: nextRealmData.expToNext
      }
      message = nextRealmData.message
    } else {
      updated = increaseStats(updated)
      updated = {
        ...updated,
        stage: updated.stage + 1,
        expToNext: getRequiredExp(updated.realm)
      }
      message = `Đã đột phá ${updated.realm} tầng ${updated.stage}!`
    }

    if (updated.realm === REALMS.QI && updated.stage > 10) {
      updated.stage = 10
      updated.exp = updated.expToNext
      message = 'Bạn đã đạt giới hạn hiện tại của bản thử nghiệm.'
      break
    }
  }

  return {
    player: updated,
    message
  }
}

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

    localStorage.removeItem(SAVE_KEY)
    setAutoTraining(false)
    setPlayer(createDefaultPlayer())
    setOfflineReward({ seconds: 0, exp: 0 })
    setLog('Đã xóa dữ liệu. Bắt đầu lại từ Phàm Nhân tầng 1.')
  }

  useEffect(() => {
    const savedData = localStorage.getItem(SAVE_KEY)

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)

        let loadedPlayer = parsed.player || createDefaultPlayer()
        let loadedAutoTraining =
          typeof parsed.autoTraining === 'boolean' ? parsed.autoTraining : false
        let loadedLog = parsed.log || 'Đã tải dữ liệu tu luyện trước đó.'

        if (parsed.lastSeenAt) {
          const now = Date.now()
          const offlineMs = now - parsed.lastSeenAt
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
      } catch (error) {
        console.error('Lỗi đọc dữ liệu lưu:', error)
        setLog('Không đọc được dữ liệu cũ, đã dùng dữ liệu mặc định.')
      }
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    const saveData = {
      player,
      autoTraining,
      log,
      lastSeenAt: Date.now()
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
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
      const saveData = {
        player,
        autoTraining,
        log,
        lastSeenAt: Date.now()
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
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
          <div
            style={{
              background: '#1f2937',
              borderRadius: 16,
              padding: 24,
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 120, marginBottom: 12 }}>🧘</div>
            <h2>
              {player.realm} tầng {player.stage}
            </h2>

            <p style={{ color: '#cbd5e1', minHeight: 24 }}>{log}</p>

            {offlineReward.exp > 0 && (
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
            )}

            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  width: '100%',
                  height: 20,
                  background: '#374151',
                  borderRadius: 999,
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${expPercent}%`,
                    height: '100%',
                    background: '#22c55e',
                    transition: 'width 0.2s ease'
                  }}
                />
              </div>
              <p style={{ marginTop: 8 }}>
                EXP: {player.exp} / {player.expToNext}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginTop: 20
              }}
            >
              <button
                onClick={handleCultivate}
                style={{
                  padding: '14px 28px',
                  background: '#22c55e',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 18,
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Tu luyện
              </button>

              <button
                onClick={handleToggleAutoTraining}
                style={{
                  padding: '14px 28px',
                  background: autoTraining ? '#ef4444' : '#38bdf8',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 18,
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {autoTraining ? 'Dừng auto' : 'Auto tu luyện'}
              </button>
            </div>

            <button
              onClick={handleResetSave}
              style={{
                marginTop: 14,
                padding: '12px 20px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                cursor: 'pointer'
              }}
            >
              Xóa dữ liệu lưu
            </button>

            <p style={{ marginTop: 14, color: '#94a3b8', fontSize: 14 }}>
              Trạng thái auto: <b>{autoTraining ? 'ĐANG BẬT' : 'ĐANG TẮT'}</b>
            </p>
          </div>

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
        </div>
      </div>
    </div>
  )
}
import { useEffect, useMemo, useState } from 'react'
import { auth, db } from './firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { clearGameSave, loadGame, saveGame } from './utils/save'
import {
  applyExpGain,
  AUTO_EXP_PER_SECOND,
  createDefaultPlayer,
  MAX_OFFLINE_SECONDS,
  OFFLINE_EXP_PER_SECOND,
  tryBreakthrough
} from './systems/cultivation'
import {
  generateMonster,
  generateBoss,
  getMonsterDrops
} from './systems/monsters'
import { attackMonster, attackPlayer } from './systems/combat'
import { equipItem, getEquippedBonuses } from './systems/equipment'

async function saveToCloud(data) {
  const user = auth.currentUser
  if (!user) return

  await setDoc(
    doc(db, 'users', user.uid),
    {
      email: user.email || '',
      ...data,
      updatedAt: Date.now()
    },
    { merge: true }
  )
}

function ProgressBar({ value, max, color = '#22c55e', track = '#374151', height = 16 }) {
  const safeMax = max || 1
  const percent = Math.max(0, Math.min((value / safeMax) * 100, 100))

  return (
    <div
      style={{
        width: '100%',
        height,
        background: track,
        borderRadius: 999,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'width 0.25s ease'
        }}
      />
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 18,
        padding: 16
      }}
    >
      {title ? (
        <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 20 }}>
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  )
}

function StatLine({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '6px 0',
        borderBottom: '1px solid rgba(148,163,184,0.12)'
      }}
    >
      <span style={{ color: '#cbd5e1' }}>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function MenuTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { key: 'cultivate', label: 'Luyện khí' },
    { key: 'bag', label: 'Túi' },
    { key: 'alchemy', label: 'Luyện đan' },
    { key: 'shop', label: 'Shop' },
    { key: 'dungeon', label: 'Bí cảnh' }
  ]

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 20
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid',
            borderColor: activeTab === tab.key ? '#818cf8' : '#334155',
            background: activeTab === tab.key ? '#4338ca' : '#1f2937',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function EquipmentGrid({ player, onEquip }) {
  const eq = player.equipment || {}
  const inv = player.inventory || {}

  const itemName = {
    weapon1: 'Vũ khí cấp 1 (+3 công)',
    armor1: 'Áo cấp 1 (+2 thủ)',
    pants1: 'Quần cấp 1 (+20 HP)',
    boots1: 'Giày cấp 1 (+20 HP)'
  }

  const slots = [
    { key: 'weapon', label: 'Vũ khí', item: 'weapon1' },
    { key: 'armor', label: 'Áo', item: 'armor1' },
    { key: 'pants', label: 'Quần', item: 'pants1' },
    { key: 'boots', label: 'Giày', item: 'boots1' },
    { key: 'artifact', label: 'Pháp bảo' },
    { key: 'mount', label: 'Thú cưỡi' },
    { key: 'pet', label: 'Pet' },
    { key: 'talisman', label: 'Phù' }
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10
      }}
    >
      {slots.map((slot) => (
        <div
          key={slot.key}
          style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 12,
            padding: 12,
            color: '#e2e8f0',
            minHeight: 88,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 8
          }}
        >
          <div style={{ fontWeight: 700 }}>{slot.label}</div>
          <div style={{ color: '#cbd5e1', minHeight: 24 }}>
            {eq[slot.key] ? itemName[eq[slot.key]] || eq[slot.key] : 'Trống'}
          </div>

          {slot.item && (inv[slot.item] || 0) > 0 ? (
            <button
              onClick={() => onEquip(slot.item)}
              style={{
                padding: '8px 10px',
                borderRadius: 10,
                border: 'none',
                background: '#2563eb',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Trang bị
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function ActionButton({ children, onClick, background = '#2563eb', full = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 14px',
        borderRadius: 12,
        border: 'none',
        background,
        color: 'white',
        cursor: 'pointer',
        fontWeight: 700,
        width: full ? '100%' : 'auto'
      }}
    >
      {children}
    </button>
  )
}

function AuthScreen({
  email,
  password,
  setEmail,
  setPassword,
  authMessage,
  authLoading,
  handleLogin,
  handleRegister
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: 'Arial'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#111827',
          borderRadius: 24,
          padding: 24,
          boxShadow: '0 0 30px rgba(0,0,0,0.35)',
          border: '1px solid #334155'
        }}
      >
        <h1 style={{ marginTop: 0, textAlign: 'center', marginBottom: 10 }}>
          Game Tu Tiên
        </h1>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 24 }}>
          Đăng ký hoặc đăng nhập để lưu dữ liệu online
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px solid #334155',
              background: '#0f172a',
              color: 'white',
              outline: 'none'
            }}
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Mật khẩu"
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px solid #334155',
              background: '#0f172a',
              color: 'white',
              outline: 'none'
            }}
          />

          <button
            onClick={handleLogin}
            disabled={authLoading}
            style={{
              padding: 12,
              borderRadius: 12,
              border: 'none',
              background: '#2563eb',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            {authLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>

          <button
            onClick={handleRegister}
            disabled={authLoading}
            style={{
              padding: 12,
              borderRadius: 12,
              border: 'none',
              background: '#16a34a',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            {authLoading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>

          {authMessage ? (
            <div
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: 12,
                background: '#0f172a',
                color: '#cbd5e1',
                lineHeight: 1.5
              }}
            >
              {authMessage}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [player, setPlayer] = useState(createDefaultPlayer)
  const [log, setLog] = useState('Bắt đầu con đường tu luyện...')
  const [autoTraining, setAutoTraining] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [combatBusy, setCombatBusy] = useState(false)
  const [currentMonster, setCurrentMonster] = useState(null)
  const [offlineReward, setOfflineReward] = useState({
    seconds: 0,
    exp: 0
  })
  const [activeTab, setActiveTab] = useState('cultivate')
  const [isMobile, setIsMobile] = useState(false)

  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthReady(true)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const syncScreen = () => {
      setIsMobile(window.innerWidth < 900)
    }

    syncScreen()
    window.addEventListener('resize', syncScreen)
    return () => window.removeEventListener('resize', syncScreen)
  }, [])

  async function handleRegister() {
    if (!email || !password) {
      setAuthMessage('Vui lòng nhập email và mật khẩu.')
      return
    }

    try {
      setAuthLoading(true)
      setAuthMessage('')

      const result = await createUserWithEmailAndPassword(auth, email, password)

      const starterData = {
        player: createDefaultPlayer(),
        autoTraining: false,
        currentMonster: null,
        log: 'Tạo tài khoản thành công. Bắt đầu con đường tu luyện...',
        lastSeenAt: Date.now()
      }

      await setDoc(
        doc(db, 'users', result.user.uid),
        {
          email: result.user.email || '',
          ...starterData,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        { merge: true }
      )

      saveGame(starterData)
      setPlayer(starterData.player)
      setAutoTraining(false)
      setCurrentMonster(null)
      setLog(starterData.log)
      setOfflineReward({ seconds: 0, exp: 0 })
      setIsLoaded(true)
      setAuthMessage('Đăng ký thành công.')
    } catch (error) {
      setAuthMessage(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      setAuthMessage('Vui lòng nhập email và mật khẩu.')
      return
    }

    try {
      setAuthLoading(true)
      setAuthMessage('')
      await signInWithEmailAndPassword(auth, email, password)
      setAuthMessage('Đăng nhập thành công.')
    } catch (error) {
      setAuthMessage(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleLogout() {
    await signOut(auth)
    setAuthMessage('')
    setEmail('')
    setPassword('')
  }

  const equippedBonuses = getEquippedBonuses(player)
  const finalDamage = (player.damage || 0) + equippedBonuses.damage
  const finalDefense = (player.defense || 0) + equippedBonuses.defense
  const finalMaxHp = (player.maxHp || 0) + equippedBonuses.maxHp
  const finalHp = Math.min(player.hp || 0, finalMaxHp)

  const lifeRegenText = useMemo(() => {
    if ((player.lives || 0) >= 5) return 'Đầy mạng'
    const now = Date.now()
    const diff = now - (player.lastLifeRegen || now)
    const remainMs = Math.max(0, 60 * 60 * 1000 - diff)
    const totalSeconds = Math.floor(remainMs / 1000)
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
    const seconds = String(totalSeconds % 60).padStart(2, '0')
    return `${minutes}:${seconds} hồi 1 mạng`
  }, [player.lives, player.lastLifeRegen, log])

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

  function handleBreakthrough() {
    const result = tryBreakthrough(player)
    setPlayer(result.player)
    setLog(result.message)
  }

  function handleCraftPill1() {
    if ((player.herb1 || 0) < 10) {
      setLog('Không đủ thảo dược nhất phẩm.')
      return
    }

    if ((player.spiritStones || 0) < 50) {
      setLog('Không đủ linh thạch.')
      return
    }

    setPlayer((prev) => ({
      ...prev,
      herb1: (prev.herb1 || 0) - 10,
      spiritStones: (prev.spiritStones || 0) - 50,
      pill1: (prev.pill1 || 0) + 1
    }))

    setLog('Luyện thành công 1 Phá Cảnh Đan cấp 1!')
  }

  function handleCraftPill2() {
    if ((player.herb2 || 0) < 10) {
      setLog('Không đủ thảo dược nhị phẩm.')
      return
    }

    if ((player.spiritStones || 0) < 200) {
      setLog('Không đủ linh thạch.')
      return
    }

    setPlayer((prev) => ({
      ...prev,
      herb2: (prev.herb2 || 0) - 10,
      spiritStones: (prev.spiritStones || 0) - 200,
      pill2: (prev.pill2 || 0) + 1
    }))

    setLog('Luyện thành công 1 Phá Cảnh Đan cấp 2!')
  }

  function handleBuyHpPotion() {
    if ((player.spiritStones || 0) < 5) {
      setLog('Không đủ linh thạch.')
      return
    }

    setPlayer((prev) => ({
      ...prev,
      spiritStones: (prev.spiritStones || 0) - 5,
      hpPotion: (prev.hpPotion || 0) + 1
    }))

    setLog('Mua 1 bình máu.')
  }

  function handleBuyMpPotion() {
    if ((player.spiritStones || 0) < 5) {
      setLog('Không đủ linh thạch.')
      return
    }

    setPlayer((prev) => ({
      ...prev,
      spiritStones: (prev.spiritStones || 0) - 5,
      mpPotion: (prev.mpPotion || 0) + 1
    }))

    setLog('Mua 1 bình MP.')
  }

  function handleBuyLife() {
    if ((player.spiritStones || 0) < 1000) {
      setLog('Không đủ linh thạch.')
      return
    }

    setPlayer((prev) => ({
      ...prev,
      spiritStones: (prev.spiritStones || 0) - 1000,
      lives: Math.min(99, (prev.lives || 0) + 1)
    }))

    setLog('Mua thành công 1 mạng.')
  }

  function handleEquip(itemKey) {
    const result = equipItem(player, itemKey)
    setPlayer(result.player)
    setLog(result.message)
  }

  function handleSpawnMonster() {
    const monster = generateMonster(player)
    setCurrentMonster(monster)
    setActiveTab('dungeon')
    setLog(`Bạn gặp ${monster.name}!`)
  }

  function handleSpawnBoss() {
    const boss = generateBoss(player)
    setCurrentMonster(boss)
    setActiveTab('dungeon')
    setLog(`Boss xuất hiện: ${boss.name}!`)
  }

  function handleUseHpPotion() {
    if (!currentMonster) {
      setLog('Chỉ có thể dùng bình máu trong combat.')
      return
    }

    if ((player.hpPotion || 0) <= 0) {
      setLog('Bạn không có bình máu.')
      return
    }

    const healedHp = Math.min(finalMaxHp || 100, (player.hp || 0) + 50)

    const updatedPlayer = {
      ...player,
      hp: healedHp,
      hpPotion: (player.hpPotion || 0) - 1
    }

    const combatPlayer = {
      ...updatedPlayer,
      damage: finalDamage,
      defense: finalDefense,
      maxHp: finalMaxHp
    }

    const monsterTurn = attackPlayer(currentMonster, combatPlayer)

    if (monsterTurn.dead) {
      const newLives = (player.lives || 0) - 1

      if (newLives <= 0) {
        setPlayer({
          ...updatedPlayer,
          hp: 1,
          lives: 0,
          lastLifeRegen: Date.now()
        })
        setCurrentMonster(null)
        setLog('Bạn dùng bình máu nhưng vẫn bị đánh bại và đã hết mạng... Game Over.')
        return
      }

      const recoveredHp = Math.max(1, Math.floor((finalMaxHp || 100) * 0.5))

      setPlayer({
        ...updatedPlayer,
        hp: recoveredHp,
        lives: newLives,
        lastLifeRegen: Date.now()
      })
      setCurrentMonster(null)
      setLog(`Bạn dùng bình máu nhưng vẫn bị đánh bại. Mất 1 mạng (${newLives} còn lại).`)
      return
    }

    setPlayer((prev) => ({
      ...prev,
      hp: monsterTurn.player.hp,
      hpPotion: (prev.hpPotion || 0) - 1
    }))
    setLog(`Bạn dùng bình máu hồi 50 HP và mất lượt. ${currentMonster.name} phản công ${monsterTurn.damage}${monsterTurn.isCrit ? ' (CRIT!)' : ''} sát thương.`)
  }

  function handleUseMpPotion() {
    if (!currentMonster) {
      setLog('Chỉ có thể dùng bình MP trong combat.')
      return
    }

    if ((player.mpPotion || 0) <= 0) {
      setLog('Bạn không có bình MP.')
      return
    }

    const recoveredMp = Math.min(player.maxMp || 50, (player.mp || 0) + 50)

    const updatedPlayer = {
      ...player,
      mp: recoveredMp,
      mpPotion: (player.mpPotion || 0) - 1
    }

    const combatPlayer = {
      ...updatedPlayer,
      damage: finalDamage,
      defense: finalDefense,
      maxHp: finalMaxHp
    }

    const monsterTurn = attackPlayer(currentMonster, combatPlayer)

    if (monsterTurn.dead) {
      const newLives = (player.lives || 0) - 1

      if (newLives <= 0) {
        setPlayer({
          ...updatedPlayer,
          hp: 1,
          lives: 0,
          lastLifeRegen: Date.now()
        })
        setCurrentMonster(null)
        setLog('Bạn dùng bình MP nhưng vẫn bị đánh bại và đã hết mạng... Game Over.')
        return
      }

      const recoveredHp = Math.max(1, Math.floor((finalMaxHp || 100) * 0.5))

      setPlayer({
        ...updatedPlayer,
        hp: recoveredHp,
        lives: newLives,
        lastLifeRegen: Date.now()
      })
      setCurrentMonster(null)
      setLog(`Bạn dùng bình MP nhưng vẫn bị đánh bại. Mất 1 mạng (${newLives} còn lại).`)
      return
    }

    setPlayer((prev) => ({
      ...prev,
      hp: monsterTurn.player.hp,
      mp: recoveredMp,
      mpPotion: (prev.mpPotion || 0) - 1
    }))
    setLog(`Bạn dùng bình MP hồi 50 MP và mất lượt. ${currentMonster.name} phản công ${monsterTurn.damage}${monsterTurn.isCrit ? ' (CRIT!)' : ''} sát thương.`)
  }

  function handleAttackMonster() {
    if (!currentMonster || combatBusy) return

    setCombatBusy(true)

    const combatPlayer = {
      ...player,
      damage: finalDamage,
      defense: finalDefense,
      maxHp: finalMaxHp
    }

    const playerTurn = attackMonster(combatPlayer, currentMonster)

    if (playerTurn.dead) {
      const expResult = applyExpGain(
        player,
        currentMonster.expReward,
        `Đánh bại ${currentMonster.name}`
      )

      const drops = getMonsterDrops(currentMonster)

      const rewardedPlayer = {
        ...expResult.player,
        spiritStones:
          (expResult.player.spiritStones || 0) + (drops.spiritStones || 0),
        herb1: (expResult.player.herb1 || 0) + (drops.herb1 || 0),
        herb2: (expResult.player.herb2 || 0) + (drops.herb2 || 0)
      }

      const dropTexts = []
      if (drops.spiritStones) dropTexts.push(`${drops.spiritStones} linh thạch`)
      if (drops.herb1) dropTexts.push(`${drops.herb1} thảo dược nhất phẩm`)
      if (drops.herb2) dropTexts.push(`${drops.herb2} thảo dược nhị phẩm`)

      setPlayer(rewardedPlayer)
      setCurrentMonster(null)
      setLog(
        `Bạn đã đánh bại ${currentMonster.name}, nhận ${currentMonster.expReward} EXP${
          dropTexts.length ? ` và ${dropTexts.join(', ')}` : ''
        }!`
      )
      setCombatBusy(false)
      return
    }

    const monsterTurn = attackPlayer(playerTurn.monster, combatPlayer)

    if (monsterTurn.dead) {
      const newLives = (player.lives || 0) - 1

      if (newLives <= 0) {
        setPlayer((prev) => ({
          ...prev,
          hp: 1,
          lives: 0,
          lastLifeRegen: Date.now()
        }))
        setCurrentMonster(null)
        setLog('Bạn đã bị đánh bại và hết mạng... Game Over.')
        setCombatBusy(false)
        return
      }

      const recoveredHp = Math.max(1, Math.floor((finalMaxHp || 100) * 0.5))

      setPlayer((prev) => ({
        ...prev,
        hp: recoveredHp,
        lives: newLives,
        lastLifeRegen: Date.now()
      }))
      setCurrentMonster(null)
      setLog(`Bạn chết! Mất 1 mạng (${newLives} còn lại).`)
      setCombatBusy(false)
      return
    }

    setCurrentMonster(playerTurn.monster)
    setPlayer((prev) => ({
      ...prev,
      hp: monsterTurn.player.hp
    }))
    setLog(
      `Bạn gây ${playerTurn.damage}${playerTurn.isCrit ? ' (CRIT!)' : ''} sát thương lên ${currentMonster.name}, và bị phản công ${monsterTurn.damage}${monsterTurn.isCrit ? ' (CRIT!)' : ''} sát thương.`
    )
    setCombatBusy(false)
  }

  function handleResetSave() {
    const confirmReset = window.confirm(
      'Bạn có chắc muốn xóa toàn bộ dữ liệu tu luyện không?'
    )
    if (!confirmReset) return

    clearGameSave()
    setAutoTraining(false)
    setCurrentMonster(null)
    setPlayer(createDefaultPlayer())
    setOfflineReward({ seconds: 0, exp: 0 })
    setLog('Đã xóa dữ liệu. Bắt đầu lại từ Phàm Nhân tầng 1.')
  }

  useEffect(() => {
    if (!authReady || !user) return

    const savedData = loadGame()

    if (savedData) {
      let loadedPlayer = savedData.player || createDefaultPlayer()
      let loadedAutoTraining =
        typeof savedData.autoTraining === 'boolean'
          ? savedData.autoTraining
          : false
      let loadedLog = savedData.log || 'Đã tải dữ liệu tu luyện trước đó.'
      let loadedMonster = savedData.currentMonster || null

      loadedPlayer = {
        ...createDefaultPlayer(),
        ...loadedPlayer,
        maxHp: loadedPlayer.maxHp || loadedPlayer.hp || 100,
        maxMp: loadedPlayer.maxMp || loadedPlayer.mp || 50,
        hpPotion: loadedPlayer.hpPotion || 0,
        mpPotion: loadedPlayer.mpPotion || 0,
        lives: loadedPlayer.lives ?? 5,
        lastLifeRegen: loadedPlayer.lastLifeRegen || Date.now(),
        inventory: {
          ...createDefaultPlayer().inventory,
          ...(loadedPlayer.inventory || {})
        },
        equipment: {
          ...createDefaultPlayer().equipment,
          ...(loadedPlayer.equipment || {})
        }
      }

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
          const result = applyExpGain(loadedPlayer, offlineExp, 'Offline tu luyện')

          loadedPlayer = result.player
          loadedLog = `Bạn đã offline ${offlineSeconds} giây và nhận ${offlineExp} EXP.`
          setOfflineReward({
            seconds: offlineSeconds,
            exp: offlineExp
          })
        }
      }

      const now = Date.now()
      const lastLifeRegen = loadedPlayer.lastLifeRegen || now
      const diff = now - lastLifeRegen
      const regenCount = Math.floor(diff / (60 * 60 * 1000))

      if (regenCount > 0 && (loadedPlayer.lives || 0) < 5) {
        loadedPlayer = {
          ...loadedPlayer,
          lives: Math.min(5, (loadedPlayer.lives || 0) + regenCount),
          lastLifeRegen: now
        }
      }

      setPlayer(loadedPlayer)
      setAutoTraining(loadedAutoTraining)
      setCurrentMonster(loadedMonster)
      setLog(loadedLog)
    } else {
      const starter = createDefaultPlayer()
      setPlayer(starter)
      setAutoTraining(false)
      setCurrentMonster(null)
      setLog('Bắt đầu con đường tu luyện...')
      setOfflineReward({ seconds: 0, exp: 0 })
    }

    setIsLoaded(true)
  }, [authReady, user])

  useEffect(() => {
    if ((player.hp || 0) > finalMaxHp) {
      setPlayer((prev) => ({
        ...prev,
        hp: finalMaxHp
      }))
    }
  }, [finalMaxHp])

  useEffect(() => {
    if (!isLoaded || !user) return

    const data = {
      player,
      autoTraining,
      currentMonster,
      log,
      lastSeenAt: Date.now()
    }

    saveGame(data)
    saveToCloud(data)
  }, [player, autoTraining, currentMonster, log, isLoaded, user])

  useEffect(() => {
    if (!autoTraining) return

    const interval = setInterval(() => {
      cultivate(AUTO_EXP_PER_SECOND, 'Tự động tu luyện')
    }, 1000)

    return () => clearInterval(interval)
  }, [autoTraining])

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayer((prev) => {
        if ((prev.lives || 0) >= 5) return prev

        const now = Date.now()
        const diff = now - (prev.lastLifeRegen || now)

        if (diff >= 60 * 60 * 1000) {
          return {
            ...prev,
            lives: Math.min(5, (prev.lives || 0) + 1),
            lastLifeRegen: now
          }
        }

        return prev
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isLoaded || !user) return

    const handleBeforeUnload = () => {
      const data = {
        player,
        autoTraining,
        currentMonster,
        log,
        lastSeenAt: Date.now()
      }

      saveGame(data)
      saveToCloud(data)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [player, autoTraining, currentMonster, log, isLoaded, user])

  if (!authReady) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial'
        }}
      >
        Đang khởi tạo...
      </div>
    )
  }

  if (!user) {
    return (
      <AuthScreen
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        authMessage={authMessage}
        authLoading={authLoading}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
      />
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
        color: 'white',
        padding: isMobile ? 12 : 24,
        fontFamily: 'Arial'
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          background: '#111827',
          borderRadius: 24,
          padding: isMobile ? 14 : 24,
          boxShadow: '0 0 30px rgba(0,0,0,0.35)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 16
          }}
        >
          <h1
            style={{
              textAlign: 'center',
              margin: 0,
              fontSize: isMobile ? 28 : 42
            }}
          >
            Game Tu Tiên
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap'
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 12,
                background: '#0f172a',
                color: '#cbd5e1',
                border: '1px solid #334155'
              }}
            >
              {user.email}
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: 'none',
                background: '#b91c1c',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>

        <MenuTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '360px minmax(0, 1fr)',
            gap: 18
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <SectionCard title="Nhân vật">
              <div style={{ marginBottom: 10, fontSize: 24, fontWeight: 800 }}>
                {player.realm} - Tầng {player.stage}
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>HP</span>
                  <strong>{finalHp}/{finalMaxHp}</strong>
                </div>
                <ProgressBar value={finalHp} max={finalMaxHp} color="#ef4444" height={18} />
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>MP</span>
                  <strong>{player.mp}/{player.maxMp}</strong>
                </div>
                <ProgressBar value={player.mp} max={player.maxMp} color="#3b82f6" height={18} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>EXP</span>
                  <strong>{player.exp}/{player.expToNext}</strong>
                </div>
                <ProgressBar value={player.exp} max={player.expToNext} color="#eab308" height={18} />
              </div>

              <StatLine label="Sát thương" value={`${finalDamage} (+${equippedBonuses.damage})`} />
              <StatLine label="Phòng thủ" value={`${finalDefense} (+${equippedBonuses.defense})`} />
              <StatLine label="HP tối đa" value={`${finalMaxHp} (+${equippedBonuses.maxHp})`} />
              <StatLine label="Chí mạng" value={`${Math.round((player.critRate || 0) * 100)}%`} />
              <StatLine label="ST Chí mạng" value={`${Math.round((player.critDamage || 1.5) * 100)}%`} />
              <StatLine label="Mạng" value={player.lives} />
              <StatLine label="Hồi mạng" value={lifeRegenText} />

              {player.readyToBreakthrough && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 12,
                    background: 'rgba(127, 29, 29, 0.4)',
                    border: '1px solid #ef4444',
                    color: '#fecaca',
                    fontWeight: 700
                  }}
                >
                  Đã đạt viên mãn, có thể chuẩn bị đột phá.
                </div>
              )}

              {offlineReward?.seconds > 0 && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 12,
                    background: '#0f172a',
                    color: '#cbd5e1'
                  }}
                >
                  Offline reward: +{offlineReward.exp} EXP sau {offlineReward.seconds} giây.
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr',
                  gap: 10,
                  marginTop: 16
                }}
              >
                <ActionButton onClick={handleCultivate}>Tu luyện</ActionButton>
                <ActionButton
                  onClick={handleToggleAutoTraining}
                  background={autoTraining ? '#16a34a' : '#475569'}
                >
                  {autoTraining ? 'Auto ON' : 'Auto OFF'}
                </ActionButton>
                <ActionButton onClick={handleBreakthrough} background="#7c3aed">
                  Đột phá
                </ActionButton>
                <ActionButton onClick={handleResetSave} background="#b91c1c">
                  Reset
                </ActionButton>
              </div>
            </SectionCard>

            <SectionCard title="Trang bị">
              <EquipmentGrid player={player} onEquip={handleEquip} />
            </SectionCard>

            <SectionCard title="Nhật ký">
              <div
                style={{
                  minHeight: 84,
                  color: '#e2e8f0',
                  lineHeight: 1.6
                }}
              >
                {log}
              </div>
            </SectionCard>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {activeTab === 'cultivate' && (
              <SectionCard title="Luyện khí">
                <div style={{ color: '#cbd5e1', lineHeight: 1.8 }}>
                  <p>Tu luyện để tích lũy EXP và đạt viên mãn trước khi đột phá.</p>
                  <p>Auto tu luyện hiện tại: <strong>{AUTO_EXP_PER_SECOND} EXP / giây</strong></p>
                  <p>Offline reward tối đa: <strong>{MAX_OFFLINE_SECONDS / 3600} giờ</strong></p>
                  <p>
                    Điều kiện đột phá cần đủ EXP, linh thạch, thảo dược và Phá Cảnh Đan phù hợp.
                  </p>
                </div>
              </SectionCard>
            )}

            {activeTab === 'bag' && (
              <SectionCard title="Túi đồ">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: 10
                  }}
                >
                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 12 }}>Linh thạch: {player.spiritStones || 0}</div>
                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 12 }}>Thảo dược nhất phẩm: {player.herb1 || 0}</div>
                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 12 }}>Thảo dược nhị phẩm: {player.herb2 || 0}</div>
                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 12 }}>Phá Cảnh Đan cấp 1: {player.pill1 || 0}</div>
                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 12 }}>Phá Cảnh Đan cấp 2: {player.pill2 || 0}</div>
                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 12 }}>Bình máu: {player.hpPotion || 0}</div>
                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 12 }}>Bình MP: {player.mpPotion || 0}</div>
                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 12 }}>Vũ khí cấp 1: {(player.inventory?.weapon1 || 0) + ((player.equipment?.weapon === 'weapon1') ? 1 : 0)}</div>
                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 12 }}>Áo cấp 1: {(player.inventory?.armor1 || 0) + ((player.equipment?.armor === 'armor1') ? 1 : 0)}</div>
                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 12 }}>Quần cấp 1: {(player.inventory?.pants1 || 0) + ((player.equipment?.pants === 'pants1') ? 1 : 0)}</div>
                  <div style={{ background: '#0f172a', padding: 12, borderRadius: 12 }}>Giày cấp 1: {(player.inventory?.boots1 || 0) + ((player.equipment?.boots === 'boots1') ? 1 : 0)}</div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                    marginTop: 14
                  }}
                >
                  <ActionButton onClick={handleUseHpPotion} background="#dc2626">
                    Dùng bình máu
                  </ActionButton>
                  <ActionButton onClick={handleUseMpPotion} background="#2563eb">
                    Dùng bình MP
                  </ActionButton>
                </div>

                <div style={{ marginTop: 12, color: '#94a3b8' }}>
                  Bình chỉ dùng được trong combat và sẽ bỏ qua lượt đánh hiện tại.
                </div>
              </SectionCard>
            )}

            {activeTab === 'alchemy' && (
              <SectionCard title="Luyện đan">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: 12
                  }}
                >
                  <div
                    style={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 14,
                      padding: 14
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                      Phá Cảnh Đan cấp 1
                    </div>
                    <div style={{ color: '#cbd5e1', marginBottom: 12 }}>
                      10 thảo dược nhất phẩm + 50 linh thạch
                    </div>
                    <ActionButton onClick={handleCraftPill1} background="#9333ea">
                      Luyện đan cấp 1
                    </ActionButton>
                  </div>

                  <div
                    style={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 14,
                      padding: 14
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                      Phá Cảnh Đan cấp 2
                    </div>
                    <div style={{ color: '#cbd5e1', marginBottom: 12 }}>
                      10 thảo dược nhị phẩm + 200 linh thạch
                    </div>
                    <ActionButton onClick={handleCraftPill2} background="#c026d3">
                      Luyện đan cấp 2
                    </ActionButton>
                  </div>
                </div>
              </SectionCard>
            )}

            {activeTab === 'shop' && (
              <SectionCard title="Shop">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                    gap: 12
                  }}
                >
                  <div style={{ background: '#0f172a', padding: 14, borderRadius: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Bình máu</div>
                    <div style={{ color: '#cbd5e1', marginBottom: 12 }}>+50 HP, giá 5 linh thạch</div>
                    <ActionButton onClick={handleBuyHpPotion} background="#dc2626">
                      Mua
                    </ActionButton>
                  </div>

                  <div style={{ background: '#0f172a', padding: 14, borderRadius: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Bình MP</div>
                    <div style={{ color: '#cbd5e1', marginBottom: 12 }}>+50 MP, giá 5 linh thạch</div>
                    <ActionButton onClick={handleBuyMpPotion} background="#2563eb">
                      Mua
                    </ActionButton>
                  </div>

                  <div style={{ background: '#0f172a', padding: 14, borderRadius: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Mạng sống</div>
                    <div style={{ color: '#cbd5e1', marginBottom: 12 }}>+1 mạng, giá 1000 linh thạch</div>
                    <ActionButton onClick={handleBuyLife} background="#16a34a">
                      Mua
                    </ActionButton>
                  </div>
                </div>
              </SectionCard>
            )}

            {activeTab === 'dungeon' && (
              <SectionCard title="Bí cảnh">
                {!currentMonster ? (
                  <div>
                    <div
                      style={{
                        color: '#cbd5e1',
                        marginBottom: 16
                      }}
                    >
                      Chưa có quái xuất hiện. Hãy tiến vào bí cảnh để bắt đầu chiến đấu.
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <ActionButton onClick={handleSpawnMonster} background="#dc2626">
                        Tìm quái
                      </ActionButton>
                      <ActionButton onClick={handleSpawnBoss} background="#7c3aed">
                        Gọi Boss
                      </ActionButton>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
                      {currentMonster.name}
                    </div>
                    <div style={{ color: currentMonster.isBoss ? '#c4b5fd' : '#cbd5e1', marginBottom: 14 }}>
                      {currentMonster.isBoss ? 'Boss' : 'Quái thường'} • {currentMonster.realm} tầng {currentMonster.stage}
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span>{currentMonster.isBoss ? 'HP Boss' : 'HP Quái'}</span>
                        <strong>{currentMonster.currentHp}/{currentMonster.hp}</strong>
                      </div>
                      <ProgressBar
                        value={currentMonster.currentHp}
                        max={currentMonster.hp}
                        color={currentMonster.isBoss ? '#a855f7' : '#ef4444'}
                        height={20}
                      />
                    </div>

                    <StatLine label="Công" value={currentMonster.attack} />
                    <StatLine label="Thủ" value={currentMonster.defense} />
                    <StatLine label="Thưởng EXP" value={currentMonster.expReward} />

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                      <ActionButton onClick={handleAttackMonster} background="#b91c1c">
                        Tấn công
                      </ActionButton>
                      <ActionButton onClick={handleSpawnMonster} background="#475569">
                        Đổi quái
                      </ActionButton>
                      <ActionButton onClick={handleSpawnBoss} background="#6d28d9">
                        Đổi sang Boss
                      </ActionButton>
                    </div>

                    <div style={{ marginTop: 12, color: '#94a3b8' }}>
                      Bạn cũng có thể sang tab Túi để dùng bình trong lúc chiến đấu.
                    </div>
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
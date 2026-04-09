import { useEffect, useMemo, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'

function toMillis(value) {
  if (!value) return 0
  if (typeof value?.toMillis === 'function') return value.toMillis()
  if (typeof value === 'number') return value
  return 0
}

function normalizePublicPlayer(docSnap) {
  const data = docSnap.data() || {}

  return {
    uid: data.uid || docSnap.id,
    name: data.name || 'Vo Danh',
    realm: data.realm || 'Pham Nhan',
    stage: Number(data.stage) || 1,
    exp: Number(data.exp) || 0,
    power: Number(data.power) || 0,
    spiritStones: Number(data.spiritStones) || 0,
    herbs: Number(data.herbs) || 0,
    hp: Number(data.hp) || 0,
    maxHp: Number(data.maxHp) || 0,
    damage: Number(data.damage) || 0,
    defense: Number(data.defense) || 0,
    updatedAtMs: toMillis(data.updatedAt),
    lastSeenAtMs: toMillis(data.lastSeenAt),
  }
}

export function usePublicPlayers(currentUid) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const playersQuery = query(
      collection(db, 'publicPlayers'),
      orderBy('power', 'desc'),
      limit(50)
    )

    const unsub = onSnapshot(
      playersQuery,
      (snapshot) => {
        setPlayers(snapshot.docs.map((docSnap) => normalizePublicPlayer(docSnap)))
        setLoading(false)
      },
      (error) => {
        console.error('Public players snapshot error:', error)
        setPlayers([])
        setLoading(false)
      }
    )

    return () => unsub()
  }, [])

  const rankedPlayers = useMemo(() => {
    return players.map((player, index) => ({
      ...player,
      rank: index + 1,
      isSelf: !!currentUid && player.uid === currentUid,
      isOnline: Date.now() - player.lastSeenAtMs < 5 * 60 * 1000,
    }))
  }, [players, currentUid])

  return {
    publicPlayers: rankedPlayers,
    loading,
  }
}

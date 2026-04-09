import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { loadGame, saveGame } from '../utils/save'

export async function loadPlayerSave(uid) {
  if (!uid) return loadGame()

  try {
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)

    if (snap.exists()) {
      const data = snap.data()

      if (data?.saveData && typeof data.saveData === 'object') {
        saveGame(data.saveData, uid)
        return data.saveData
      }
    }
  } catch (error) {
    console.error('Lỗi load cloud:', error)
  }

  return loadGame(uid)
}

export async function savePlayerSave(uid, payload) {
  if (!uid || !payload) return

  saveGame(payload, uid)
}

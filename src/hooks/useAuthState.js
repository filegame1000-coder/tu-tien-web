import { useEffect, useRef, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const SESSION_KEY_PREFIX = 'huyen-thien-session'
const ADMIN_EMAILS = ['trinhchibinh13x3@gmail.com']

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function isAdminEmail(email) {
  const normalized = normalizeEmail(email)
  return ADMIN_EMAILS.includes(normalized)
}

function mapFirebaseError(error) {
  const code = error?.code || ''

  if (code.includes('invalid-email')) return 'Email không hợp lệ.'
  if (code.includes('email-already-in-use')) return 'Email này đã được đăng ký.'
  if (code.includes('weak-password')) return 'Mật khẩu phải từ 6 ký tự trở lên.'
  if (code.includes('invalid-credential')) return 'Sai email hoặc mật khẩu.'
  if (code.includes('user-not-found')) return 'Không tìm thấy tài khoản.'
  if (code.includes('wrong-password')) return 'Sai mật khẩu.'
  if (code.includes('too-many-requests')) {
    return 'Thử quá nhiều lần. Vui lòng đợi một lúc.'
  }

  return error?.message || 'Đã có lỗi xảy ra.'
}

function getSessionStorageKey(uid) {
  return `${SESSION_KEY_PREFIX}:${uid}`
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function getOrCreateLocalSessionId(uid) {
  if (!uid) return ''
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return createSessionId()
  }

  const key = getSessionStorageKey(uid)
  const existing = window.sessionStorage.getItem(key)
  if (existing) return existing

  const next = createSessionId()
  window.sessionStorage.setItem(key, next)
  return next
}

function clearLocalSessionId(uid) {
  if (!uid) return
  if (typeof window === 'undefined' || !window.sessionStorage) return
  window.sessionStorage.removeItem(getSessionStorageKey(uid))
}

export function useAuthState() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userProfile, setUserProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const sessionWatcherRef = useRef(null)
  const loginIntentRef = useRef(false)
  const forcedLogoutRef = useRef(false)
  const currentSessionRef = useRef({ uid: '', sessionId: '' })

  async function forceBlockedSignOut(firebaseUser, customMessage = '') {
    forcedLogoutRef.current = true
    setMessage(customMessage || 'Tai khoan nay da bi khoa.')
    try {
      await releaseSession(firebaseUser)
    } catch (error) {
      console.error('Blocked release session error:', error)
    } finally {
      await signOut(auth).catch((error) => {
        console.error('Blocked sign-out error:', error)
      })
      forcedLogoutRef.current = false
    }
  }

  function cleanupSessionWatcher() {
    if (typeof sessionWatcherRef.current === 'function') {
      sessionWatcherRef.current()
    }
    sessionWatcherRef.current = null
  }

  async function ensureUserDoc(firebaseUser) {
    const ref = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      await setDoc(
        ref,
        {
          email: firebaseUser.email || '',
          role: 'player',
          profile: {
            displayName: '',
          },
          session: {
            activeSessionId: '',
            updatedAtMs: 0,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          saveData: null,
        },
        { merge: true }
      )
    }
  }

  async function activateSession(firebaseUser, allowTakeover = false) {
    const uid = firebaseUser?.uid
    if (!uid) return { ok: false, reason: 'missing-user' }

    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    const localSessionId = getOrCreateLocalSessionId(uid)
    const remoteSessionId = String(snap.data()?.session?.activeSessionId || '')

    if (remoteSessionId && remoteSessionId !== localSessionId && !allowTakeover) {
      return { ok: false, reason: 'already-active-elsewhere' }
    }

    await setDoc(
      ref,
      {
        updatedAt: serverTimestamp(),
        session: {
          activeSessionId: localSessionId,
          updatedAtMs: Date.now(),
        },
      },
      { merge: true }
    )

    currentSessionRef.current = {
      uid,
      sessionId: localSessionId,
    }

    return { ok: true, sessionId: localSessionId }
  }

  async function releaseSession(firebaseUser) {
    const uid = firebaseUser?.uid || currentSessionRef.current.uid
    const sessionId = currentSessionRef.current.sessionId

    cleanupSessionWatcher()

    if (!uid) {
      currentSessionRef.current = { uid: '', sessionId: '' }
      return
    }

    try {
      const ref = doc(db, 'users', uid)
      const snap = await getDoc(ref)
      const remoteSessionId = String(snap.data()?.session?.activeSessionId || '')

      if (sessionId && remoteSessionId === sessionId) {
        await setDoc(
          ref,
          {
            updatedAt: serverTimestamp(),
            session: {
              activeSessionId: '',
              updatedAtMs: Date.now(),
            },
          },
          { merge: true }
        )
      }
    } catch (error) {
      console.error('Release session error:', error)
    } finally {
      clearLocalSessionId(uid)
      currentSessionRef.current = { uid: '', sessionId: '' }
    }
  }

  function startSessionWatcher(firebaseUser) {
    const uid = firebaseUser?.uid
    if (!uid) return

    cleanupSessionWatcher()

    const ref = doc(db, 'users', uid)
    const localSessionId = currentSessionRef.current.sessionId || getOrCreateLocalSessionId(uid)

    sessionWatcherRef.current = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : null
        setUserProfile(data)
        setIsAdmin(data?.role === 'admin' || isAdminEmail(firebaseUser?.email))

        if (Boolean(data?.blocked)) {
          if (forcedLogoutRef.current) return
          void forceBlockedSignOut(
            firebaseUser,
            'Tai khoan nay da bi khoa. Vui long lien he quan tri vien.'
          )
          return
        }

        const remoteSessionId = String(data?.session?.activeSessionId || '')
        if (!remoteSessionId || remoteSessionId === localSessionId) return
        if (forcedLogoutRef.current) return

        forcedLogoutRef.current = true
        setMessage('Tài khoản này đã đăng nhập ở nơi khác, bạn đã bị đăng xuất.')

        signOut(auth)
          .catch((error) => {
            console.error('Forced sign-out error:', error)
          })
          .finally(() => {
            forcedLogoutRef.current = false
          })
      },
      (error) => {
        console.error('Session watcher error:', error)
      }
    )
  }

  async function loadUserMeta(firebaseUser) {
    if (!firebaseUser?.uid) {
      setUserProfile(null)
      setIsAdmin(false)
      return
    }

    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
    const data = snap.exists() ? snap.data() : null

    if (Boolean(data?.blocked)) {
      await forceBlockedSignOut(
        firebaseUser,
        'Tai khoan nay da bi khoa. Vui long lien he quan tri vien.'
      )
      return
    }

    setUserProfile(data)
    setIsAdmin(data?.role === 'admin' || isAdminEmail(firebaseUser?.email))
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser || null)

      if (!firebaseUser) {
        cleanupSessionWatcher()
        setUserProfile(null)
        setIsAdmin(false)
        currentSessionRef.current = { uid: '', sessionId: '' }
        setReady(true)
        return
      }

      try {
        await ensureUserDoc(firebaseUser)

        const sessionResult = await activateSession(firebaseUser, loginIntentRef.current)

        if (!sessionResult.ok) {
          setMessage(
            'Tài khoản này đang hoạt động ở nơi khác. Hãy đăng nhập lại để tiếp quản phiên cũ.'
          )
          clearLocalSessionId(firebaseUser.uid)
          await signOut(auth)
          return
        }

        startSessionWatcher(firebaseUser)
        await loadUserMeta(firebaseUser)
      } catch (error) {
        console.error('Load user meta error:', error)
        setUserProfile(null)
        setIsAdmin(false)
        setMessage('Không thể đồng bộ phiên đăng nhập.')
      } finally {
        loginIntentRef.current = false
        setReady(true)
      }
    })

    return () => {
      cleanupSessionWatcher()
      if (typeof unsub === 'function') unsub()
    }
  }, [])

  async function handleRegister() {
    if (!email || !password) {
      setMessage('Vui lòng nhập email và mật khẩu.')
      return
    }

    try {
      setLoading(true)
      setMessage('')
      loginIntentRef.current = true

      await createUserWithEmailAndPassword(auth, email, password)
      setMessage('Đăng ký thành công.')
    } catch (error) {
      loginIntentRef.current = false
      setMessage(mapFirebaseError(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      setMessage('Vui lòng nhập email và mật khẩu.')
      return
    }

    try {
      setLoading(true)
      setMessage('')
      loginIntentRef.current = true

      await signInWithEmailAndPassword(auth, email, password)
      setMessage('Đăng nhập thành công.')
    } catch (error) {
      loginIntentRef.current = false
      setMessage(mapFirebaseError(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      setLoading(true)
      await releaseSession(auth.currentUser)
      await signOut(auth)
      setEmail('')
      setPassword('')
      setMessage('')
      setUserProfile(null)
      setIsAdmin(false)
    } catch (error) {
      setMessage(mapFirebaseError(error))
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    ready,
    loading,
    message,
    email,
    password,
    userProfile,
    isAdmin,
    setEmail,
    setPassword,
    handleRegister,
    handleLogin,
    handleLogout,
  }
}

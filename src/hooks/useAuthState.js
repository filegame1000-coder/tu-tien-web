import { useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

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

export function useAuthState() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userProfile, setUserProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          saveData: null,
        },
        { merge: true }
      )
    }
  }

  async function loadUserMeta(firebaseUser) {
    if (!firebaseUser?.uid) {
      setUserProfile(null)
      setIsAdmin(false)
      return
    }

    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
    const data = snap.exists() ? snap.data() : null
    setUserProfile(data)
    setIsAdmin(data?.role === 'admin')
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser || null)

      if (!firebaseUser) {
        setUserProfile(null)
        setIsAdmin(false)
        setReady(true)
        return
      }

      try {
        await ensureUserDoc(firebaseUser)
        await loadUserMeta(firebaseUser)
      } catch (error) {
        console.error('Load user meta error:', error)
        setUserProfile(null)
        setIsAdmin(false)
      } finally {
        setReady(true)
      }
    })

    return () => {
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

      const result = await createUserWithEmailAndPassword(auth, email, password)
      await ensureUserDoc(result.user)
      await loadUserMeta(result.user)

      setMessage('Đăng ký thành công.')
    } catch (error) {
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

      const result = await signInWithEmailAndPassword(auth, email, password)
      await ensureUserDoc(result.user)
      await loadUserMeta(result.user)

      setMessage('Đăng nhập thành công.')
    } catch (error) {
      setMessage(mapFirebaseError(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      setLoading(true)
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

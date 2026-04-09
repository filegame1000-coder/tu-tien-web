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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null)
      setReady(true)
    })

    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [])

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
    setEmail,
    setPassword,
    handleRegister,
    handleLogin,
    handleLogout,
  }
}

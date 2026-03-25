import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCQDM5pC1oumgpuWndB7p7vqzzvbbfwkhE',
  authDomain: 'tu-tien-web.firebaseapp.com',
  projectId: 'tu-tien-web'
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
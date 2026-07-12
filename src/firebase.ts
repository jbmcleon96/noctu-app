import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyD7MnJ3cAaTuhG52nkPudw1PnOPfkW78Tk',
  authDomain: 'velvetkey-98565.firebaseapp.com',
  projectId: 'velvetkey-98565',
  storageBucket: 'velvetkey-98565.firebasestorage.app',
  messagingSenderId: '186353996241',
  appId: '1:186353996241:web:bba5367a6060ad45d750f0',
}

console.log('FIREBASE CONFIG:', firebaseConfig)


const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
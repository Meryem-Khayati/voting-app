import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyB0JwiKMNrU3p5cNTCRiedSwW8SidRIhQA",
  authDomain: "voting-app-f3038.firebaseapp.com",
  projectId: "voting-app-f3038",
  storageBucket: "voting-app-f3038.firebasestorage.app",
  messagingSenderId: "142923659254",
  appId: "1:142923659254:web:2d44d4b41f94fde8f9f9d7"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
<template>
  <div style="max-width: 400px; margin: 100px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
    <h2 style="text-align: center">
      {{ isLogin ? ' Connexion' : ' Inscription' }}
    </h2>

    <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 12px;">
      <input
        v-model="email"
        type="email"
        placeholder="Email universitaire (@uca.ac.ma)"
        required
        style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Mot de passe (min. 6 caractères)"
        required
        style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;"
      />
      <button
        type="submit"
        style="padding: 12px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;"
      >
        {{ isLogin ? 'Se connecter' : 'S’inscrire' }}
      </button>
    </form>

    <p style="text-align: center; margin-top: 16px;">
      <button
        @click="toggleMode"
        style="background: none; border: none; color: #1976d2; cursor: pointer; text-decoration: underline;"
      >
        {{ isLogin ? 'Pas de compte ? S’inscrire' : 'Déjà inscrit ? Se connecter' }}
      </button>
    </p>

    <p v-if="error" style="color: red; text-align: center; margin-top: 12px;">
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const isLogin = ref(true)
const error = ref('')
const router = useRouter()

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
}

const handleSubmit = async () => {
  // Validation email universitaire
  if (!email.value.endsWith('@uca.ac.ma')) {
    error.value = 'Seuls les emails @uca.ac.ma sont autorisés.'
    return
  }

  try {
    if (isLogin.value) {
      await signInWithEmailAndPassword(auth, email.value, password.value)
    } else {
      await createUserWithEmailAndPassword(auth, email.value, password.value)
    }
    router.push('/events')
  } catch (err) {
    console.error(err)
    if (err.code === 'auth/invalid-email') {
      error.value = 'Format d’email invalide.'
    } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      error.value = 'Email ou mot de passe incorrect.'
    } else if (err.code === 'auth/email-already-in-use') {
      error.value = 'Cet email est déjà utilisé.'
    } else if (err.code === 'auth/weak-password') {
      error.value = 'Mot de passe trop court (min. 6 caractères).'
    } else {
      error.value = 'Erreur inconnue. Réessayez.'
    }
  }
}
</script>
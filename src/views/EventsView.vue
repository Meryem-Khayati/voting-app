<template>
  <div style="max-width: 800px; margin: 20px auto; padding: 0 20px;">
    <h1 style="text-align: center; margin-bottom: 30px; color: #1976d2;">
      Événements ENSA Safi
    </h1>

    <div v-if="loading" style="text-align: center; margin: 60px 0; font-size: 18px;">
      <p>Chargement des événements…</p>
    </div>

    <div v-else>
      <div
        v-for="event in events"
        :key="event.id"
        style="border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; margin-bottom: 24px; background: white; box-shadow: 0 2px 6px rgba(0,0,0,0.05);"
      >
        <div style="position: relative; width: 100%; overflow: hidden; border-radius: 8px; margin-bottom: 16px;">
          <img
            :src="event.img || 'https://via.placeholder.com/400x200?text=Événement'"
            :alt="event.title"
            style=" width: 40%; height: 100px;"
          />
        </div>

        <h3 style="font-size: 20px; margin: 0 0 10px 0;">{{ event.title }}</h3>
        <p style="color: #555; margin-bottom: 12px;">{{ event.description }}</p>
        <p><strong>Date :</strong> {{ formatDate(event.date) }}</p>
        <p><strong>Prix :</strong> {{ event.isFree ? 'Gratuit' : `${event.price} MAD` }}</p>

        <div style="margin: 16px 0; font-weight: bold; color: #333;">
           {{ event.yesVotes || 0 }} votes • {{ event.noVotes || 0 }} votes
        </div>

        <!-- Boutons de vote -->
        <div v-if="!userVote[event.id]" style="display: flex; gap: 10px;">
          <button
            @click="vote(event.id, 'yes')"
            style="flex: 1; padding: 12px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;"
          >
             Oui
          </button>
          <button
            @click="vote(event.id, 'no')"
            style="flex: 1; padding: 12px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;"
          >
             Non
          </button>
        </div>
        <div v-else style="font-style: italic; color: #666; font-weight: 500;">
           Vous avez voté : <strong>{{ userVote[event.id] === 'yes' ? ' Oui' : ' Non' }}</strong>
        </div>
      </div>
    </div>

    <button
      @click="logout"
      style="display: block; margin: 30px auto; padding: 12px 24px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;"
    >
      Déconnexion
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { increment } from 'firebase/firestore'; 
import { auth } from '@/firebase';
import { db } from '@/firebase';
import { useRouter } from 'vue-router';

const events = ref([]);
const userVote = ref({});
const loading = ref(true);
const unsubscribeEvents = ref(null);
const unsubscribeVotes = ref(null);
const router = useRouter();

const userId = computed(() => auth.currentUser?.uid);

// Formatage robuste de la date
const formatDate = (dateField) => {
  let d;
  if (dateField?.toDate) {
    d = dateField.toDate(); // Timestamp Firestore
  } else if (typeof dateField === 'string') {
    d = new Date(dateField); // string ISO
  } else {
    return 'Date inconnue';
  }
  return isNaN(d) ? 'Date invalide' : d.toLocaleString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  if (!userId.value) {
    router.push('/login');
    return;
  }

  // Écoute des événements
  const eventsQuery = collection(db, 'Events');
  unsubscribeEvents.value = onSnapshot(eventsQuery, (snapshot) => {
    events.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => new Date(a.date?.toDate?.() || a.date) - new Date(b.date?.toDate?.() || b.date));
    loading.value = false;
  });

  // Écoute des votes de l'utilisateur
  const votesQuery = query(
    collection(db, 'votes'),
    where('userId', '==', userId.value)
  );
  unsubscribeVotes.value = onSnapshot(votesQuery, (snapshot) => {
    const votes = {};
    snapshot.docs.forEach(doc => {
      const { eventId, vote } = doc.data();
      votes[eventId] = vote;
    });
    userVote.value = votes;
  });
});

onUnmounted(() => {
  unsubscribeEvents.value?.();
  unsubscribeVotes.value?.();
});

// Fonction de vote
const vote = async (eventId, choice) => {
  if (!userId.value || userVote.value[eventId]) return;

  try {
    const voteId = `${userId.value}_${eventId}`;
    const voteRef = doc(db, 'votes', voteId);

    await setDoc(voteRef, {
      eventId,
      userId: userId.value,
      vote: choice,
      createdAt: new Date()
    });

    // Mise à jour atomique des compteurs
    const eventRef = doc(db, 'Events', eventId);
    const field = choice === 'yes' ? 'yesVotes' : 'noVotes';
    await updateDoc(eventRef, {
      [field]: increment(1),
      updatedAt: new Date()
    });
  } catch (err) {
    console.error('Erreur vote:', err);
    alert(' Échec du vote. Vérifiez votre connexion.');
  }
};

const logout = async () => {
  await auth.signOut();
  router.push('/login');
};
</script>
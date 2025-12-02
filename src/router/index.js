import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import EventsView from '@/views/EventsView.vue';
import { auth } from '@/firebase';

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'Login', component: LoginView },
    {
      path: '/events',
      name: 'Events',
      component: EventsView,
      meta: { requiresAuth: true }
    }
  ]
});

let isAuthReady = false;
let authPromise = new Promise((resolve) => {
  const unsubscribe = auth.onAuthStateChanged(() => {
    isAuthReady = true;
    unsubscribe();
    resolve();
  });
});

// Guard robuste
router.beforeEach(async (to, from, next) => {
  // Attendre que Firebase ait chargé l'état utilisateur
  if (!isAuthReady) {
    await authPromise;
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isLoggedIn = auth.currentUser;

  if (requiresAuth && !isLoggedIn) {
    next('/login');
  } else if (!requiresAuth && isLoggedIn && to.path === '/login') {
    next('/events');
  } else {
    next();
  }
});

export default router;
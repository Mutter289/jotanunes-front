import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/main',
      name: 'main',
      component: () => import('../views/MainView.vue'),
    },
    {
      path: '/auditLog',
      name: 'audit',
      component: () => import('../views/AuditView.vue'),
    },
    {
      path: '/dependencias',
      name: 'dependencias',
      component: () => import('../views/Dependencias.vue'),
    },
  ],
})

export default router

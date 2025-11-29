import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      requiresGuest: true,
      title: 'Login - Sistema Auditoria',
    },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('../views/UserView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: 'Gestão de Usuários',
    },
  },
  {
    path: '/monitoring',
    name: 'monitoring',
    component: () => import('../views/MonitoringView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: 'Monitoramento',
    },
  },
  {
    path: '/gemini-analyses',
    name: 'GeminiAnalyses',
    component: () => import('../views/GeminiAnalysesView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Análises',
    },
  },
  {
    path: '/login',
    name: 'login',
    redirect: '/',
  },
  {
    path: '/main',
    name: 'main',
    component: () => import('../views/MainView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Dashboard - Sistema Auditoria',
    },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Dashboard - Sistema Auditoria',
    },
  },
  {
    path: '/auditLog',
    name: 'audit',
    component: () => import('../views/AuditView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Log de Auditoria - Sistema Auditoria',
    },
  },
  {
    path: '/dependencias',
    name: 'dependencias',
    component: () => import('../views/Dependencias.vue'),
    meta: {
      requiresAuth: true,
      title: 'Dependências - Sistema Auditoria',
    },
  },
  {
    path: '/microsoft/callback',
    name: 'microsoft-callback',
    component: () => import('../views/MicrosoftCallback.vue'),
    meta: {
      title: 'Autenticação Microsoft - Sistema Auditoria',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

let isAuthInitialized = false

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (!isAuthInitialized) {
    await authStore.initializeAuth()
    isAuthInitialized = true
  }

  if (to.meta.title) {
    document.title = to.meta.title
  }

  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      next({
        name: 'home',
        query: { redirect: to.fullPath },
      })
      return
    }

    if (!authStore.isUserActive) {
      const status = authStore.userStatus

      if (status === 'pendente') {
        await authStore.logout()
        next({
          name: 'home',
          query: { status: 'pending', message: 'Usuário aguardando aprovação' },
        })
        return
      } else if (status === 'bloqueado') {
        await authStore.logout()
        next({
          name: 'home',
          query: { status: 'blocked', message: 'Usuário bloqueado' },
        })
        return
      }
    }

    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      next({ name: 'unauthorized' })
      return
    }
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'main' })
    return
  }

  next()
})

router.onError((error) => {
  console.error('Erro de navegação:', error)

  if (error.message.includes('Loading chunk')) {
    window.location.reload()
    return
  }

  router.push({ name: 'not-found' })
})

export default router

export const NavigationUtils = {
  redirectAfterLogin(router, defaultRoute = '/main') {
    const redirectTo = router.currentRoute.value.query.redirect

    if (redirectTo && typeof redirectTo === 'string') {
      try {
        const resolved = router.resolve(redirectTo)
        if (resolved.name && resolved.name !== 'not-found') {
          router.push(redirectTo)
          return
        }
      } catch (error) {
        console.warn('Rota de redirect inválida:', redirectTo)
      }
    }

    router.push(defaultRoute)
  },

  canAccessRoute(routeName, authStore) {
    const route = router.resolve({ name: routeName })

    if (!route.meta) return true

    if (route.meta.requiresAuth && !authStore.isAuthenticated) {
      return false
    }

    if (route.meta.requiresAdmin && !authStore.isAdmin) {
      return false
    }

    if (route.meta.requiresGuest && authStore.isAuthenticated) {
      return false
    }

    return true
  },

  getAvailableRoutes(authStore) {
    return routes.filter((route) => {
      if (!route.name || route.name.startsWith('not-found')) return false
      return NavigationUtils.canAccessRoute(route.name, authStore)
    })
  },

  generateBreadcrumb(route) {
    const breadcrumb = []

    if (route.meta?.requiresAuth) {
      breadcrumb.push({
        name: 'Dashboard',
        path: '/main',
      })
    }

    const pathSegments = route.path.split('/').filter((segment) => segment)

    pathSegments.forEach((segment, index) => {
      const isLast = index === pathSegments.length - 1
      const path = '/' + pathSegments.slice(0, index + 1).join('/')

      breadcrumb.push({
        name: segment.charAt(0).toUpperCase() + segment.slice(1),
        path: isLast ? null : path,
        isActive: isLast,
      })
    })

    return breadcrumb
  },
}

export function useRouter() {
  return {
    router,
    ...NavigationUtils,
  }
}

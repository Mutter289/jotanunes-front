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
      title: 'Login - Sistema Auditoria'
    }
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('../views/UserView.vue'),
    meta: { 
      requiresAuth: true,
      requiresAdmin: true,
      title: 'Gestão de Usuários'
    }
  },
  {
    path: '/login',
    name: 'login',
    redirect: '/'
  },
  {
    path: '/main',
    name: 'main',
    component: () => import('../views/MainView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Dashboard - Sistema Auditoria'
    }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    redirect: '/main'
  },
  {
    path: '/auditLog',
    name: 'audit',
    component: () => import('../views/AuditView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Log de Auditoria - Sistema Auditoria'
    }
  },
  {
    path: '/dependencias',
    name: 'dependencias',
    component: () => import('../views/Dependencias.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Dependências - Sistema Auditoria'
    }
  },
  // {
  //   path: '/profile',
  //   name: 'profile',
  //   component: () => import('../views/ProfileView.vue'),
  //   meta: { 
  //     requiresAuth: true,
  //     title: 'Perfil - Sistema Auditoria'
  //   }
  // },
  // {
  //   path: '/notifications',
  //   name: 'notifications',
  //   component: () => import('../views/NotificationsView.vue'),
  //   meta: { 
  //     requiresAuth: true,
  //     title: 'Notificações - Sistema Auditoria'
  //   }
  // },
  // {
  //   path: '/admin',
  //   name: 'admin',
  //   component: () => import('../views/admin/AdminDashboard.vue'),
  //   meta: { 
  //     requiresAuth: true,
  //     requiresAdmin: true,
  //     title: 'Administração - Sistema Auditoria'
  //   },
  //   children: [
  //     {
  //       path: 'users',
  //       name: 'admin-users',
  //       component: () => import('../views/admin/UsersManagement.vue'),
  //       meta: { 
  //         requiresAuth: true,
  //         requiresAdmin: true,
  //         title: 'Gestão de Usuários - Sistema Auditoria'
  //       }
  //     },
  //     {
  //       path: 'pending',
  //       name: 'admin-pending',
  //       component: () => import('../views/admin/PendingUsers.vue'),
  //       meta: { 
  //         requiresAuth: true,
  //         requiresAdmin: true,
  //         title: 'Usuários Pendentes - Sistema Auditoria'
  //       }
  //     },
  //     {
  //       path: 'statistics',
  //       name: 'admin-statistics',
  //       component: () => import('../views/admin/StatisticsView.vue'),
  //       meta: { 
  //         requiresAuth: true,
  //         requiresAdmin: true,
  //         title: 'Estatísticas - Sistema Auditoria'
  //       }
  //     }
  //   ]
  // },
  {
    path: '/microsoft/callback',
    name: 'microsoft-callback',
    component: () => import('../views/MicrosoftCallback.vue'),
    meta: {
      title: 'Autenticação Microsoft - Sistema Auditoria'
    }
  },
  // {
  //   path: '/unauthorized',
  //   name: 'unauthorized',
  //   component: () => import('../views/UnauthorizedView.vue'),
  //   meta: {
  //     title: 'Acesso Negado - Sistema Auditoria'
  //   }
  // },
  // {
  //   path: '/:pathMatch(.*)*',
  //   name: 'not-found',
  //   component: () => import('../views/NotFoundView.vue'),
  //   meta: {
  //     title: 'Página não encontrada - Sistema Auditoria'
  //   }
  // }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Loading state global
let isAuthInitialized = false

// Guard de navegação global
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Inicializar autenticação apenas uma vez
  if (!isAuthInitialized) {
    await authStore.initializeAuth()
    isAuthInitialized = true
  }
  
  // Definir título da página
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  // Verificar se é uma rota que requer autenticação
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Usuário não autenticado, redirecionar para login
      next({
        name: 'home',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // Verificar se usuário está ativo
    if (!authStore.isUserActive) {
      // Usuário não está ativo (pode estar pendente ou bloqueado)
      const status = authStore.userStatus
      
      if (status === 'pendente') {
        // Fazer logout e mostrar mensagem de pendência
        await authStore.logout()
        next({
          name: 'home',
          query: { status: 'pending', message: 'Usuário aguardando aprovação' }
        })
        return
      } else if (status === 'bloqueado') {
        // Fazer logout e mostrar mensagem de bloqueio
        await authStore.logout()
        next({
          name: 'home',
          query: { status: 'blocked', message: 'Usuário bloqueado' }
        })
        return
      }
    }
    
    // Verificar se é uma rota que requer admin
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      next({ name: 'unauthorized' })
      return
    }
  }
  
  // Verificar se é uma rota que requer usuário não autenticado
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // Usuário já está logado, redirecionar para main
    next({ name: 'main' })
    return
  }
  
  // Permitir navegação
  next()
})

// Interceptor para erros de navegação
router.onError((error) => {
  console.error('Erro de navegação:', error)
  
  // Se for erro de carregamento de chunk (lazy loading)
  if (error.message.includes('Loading chunk')) {
    // Recarregar a página para obter os novos chunks
    window.location.reload()
    return
  }
  
  // Para outros erros, redirecionar para página de erro
  router.push({ name: 'not-found' })
})

export default router

// Utilitários para navegação
export const NavigationUtils = {
  // Redirecionar após login
  redirectAfterLogin(router, defaultRoute = '/main') {
    const redirectTo = router.currentRoute.value.query.redirect
    
    if (redirectTo && typeof redirectTo === 'string') {
      // Verificar se a rota de redirect é válida
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
    
    // Redirecionar para rota padrão
    router.push(defaultRoute)
  },
  
  // Verificar se pode acessar rota
  canAccessRoute(routeName, authStore) {
    const route = router.resolve({ name: routeName })
    
    if (!route.meta) return true
    
    // Verificar autenticação
    if (route.meta.requiresAuth && !authStore.isAuthenticated) {
      return false
    }
    
    // Verificar admin
    if (route.meta.requiresAdmin && !authStore.isAdmin) {
      return false
    }
    
    // Verificar guest
    if (route.meta.requiresGuest && authStore.isAuthenticated) {
      return false
    }
    
    return true
  },
  
  // Obter rotas disponíveis para o usuário
  getAvailableRoutes(authStore) {
    return routes.filter(route => {
      if (!route.name || route.name.startsWith('not-found')) return false
      return NavigationUtils.canAccessRoute(route.name, authStore)
    })
  },
  
  // Breadcrumb utilities
  generateBreadcrumb(route) {
    const breadcrumb = []
    
    // Adicionar home/main como base
    if (route.meta?.requiresAuth) {
      breadcrumb.push({
        name: 'Dashboard',
        path: '/main'
      })
    }
    
    // Adicionar segmentos da rota atual
    const pathSegments = route.path.split('/').filter(segment => segment)
    
    pathSegments.forEach((segment, index) => {
      const isLast = index === pathSegments.length - 1
      const path = '/' + pathSegments.slice(0, index + 1).join('/')
      
      breadcrumb.push({
        name: segment.charAt(0).toUpperCase() + segment.slice(1),
        path: isLast ? null : path, // Último item não é clicável
        isActive: isLast
      })
    })
    
    return breadcrumb
  }
}

// Hook para usar com composition API
export function useRouter() {
  return {
    router,
    ...NavigationUtils
  }
}
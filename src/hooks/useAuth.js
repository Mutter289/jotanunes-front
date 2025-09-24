import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  // Estados reativos
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)
  const isLoading = computed(() => authStore.isLoading)
  const error = computed(() => authStore.error)
  const isAdmin = computed(() => authStore.isAdmin)

  // Métodos de autenticação
  const login = async (email, password, rememberMe = false) => {
    return await authStore.loginCredentials(email, password, rememberMe)
  }

  const loginMicrosoft = async () => {
    return await authStore.startMicrosoftAuth()
  }

  const register = async (userData) => {
    return await authStore.register(userData)
  }

  const logout = async () => {
    await authStore.logout()
    router.push('/login')
  }

  // Guards de navegação
  const requireAuth = () => {
    if (!isAuthenticated.value) {
      router.push('/login')
      return false
    }
    return true
  }

  const requireAdmin = () => {
    if (!isAuthenticated.value) {
      router.push('/login')
      return false
    }
    
    if (!isAdmin.value) {
      router.push('/dashboard')
      return false
    }
    
    return true
  }

  const requireGuest = () => {
    if (isAuthenticated.value) {
      router.push('/dashboard')
      return false
    }
    return true
  }

  // Utilitários
  const canAccess = (permission) => {
    if (!isAuthenticated.value) return false
    
    const permissions = {
      admin: isAdmin.value,
      user: true,
      active: authStore.isUserActive
    }
    
    return permissions[permission] || false
  }

  const getUserInitials = () => {
    return authStore.userInitials
  }

  const formatUserName = (maxLength = 20) => {
    if (!user.value?.nome) return 'Usuário'
    
    const name = user.value.nome
    if (name.length <= maxLength) return name
    
    return name.substring(0, maxLength - 3) + '...'
  }

  const getStatusColor = () => {
    const status = authStore.userStatus
    const colors = {
      ativo: '#28a745',
      pendente: '#ffc107',
      bloqueado: '#dc3545'
    }
    return colors[status] || '#6c757d'
  }

  const getStatusText = () => {
    const status = authStore.userStatus
    const texts = {
      ativo: 'Ativo',
      pendente: 'Pendente',
      bloqueado: 'Bloqueado'
    }
    return texts[status] || 'Desconhecido'
  }

  return {
    // Estados
    isAuthenticated,
    user,
    isLoading,
    error,
    isAdmin,
    
    // Métodos
    login,
    loginMicrosoft,
    register,
    logout,
    
    // Guards
    requireAuth,
    requireAdmin,
    requireGuest,
    
    // Utilitários
    canAccess,
    getUserInitials,
    formatUserName,
    getStatusColor,
    getStatusText
  }
}

// Hook para notificações
export function useNotifications() {
  const authStore = useAuthStore()
  const notifications = computed(() => authStore.notifications)
  const unreadCount = computed(() => authStore.unreadNotificationsCount)

  const loadNotifications = async (onlyUnread = false) => {
    return await authStore.loadNotifications(onlyUnread)
  }

  const markAsRead = async (notificationId) => {
    return await authStore.markNotificationAsRead(notificationId)
  }

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Hoje'
    if (diffDays === 2) return 'Ontem'
    if (diffDays <= 7) return `${diffDays} dias atrás`
    
    return date.toLocaleDateString('pt-BR')
  }

  const getNotificationIcon = (type) => {
    const icons = {
      aprovacao: 'check-circle',
      bloqueio: 'ban',
      sistema: 'bell',
      cadastro: 'user-plus',
      login: 'sign-in-alt'
    }
    return icons[type] || 'bell'
  }

  const getNotificationColor = (type) => {
    const colors = {
      aprovacao: '#28a745',
      bloqueio: '#dc3545',
      sistema: '#17a2b8',
      cadastro: '#007bff',
      login: '#6c757d'
    }
    return colors[type] || '#6c757d'
  }

  return {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    formatNotificationTime,
    getNotificationIcon,
    getNotificationColor
  }
}

// Hook para administração
export function useAdmin() {
  const authStore = useAuthStore()
  const isAdmin = computed(() => authStore.isAdmin)

  const getUsers = async (status = null) => {
    return await authStore.getUsers(status)
  }

  const getPendingUsers = async () => {
    return await authStore.getPendingUsers()
  }

  const approveUser = async (userId) => {
    return await authStore.approveUser(userId)
  }

  const blockUser = async (userId, reason) => {
    return await authStore.blockUser(userId, reason)
  }

  const getStatistics = async () => {
    return await authStore.getStatistics()
  }

  const formatUserStatus = (status) => {
    const statusMap = {
      ativo: { text: 'Ativo', class: 'status-active' },
      pendente: { text: 'Pendente', class: 'status-pending' },
      bloqueado: { text: 'Bloqueado', class: 'status-blocked' }
    }
    return statusMap[status] || { text: 'Desconhecido', class: 'status-unknown' }
  }

  const formatLoginType = (type) => {
    const typeMap = {
      credenciais: 'Email/Senha',
      microsoft: 'Microsoft OAuth'
    }
    return typeMap[type] || 'Desconhecido'
  }

  return {
    isAdmin,
    getUsers,
    getPendingUsers,
    approveUser,
    blockUser,
    getStatistics,
    formatUserStatus,
    formatLoginType
  }
}

// Hook para validação de formulários
export function useFormValidation() {
  const errors = ref({})

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!email) {
      return 'Email é obrigatório'
    }
    
    if (!emailRegex.test(email)) {
      return 'Email inválido'
    }
    
    if (!email.includes('@jotanunes')) {
      return 'Use o email corporativo @jotanunes'
    }
    
    return null
  }

  const validatePassword = (password, isRegister = false) => {
    if (!password) {
      return 'Senha é obrigatória'
    }
    
    if (isRegister) {
      if (password.length < 8) {
        return 'Senha deve ter pelo menos 8 caracteres'
      }
      
      if (!/(?=.*[a-z])/.test(password)) {
        return 'Senha deve ter pelo menos 1 letra minúscula'
      }
      
      if (!/(?=.*[A-Z])/.test(password)) {
        return 'Senha deve ter pelo menos 1 letra maiúscula'
      }
      
      if (!/(?=.*\d)/.test(password)) {
        return 'Senha deve ter pelo menos 1 número'
      }
    } else {
      if (password.length < 6) {
        return 'Senha deve ter pelo menos 6 caracteres'
      }
    }
    
    return null
  }

  const validateName = (name) => {
    if (!name) {
      return 'Nome é obrigatório'
    }
    
    if (name.length < 2) {
      return 'Nome deve ter pelo menos 2 caracteres'
    }
    
    return null
  }

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
      return 'Confirmação de senha é obrigatória'
    }
    
    if (password !== confirmPassword) {
      return 'Senhas não coincidem'
    }
    
    return null
  }

  const setError = (field, message) => {
    errors.value[field] = message
  }

  const clearError = (field) => {
    if (field) {
      delete errors.value[field]
    } else {
      errors.value = {}
    }
  }

  const hasErrors = computed(() => {
    return Object.keys(errors.value).length > 0
  })

  const getError = (field) => {
    return errors.value[field] || null
  }

  return {
    errors,
    validateEmail,
    validatePassword,
    validateName,
    validateConfirmPassword,
    setError,
    clearError,
    hasErrors,
    getError
  }
}

// Hook para localStorage utilities
export function useStorage() {
  const setItem = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error)
      return false
    }
  }

  const getItem = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error)
      return defaultValue
    }
  }

  const removeItem = (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Erro ao remover do localStorage:', error)
      return false
    }
  }

  const clear = () => {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error)
      return false
    }
  }

  return {
    setItem,
    getItem,
    removeItem,
    clear
  }
}

// Hook para timer e contadores
export function useTimer() {
  const createCountdown = (seconds, callback) => {
    let remaining = seconds
    
    const interval = setInterval(() => {
      remaining--
      
      if (callback) {
        callback(remaining)
      }
      
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)
    
    return {
      clear: () => clearInterval(interval),
      remaining: () => remaining
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return {
    createCountdown,
    formatTime
  }
}
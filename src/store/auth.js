// stores/auth.js
import { defineStore } from 'pinia'
import authService from '@/services/authService.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Estado principal
    user: null,
    token: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,

    // Notificações
    notifications: [],
    unreadNotificationsCount: 0,

    // OAuth Microsoft
    microsoftAuthInProgress: false,

    // Dados administrativos
    users: [],
    pendingUsers: [],
    statistics: {},
    systemConfig: {},
    authLogs: [],

    // Cache e controle
    lastDataLoad: null,
    refreshInterval: null,
  }),

  getters: {
    // ==================== GETTERS BÁSICOS ====================
    isAdmin: (state) => {
      if (!state.user) return false
      const adminEmails = ['admin@empresa.com', 'suporte@empresa.com', 'gestor@empresa.com']
      return adminEmails.includes(state.user.email)
    },

    userInitials: (state) => {
      if (!state.user?.nome) return 'U'
      return state.user.nome
        .split(' ')
        .map((name) => name.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2)
    },

    userStatus: (state) => {
      return state.user?.status || 'unknown'
    },

    isUserActive: (state) => {
      return state.user?.status === 'ATIVO'
    },

    lastLogin: (state) => {
      return state.user?.ultimo_login || null
    },

    // ==================== GETTERS AVANÇADOS ====================
    canAccessAdminPanel: (state) => {
      return state.isAuthenticated && state.user?.status === 'ATIVO' && state.isAdmin
    },

    getUserDisplayData: (state) => {
      if (!state.user) return null

      return {
        nome: state.user.nome,
        email: state.user.email,
        status: state.user.status,
        iniciais: state.userInitials,
        ultimoLogin: state.lastLogin,
        tipoLogin: state.user.tipo_login,
        criadoEm: state.user.criado_em,
      }
    },

    // ==================== GETTERS ESTATÍSTICAS ====================
    pendingUsersCount: (state) => {
      return state.pendingUsers.length
    },

    activeUsersCount: (state) => {
      return state.users.filter((u) => u.status === 'ATIVO').length
    },

    blockedUsersCount: (state) => {
      return state.users.filter((u) => u.status === 'BLOQUEADO').length
    },

    totalUsersCount: (state) => {
      return state.users.length
    },

    // ==================== GETTERS NOTIFICAÇÕES ====================
    unreadNotifications: (state) => {
      return state.notifications.filter((n) => !n.lida)
    },

    notificationsByType: (state) => {
      return (type) => state.notifications.filter((n) => n.tipo === type)
    },

    // ==================== GETTERS STATUS ====================
    needsApproval: (state) => {
      return state.user?.status === 'PENDENTE'
    },

    isBlocked: (state) => {
      return state.user?.status === 'BLOQUEADO'
    },

    hasAdminPrivileges: (state) => {
      return state.isAuthenticated && state.isAdmin && state.isUserActive
    },
  },

  actions: {
    // ==================== INICIALIZAÇÃO ====================
    async initializeAuth() {
      try {
        this.isLoading = true

        // Verificar se há token armazenado
        const storedToken = localStorage.getItem('access_token')
        const storedUser = authService.getStoredUser()

        if (storedToken && storedUser) {
          // Verificar se o token ainda é válido
          if (!authService.isTokenExpired()) {
            this.token = storedToken
            this.user = storedUser
            this.isAuthenticated = true

            // Tentar renovar dados do perfil
            try {
              await this.refreshProfile()
              await this.loadNotifications()

              // Se for admin, carregar dados administrativos
              if (this.canAccessAdminPanel) {
                await this.initializeAdminData()
              }
            } catch (error) {
              console.warn('Erro ao renovar dados:', error)
              // Manter dados locais se não conseguir renovar
            }
          } else {
            // Token expirado, limpar tudo
            this.logout()
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error)
        this.logout()
      } finally {
        this.isLoading = false
      }
    },

    // ==================== LOGIN CREDENCIAIS ====================
    async loginCredentials(email, password, rememberMe = false) {
      try {
        this.isLoading = true
        this.error = null

        const result = await authService.loginCredentials(email, password)

        if (result.success) {
          this.token = result.token
          this.user = result.user
          this.isAuthenticated = true

          // Salvar preferência de lembrar
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true')
            localStorage.setItem('lastUsername', email)
          } else {
            localStorage.removeItem('rememberMe')
            localStorage.removeItem('lastUsername')
          }

          // Carregar dados adicionais
          await this.loadNotifications()

          // Se for admin, carregar dados administrativos
          if (this.canAccessAdminPanel) {
            await this.initializeAdminData()
          }

          return { success: true }
        } else {
          this.error = result.error
          return { success: false, error: result.error }
        }
      } catch (error) {
        this.error = 'Erro interno de autenticação'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // ==================== MICROSOFT OAUTH ====================
    async startMicrosoftAuth() {
      try {
        this.microsoftAuthInProgress = true
        this.error = null

        const authUrl = await authService.getMicrosoftAuthUrl()

        // Abrir janela popup para autenticação
        const popup = window.open(
          authUrl,
          'microsoft-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes',
        )

        return new Promise((resolve, reject) => {
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed)
              this.microsoftAuthInProgress = false
              reject(new Error('Autenticação cancelada pelo usuário'))
            }
          }, 1000)

          // Escutar mensagem da janela popup
          const messageHandler = async (event) => {
            if (event.origin !== window.location.origin) return

            if (event.data.type === 'MICROSOFT_AUTH_SUCCESS') {
              clearInterval(checkClosed)
              popup.close()
              window.removeEventListener('message', messageHandler)

              try {
                const result = await authService.loginMicrosoft(event.data.code)

                if (result.success) {
                  this.token = result.token
                  this.user = result.user
                  this.isAuthenticated = true

                  await this.loadNotifications()

                  if (this.canAccessAdminPanel) {
                    await this.initializeAdminData()
                  }

                  resolve({ success: true })
                } else {
                  this.error = result.error
                  resolve({ success: false, error: result.error })
                }
              } catch (error) {
                this.error = 'Erro na autenticação Microsoft'
                resolve({ success: false, error: this.error })
              } finally {
                this.microsoftAuthInProgress = false
              }
            } else if (event.data.type === 'MICROSOFT_AUTH_ERROR') {
              clearInterval(checkClosed)
              popup.close()
              window.removeEventListener('message', messageHandler)
              this.microsoftAuthInProgress = false
              this.error = event.data.error || 'Erro na autenticação Microsoft'
              resolve({ success: false, error: this.error })
            }
          }

          window.addEventListener('message', messageHandler)
        })
      } catch (error) {
        this.microsoftAuthInProgress = false
        this.error = 'Erro ao iniciar autenticação Microsoft'
        return { success: false, error: this.error }
      }
    },

    async completeMicrosoftAuth(code) {
      try {
        this.isLoading = true
        this.error = null

        const result = await authService.loginMicrosoft(code)

        if (result.success) {
          this.token = result.token
          this.user = result.user
          this.isAuthenticated = true

          await this.loadNotifications()

          if (this.canAccessAdminPanel) {
            await this.initializeAdminData()
          }

          return { success: true }
        } else {
          this.error = result.error
          return { success: false, error: result.error }
        }
      } catch (error) {
        this.error = 'Erro na autenticação Microsoft'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // ==================== CADASTRO ====================
    async register(userData) {
      try {
        this.isLoading = true
        this.error = null

        const result = await authService.register(userData)

        if (result.success) {
          return {
            success: true,
            message: result.message,
            user: result.user,
          }
        } else {
          this.error = result.error
          return { success: false, error: result.error }
        }
      } catch (error) {
        this.error = 'Erro interno no cadastro'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // ==================== LOGOUT ====================
    async logout() {
      try {
        this.isLoading = true

        // Limpar interval de refresh se existir
        if (this.refreshInterval) {
          clearInterval(this.refreshInterval)
          this.refreshInterval = null
        }

        await authService.logout()
      } catch (error) {
        console.error('Erro no logout:', error)
      } finally {
        // Limpar estado independente do resultado
        this.user = null
        this.token = null
        this.isAuthenticated = false
        this.notifications = []
        this.unreadNotificationsCount = 0
        this.users = []
        this.pendingUsers = []
        this.statistics = {}
        this.systemConfig = {}
        this.authLogs = []
        this.lastDataLoad = null
        this.error = null
        this.isLoading = false
        this.microsoftAuthInProgress = false
      }
    },

    // ==================== PERFIL E DADOS ====================
    async refreshProfile() {
      try {
        const profile = await authService.getProfile()
        this.user = profile
        return profile
      } catch (error) {
        console.error('Erro ao atualizar perfil:', error)
        throw error
      }
    },

    async loadNotifications(onlyUnread = false) {
      try {
        const notifications = await authService.getNotifications(onlyUnread)
        this.notifications = notifications
        this.unreadNotificationsCount = notifications.filter((n) => !n.lida).length
        return notifications
      } catch (error) {
        console.error('Erro ao carregar notificações:', error)
        return []
      }
    },

    async markNotificationAsRead(notificationId) {
      try {
        const success = await authService.markNotificationAsRead(notificationId)
        if (success) {
          // Atualizar estado local
          const notification = this.notifications.find((n) => n.id === notificationId)
          if (notification && !notification.lida) {
            notification.lida = true
            notification.lida_em = new Date().toISOString()
            this.unreadNotificationsCount = Math.max(0, this.unreadNotificationsCount - 1)
          }
        }
        return success
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error)
        return false
      }
    },

    // ==================== ADMIN ACTIONS - USUÁRIOS ====================
    async getUsers(status = null, forceRefresh = false) {
      try {
        if (forceRefresh || this.users.length === 0) {
          this.users = await authService.getUsers(status)
          this.lastDataLoad = new Date()
        }
        return this.users
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async getUserById(userId) {
      try {
        return await authService.getUserById(userId)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async updateUser(userId, userData) {
      try {
        const updatedUser = await authService.updateUser(userId, userData)

        // Atualizar cache local
        const index = this.users.findIndex((u) => u.id === userId)
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...updatedUser }
        }

        return updatedUser
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async deleteUser(userId) {
      try {
        await authService.deleteUser(userId)

        // Remover do cache local
        this.users = this.users.filter((u) => u.id !== userId)
        this.pendingUsers = this.pendingUsers.filter((u) => u.id !== userId)

        // Atualizar estatísticas
        await this.getStatistics(true)

        return true
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async getPendingUsers(forceRefresh = false) {
      try {
        if (forceRefresh || this.pendingUsers.length === 0) {
          this.pendingUsers = await authService.getPendingUsers()
        }
        return this.pendingUsers
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async approveUser(userId) {
      try {
        await authService.approveUser(userId, this.user.email)

        // Atualizar caches locais
        const userIndex = this.users.findIndex((u) => u.id === userId)
        if (userIndex !== -1) {
          this.users[userIndex].status = 'ATIVO'
        }

        this.pendingUsers = this.pendingUsers.filter((u) => u.id !== userId)

        // Atualizar estatísticas
        await this.getStatistics(true)

        return true
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async blockUser(userId, reason) {
      try {
        await authService.blockUser(userId, reason, this.user.email)

        // Atualizar cache local
        const userIndex = this.users.findIndex((u) => u.id === userId)
        if (userIndex !== -1) {
          this.users[userIndex].status = 'BLOQUEADO'
        }

        // Atualizar estatísticas
        await this.getStatistics(true)

        return true
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // ==================== ADMIN ACTIONS - BULK OPERATIONS ====================
    async bulkApproveUsers(userIds) {
      try {
        const result = await authService.bulkApproveUsers(userIds, this.user.email)

        // Atualizar caches locais
        userIds.forEach((userId) => {
          const userIndex = this.users.findIndex((u) => u.id === userId)
          if (userIndex !== -1) {
            this.users[userIndex].status = 'ATIVO'
          }
        })

        this.pendingUsers = this.pendingUsers.filter((u) => !userIds.includes(u.id))

        // Atualizar estatísticas
        await this.getStatistics(true)

        return result
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async bulkBlockUsers(userIds, reason) {
      try {
        const result = await authService.bulkBlockUsers(userIds, reason, this.user.email)

        // Atualizar cache local
        userIds.forEach((userId) => {
          const userIndex = this.users.findIndex((u) => u.id === userId)
          if (userIndex !== -1) {
            this.users[userIndex].status = 'BLOQUEADO'
          }
        })

        // Atualizar estatísticas
        await this.getStatistics(true)

        return result
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // ==================== ADMIN ACTIONS - ESTATÍSTICAS ====================
    async getStatistics(forceRefresh = false) {
      try {
        if (forceRefresh || Object.keys(this.statistics).length === 0) {
          this.statistics = await authService.getStatistics()
        }
        return this.statistics
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async getAuthLogs(filters = {}) {
      try {
        this.authLogs = await authService.getAuthLogs(filters)
        return this.authLogs
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // ==================== ADMIN ACTIONS - CONFIGURAÇÕES ====================
    async getSystemConfig(forceRefresh = false) {
      try {
        if (forceRefresh || Object.keys(this.systemConfig).length === 0) {
          this.systemConfig = await authService.getSystemConfig()
        }
        return this.systemConfig
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async testEmail(email = null) {
      try {
        return await authService.testEmail(email)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async sendManualEmail(userId, emailData) {
      try {
        return await authService.sendManualEmail(userId, emailData)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // ==================== UTILITÁRIOS ====================
    clearError() {
      this.error = null
    },

    setLoading(loading) {
      this.isLoading = loading
    },

    // Verificar se usuário tem permissão para acessar rota
    canAccessRoute(routeName) {
      if (!this.isAuthenticated) return false

      // Rotas que requerem admin
      const adminRoutes = ['admin', 'users', 'statistics', 'user-management']
      if (adminRoutes.includes(routeName)) {
        return this.canAccessAdminPanel
      }

      // Rotas que requerem usuário ativo
      const activeUserRoutes = ['dashboard', 'profile', 'notifications']
      if (activeUserRoutes.includes(routeName)) {
        return this.isUserActive
      }

      return true
    },

    // Limpar caches admin
    clearAdminCaches() {
      this.users = []
      this.pendingUsers = []
      this.statistics = {}
      this.systemConfig = {}
      this.authLogs = []
      this.lastDataLoad = null
    },

    // Refresh completo dos dados admin
    async refreshAdminData() {
      if (!this.canAccessAdminPanel) return

      try {
        await Promise.all([
          this.getUsers(null, true),
          this.getPendingUsers(true),
          this.getStatistics(true),
          this.getSystemConfig(true),
        ])
        this.lastDataLoad = new Date()
      } catch (error) {
        console.error('Erro ao atualizar dados admin:', error)
      }
    },

    // Validar sessão
    async validateSession() {
      try {
        const validation = await authService.validateToken()

        if (validation.valid) {
          this.user = validation.user
          this.isAuthenticated = true
          return true
        } else {
          await this.logout()
          return false
        }
      } catch (error) {
        await this.logout()
        return false
      }
    },

    // ==================== FILTROS E PESQUISAS ====================

    // Filtros de usuários
    getUsersByStatus(status) {
      return this.users.filter((u) => u.status === status)
    },

    getUsersByLoginType(type) {
      return this.users.filter((u) => u.tipo_login === type)
    },

    // Pesquisa de usuários
    searchUsers(query) {
      if (!query) return this.users

      const searchTerm = query.toLowerCase()
      return this.users.filter(
        (user) =>
          user.nome.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm),
      )
    },

    // ==================== FORMATADORES ====================

    formatDate(dateStr) {
      return authService.formatDate(dateStr)
    },

    formatStatus(status) {
      return authService.formatStatus(status)
    },

    formatLoginType(type) {
      return authService.formatLoginType(type)
    },

    getUserDisplayName() {
      return authService.getUserDisplayName()
    },

    // ==================== CONFIGURAÇÃO INICIAL PARA ADMIN ====================
    async initializeAdminData() {
      if (!this.canAccessAdminPanel) return

      try {
        this.setLoading(true)

        // Carregar dados básicos em paralelo
        await Promise.all([
          this.getUsers(),
          this.getPendingUsers(),
          this.getStatistics(),
          this.getSystemConfig(),
        ])

        // Configurar refresh automático a cada 5 minutos
        if (this.refreshInterval) {
          clearInterval(this.refreshInterval)
        }

        this.refreshInterval = setInterval(
          async () => {
            if (this.canAccessAdminPanel) {
              try {
                await this.refreshAdminData()
              } catch (error) {
                console.error('Erro no refresh automático:', error)
              }
            }
          },
          5 * 60 * 1000,
        ) // 5 minutos
      } catch (error) {
        console.error('Erro ao inicializar dados admin:', error)
        this.error = 'Erro ao carregar dados administrativos'
      } finally {
        this.setLoading(false)
      }
    },

    // ==================== CLEANUP ====================
    destroy() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null
      }
    },
  },
})

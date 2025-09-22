// stores/auth.js
import { defineStore } from 'pinia'
import authService from '@/services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    notifications: [],
    unreadNotificationsCount: 0,
    microsoftAuthInProgress: false
  }),

  getters: {
    isAdmin: (state) => {
      if (!state.user) return false
      const adminEmails = ['admin@empresa.com', 'suporte@empresa.com', 'gestor@empresa.com']
      return adminEmails.includes(state.user.email)
    },

    userInitials: (state) => {
      if (!state.user?.nome) return 'U'
      return state.user.nome
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2)
    },

    userStatus: (state) => {
      return state.user?.status || 'unknown'
    },

    isUserActive: (state) => {
      return state.user?.status === 'ativo'
    },

    lastLogin: (state) => {
      return state.user?.ultimo_login || null
    }
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
            } catch (error) {
              console.warn('Erro ao renovar perfil:', error)
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
          
          // Carregar notificações
          await this.loadNotifications()
          
          return { success: true }
        } else {
          this.error = result.error
          return { success: false, error: result.error, status: result.status }
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
          'width=500,height=600,scrollbars=yes,resizable=yes'
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
          
          return { success: true }
        } else {
          this.error = result.error
          return { success: false, error: result.error, status: result.status }
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
            user: result.user
          }
        } else {
          this.error = result.error
          return { success: false, error: result.error, status: result.status }
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
        this.error = null
        this.isLoading = false
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
        this.unreadNotificationsCount = notifications.filter(n => !n.lida).length
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
          const notification = this.notifications.find(n => n.id === notificationId)
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

    // ==================== ADMIN ACTIONS ====================
    async getUsers(status = null) {
      try {
        return await authService.getUsers(status)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async getPendingUsers() {
      try {
        return await authService.getPendingUsers()
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async approveUser(userId) {
      try {
        const success = await authService.approveUser(userId, this.user.email)
        if (success) {
          // Refresh admin data if needed
        }
        return success
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async blockUser(userId, reason) {
      try {
        const success = await authService.blockUser(userId, this.user.email, reason)
        if (success) {
          // Refresh admin data if needed
        }
        return success
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async getStatistics() {
      try {
        return await authService.getStatistics()
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
      const adminRoutes = ['admin', 'users', 'statistics']
      if (adminRoutes.includes(routeName)) {
        return this.isAdmin
      }
      
      // Rotas que requerem usuário ativo
      const activeUserRoutes = ['dashboard', 'profile', 'notifications']
      if (activeUserRoutes.includes(routeName)) {
        return this.isUserActive
      }
      
      return true
    },

    // Formatar dados do usuário para exibição
    getUserDisplayData() {
      if (!this.user) return null
      
      return {
        nome: this.user.nome,
        email: this.user.email,
        status: this.user.status,
        iniciais: this.userInitials,
        ultimoLogin: this.lastLogin,
        tipoLogin: this.user.tipo_login,
        criadoEm: this.user.criado_em
      }
    }
  }
})
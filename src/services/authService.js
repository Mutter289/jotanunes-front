import { useFetch } from '../hooks/useFetch.js'

class AuthService {
  constructor() {
    this.token = localStorage.getItem('access_token')
    this.user = this.getStoredUser()
  }

  _getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {}
  }

  // ==================== LOGIN CREDENCIAIS ====================
  async loginCredentials(email, password) {
    try {
      const data = await useFetch('/api/auth/login', {
        method: 'POST',
        body: { email, senha: password },
      })

      const { access_token, usuario } = data
      this.setToken(access_token)
      this.setUser(usuario)

      return { success: true, user: usuario, token: access_token }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao fazer login',
      }
    }
  }

  // ==================== MICROSOFT OAUTH ====================
  async getMicrosoftAuthUrl() {
    try {
      const data = await useFetch('/api/auth/microsoft/auth-url')
      return data.auth_url
    } catch (error) {
      throw new Error(`Erro ao obter URL do Microsoft: ${error.message}`)
    }
  }

  async loginMicrosoft(authorizationCode) {
    try {
      const data = await useFetch(`/api/auth/microsoft/login?code=${authorizationCode}`, {
        method: 'POST',
      })

      const { access_token, usuario } = data
      this.setToken(access_token)
      this.setUser(usuario)

      return { success: true, user: usuario, token: access_token }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro na autenticação Microsoft',
      }
    }
  }

  // ==================== CADASTRO ====================
  async register(userData) {
    try {
      const user = await useFetch('/api/auth/cadastro', {
        method: 'POST',
        body: {
          nome: userData.nome,
          email: userData.email,
          senha: userData.senha,
        },
      })

      return {
        success: true,
        user,
        message: 'Cadastro realizado com sucesso! Aguarde aprovação do administrador.',
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao realizar cadastro',
      }
    }
  }

  // ==================== LOGOUT ====================
  async logout() {
    try {
      if (this.token) {
        await useFetch('/api/auth/logout', {
          method: 'POST',
          headers: this._getAuthHeaders(),
        })
      }
    } catch (error) {
      console.error('Erro no logout:', error)
    } finally {
      this.clearAuth()
    }
  }

  // ==================== PERFIL ====================
  async getProfile() {
    try {
      const data = await useFetch('/api/auth/perfil', { headers: this._getAuthHeaders() })
      this.setUser(data)
      return data
    } catch (error) {
      throw new Error(`Erro ao obter perfil: ${error.message}`)
    }
  }

  async getNotifications(onlyUnread = false) {
    try {
      const endpoint = `/api/auth/notificacoes?apenas_nao_lidas=${onlyUnread}`
      return await useFetch(endpoint, { headers: this._getAuthHeaders() })
    } catch (error) {
      throw new Error(`Erro ao obter notificações: ${error.message}`)
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      await useFetch(`/api/auth/notificacoes/${notificationId}/marcar-lida`, {
        method: 'POST',
        headers: this._getAuthHeaders(),
      })
      return true
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      return false
    }
  }

  // ==================== ADMIN ENDPOINTS - USUÁRIOS ====================
  async getUsers(status = null) {
    try {
      let endpoint = '/api/auth/admin/usuarios'
      if (status) {
        endpoint += `?status=${status}`
      }
      return await useFetch(endpoint, { headers: this._getAuthHeaders() })
    } catch (error) {
      throw new Error(`Erro ao obter usuários: ${error.message}`)
    }
  }

  async getUserById(userId) {
    try {
      return await useFetch(`/api/auth/admin/usuarios/${userId}`, {
        headers: this._getAuthHeaders(),
      })
    } catch (error) {
      throw new Error(`Erro ao obter usuário: ${error.message}`)
    }
  }

  async updateUser(userId, userData) {
    try {
      return await useFetch(`/api/auth/admin/usuarios/${userId}`, {
        method: 'PUT',
        body: userData,
        headers: this._getAuthHeaders(),
      })
    } catch (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`)
    }
  }

  async deleteUser(userId) {
    try {
      return await useFetch(`/api/auth/admin/usuarios/${userId}`, {
        method: 'DELETE',
        headers: this._getAuthHeaders(),
      })
    } catch (error) {
      throw new Error(`Erro ao excluir usuário: ${error.message}`)
    }
  }

  async getPendingUsers() {
    try {
      return await useFetch('/api/auth/admin/usuarios/pendentes', {
        headers: this._getAuthHeaders(),
      })
    } catch (error) {
      throw new Error(`Erro ao obter usuários pendentes: ${error.message}`)
    }
  }

  async approveUser(userId, approvedBy = null) {
    try {
      await useFetch(`/api/auth/admin/usuarios/${userId}/aprovar`, {
        method: 'POST',
        body: { aprovado_por: approvedBy || this.user?.email || 'admin' },
        headers: this._getAuthHeaders(),
      })
      return true
    } catch (error) {
      throw new Error(`Erro ao aprovar usuário: ${error.message}`)
    }
  }

  async blockUser(userId, reason, blockedBy = null) {
    try {
      await useFetch(`/api/auth/admin/usuarios/${userId}/bloquear`, {
        method: 'POST',
        body: {
          bloqueado_por: blockedBy || this.user?.email || 'admin',
          motivo: reason,
        },
        headers: this._getAuthHeaders(),
      })
      return true
    } catch (error) {
      throw new Error(`Erro ao bloquear usuário: ${error.message}`)
    }
  }

  // ==================== ADMIN ENDPOINTS - BULK OPERATIONS ====================
  async bulkApproveUsers(userIds, approvedBy = null) {
    try {
      return await useFetch('/api/auth/admin/usuarios/bulk/aprovar', {
        method: 'POST',
        body: {
          usuario_ids: userIds,
          aprovado_por: approvedBy || this.user?.email || 'admin',
        },
        headers: this._getAuthHeaders(),
      })
    } catch (error) {
      throw new Error(`Erro na aprovação em lote: ${error.message}`)
    }
  }

  async bulkBlockUsers(userIds, reason, blockedBy = null) {
    try {
      return await useFetch('/api/auth/admin/usuarios/bulk/bloquear', {
        method: 'POST',
        body: {
          usuario_ids: userIds,
          motivo: reason,
          bloqueado_por: blockedBy || this.user?.email || 'admin',
        },
        headers: this._getAuthHeaders(),
      })
    } catch (error) {
      throw new Error(`Erro no bloqueio em lote: ${error.message}`)
    }
  }

  // ==================== ADMIN ENDPOINTS - ESTATÍSTICAS ====================
  async getStatistics() {
    try {
      return await useFetch('/api/auth/admin/estatisticas', {
        headers: this._getAuthHeaders(),
      })
    } catch (error) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`)
    }
  }

  async getAuthLogs(filters = {}) {
    try {
      const params = new URLSearchParams()

      if (filters.email) params.append('email', filters.email)
      if (filters.tipo) params.append('tipo', filters.tipo)
      if (filters.sucesso !== undefined) params.append('sucesso', filters.sucesso)
      if (filters.limit) params.append('limit', filters.limit)
      if (filters.skip) params.append('skip', filters.skip)

      const endpoint = `/api/auth/admin/logs/autenticacao?${params.toString()}`
      return await useFetch(endpoint, { headers: this._getAuthHeaders() })
    } catch (error) {
      throw new Error(`Erro ao obter logs: ${error.message}`)
    }
  }

  // ==================== ADMIN ENDPOINTS - CONFIGURAÇÕES ====================
  async getSystemConfig() {
    try {
      return await useFetch('/api/auth/admin/configuracoes', {
        headers: this._getAuthHeaders(),
      })
    } catch (error) {
      throw new Error(`Erro ao obter configurações: ${error.message}`)
    }
  }

  async testEmail(email = null) {
    try {
      return await useFetch('/api/auth/admin/test-email', {
        method: 'POST',
        body: { email: email || this.user?.email },
        headers: this._getAuthHeaders(),
      })
    } catch (error) {
      throw new Error(`Erro no teste de email: ${error.message}`)
    }
  }

  async sendManualEmail(userId, emailData) {
    try {
      return await useFetch(`/api/auth/admin/usuarios/${userId}/enviar-email`, {
        method: 'POST',
        body: emailData,
        headers: this._getAuthHeaders(),
      })
    } catch (error) {
      throw new Error(`Erro ao enviar email: ${error.message}`)
    }
  }

  // ==================== VALIDAÇÕES ====================
  async validateToken() {
    try {
      const profile = await this.getProfile()
      return { valid: true, user: profile }
    } catch (error) {
      this.clearAuth()
      return { valid: false, error: error.message }
    }
  }

  async refreshSession() {
    try {
      // Tentar validar o token atual
      const validation = await this.validateToken()

      if (validation.valid) {
        this.setUser(validation.user)
        return true
      } else {
        this.clearAuth()
        return false
      }
    } catch (error) {
      this.clearAuth()
      return false
    }
  }

  // ==================== UTILITÁRIOS ====================
  setToken(token) {
    this.token = token
    localStorage.setItem('access_token', token)
  }

  setUser(user) {
    this.user = user
    localStorage.setItem('user_data', JSON.stringify(user))
  }

  getStoredUser() {
    try {
      const stored = localStorage.getItem('user_data')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  clearAuth() {
    this.token = null
    this.user = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('lastUsername')
  }

  isAuthenticated() {
    return !!this.token && !!this.user
  }

  isAdmin() {
    if (!this.user) return false
    const adminEmails = ['admin@empresa.com', 'suporte@empresa.com', 'gestor@empresa.com']
    return adminEmails.includes(this.user.email)
  }

  getUser() {
    return this.user
  }

  getToken() {
    return this.token
  }

  isTokenExpired() {
    if (!this.token) return true
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]))
      const now = Date.now() / 1000
      return payload.exp < now
    } catch {
      return true
    }
  }

  // ==================== HELPERS PARA FRONTEND ====================

  getUserDisplayName() {
    return this.user?.nome || 'Usuário'
  }

  getUserInitials() {
    if (!this.user?.nome) return 'U'
    return this.user.nome
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  getUserStatus() {
    return this.user?.status || 'unknown'
  }

  isUserActive() {
    return this.user?.status === 'ATIVO'
  }

  getLastLogin() {
    return this.user?.ultimo_login || null
  }

  getLoginType() {
    return this.user?.tipo_login || 'CREDENCIAIS'
  }

  canAccessAdminPanel() {
    return this.isAuthenticated() && this.isAdmin() && this.isUserActive()
  }

  // ==================== FORMATADORES ====================

  formatDate(dateStr) {
    if (!dateStr) return 'N/A'

    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  formatStatus(status) {
    const statusMap = {
      ATIVO: 'Ativo',
      PENDENTE: 'Pendente',
      BLOQUEADO: 'Bloqueado',
    }
    return statusMap[status] || status
  }

  formatLoginType(type) {
    const typeMap = {
      CREDENCIAIS: 'Email/Senha',
      MICROSOFT: 'Microsoft',
    }
    return typeMap[type] || type
  }
}

export default new AuthService()

import { useFetch } from '../hooks/useFetch'; // Ajuste o caminho se necessário


class AuthService {
  constructor() {
    this.token = localStorage.getItem('access_token');
    this.user = this.getStoredUser();
  }

  /**
   * Retorna os cabeçalhos de autenticação se um token existir.
   * @returns {object} Objeto de cabeçalhos.
   */
  _getAuthHeaders() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }

  // ==================== LOGIN CREDENCIAIS ====================
  async loginCredentials(email, password) {
    try {
      // O useFetch já retorna o objeto de dados diretamente
      const data = await useFetch('/api/auth/login', {
        method: 'POST',
        body: { email, senha: password },
      });

      const { access_token, usuario } = data;
      this.setToken(access_token);
      this.setUser(usuario);
      
      return { success: true, user: usuario, token: access_token };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao fazer login',
      };
    }
  }

  // ==================== MICROSOFT OAUTH ====================
  async getMicrosoftAuthUrl() {
    try {
      const data = await useFetch('/api/auth/microsoft/auth-url');
      return data.auth_url;
    } catch (error) {
      throw new Error(`Erro ao obter URL do Microsoft: ${error.message}`);
    }
  }

  async loginMicrosoft(authorizationCode) {
    try {
      // O hook useFetch não suporta 'params', então adicionamos na URL
      const data = await useFetch(`/api/auth/microsoft/login?code=${authorizationCode}`, {
        method: 'POST',
      });

      const { access_token, usuario } = data;
      this.setToken(access_token);
      this.setUser(usuario);

      return { success: true, user: usuario, token: access_token };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro na autenticação Microsoft',
      };
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
      });

      return {
        success: true,
        user,
        message: 'Cadastro realizado com sucesso! Aguarde aprovação do administrador.',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao realizar cadastro',
      };
    }
  }

  // ==================== LOGOUT ====================
  async logout() {
    try {
      if (this.token) {
        await useFetch('/api/auth/logout', { 
            method: 'POST', 
            headers: this._getAuthHeaders() 
        });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      this.clearAuth();
    }
  }

  // ==================== PERFIL ====================
  async getProfile() {
    try {
      const data = await useFetch('/api/auth/perfil', { headers: this._getAuthHeaders() });
      this.setUser(data);
      return data;
    } catch (error) {
      throw new Error(`Erro ao obter perfil: ${error.message}`);
    }
  }

  async getNotifications(onlyUnread = false) {
    try {
        const endpoint = `/api/auth/notificacoes?apenas_nao_lidas=${onlyUnread}`;
        return await useFetch(endpoint, { headers: this._getAuthHeaders() });
    } catch (error) {
      throw new Error(`Erro ao obter notificações: ${error.message}`);
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      await useFetch(`/api/auth/notificacoes/${notificationId}/marcar-lida`, { 
        method: 'POST',
        headers: this._getAuthHeaders()
      });
      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  }

  // ==================== ADMIN ENDPOINTS ====================
  async getUsers(status = null) {
    try {
        let endpoint = '/api/auth/admin/usuarios';
        if (status) {
            endpoint += `?status=${status}`;
        }
        return await useFetch(endpoint, { headers: this._getAuthHeaders() });
    } catch (error) {
      throw new Error(`Erro ao obter usuários: ${error.message}`);
    }
  }

  async getPendingUsers() {
    try {
      return await useFetch('/api/auth/admin/usuarios/pendentes', { headers: this._getAuthHeaders() });
    } catch (error) {
      throw new Error(`Erro ao obter usuários pendentes: ${error.message}`);
    }
  }

  async approveUser(userId, approvedBy) {
    try {
      await useFetch(`/api/auth/admin/usuarios/${userId}/aprovar`, {
        method: 'POST',
        body: { aprovado_por: approvedBy },
        headers: this._getAuthHeaders()
      });
      return true;
    } catch (error) {
      throw new Error(`Erro ao aprovar usuário: ${error.message}`);
    }
  }

  async blockUser(userId, blockedBy, reason) {
    try {
      await useFetch(`/api/auth/admin/usuarios/${userId}/bloquear`, {
        method: 'POST',
        body: { bloqueado_por: blockedBy, motivo: reason },
        headers: this._getAuthHeaders()
      });
      return true;
    } catch (error) {
      throw new Error(`Erro ao bloquear usuário: ${error.message}`);
    }
  }

  async getStatistics() {
    try {
      return await useFetch('/api/auth/admin/estatisticas', { headers: this._getAuthHeaders() });
    } catch (error) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`);
    }
  }

  // ==================== UTILITÁRIOS (inalterado) ====================
  setToken(token) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  setUser(user) {
    this.user = user;
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  getStoredUser() {
    try {
      const stored = localStorage.getItem('user_data');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('lastUsername');
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  isAdmin() {
    if (!this.user) return false;
    const adminEmails = ['admin@empresa.com', 'suporte@empresa.com', 'gestor@empresa.com'];
    console.log('Email do usuário:', this.user.email);
    console.log('É admin?', adminEmails.includes(this.user.email));
    return adminEmails.includes(this.user.email);
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  isTokenExpired() {
    if (!this.token) return true;
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch {
      return true;
    }
  }
}

export default new AuthService();
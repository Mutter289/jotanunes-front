<template>
  <nav class="navbar" :class="{ 'navbar-collapsed': isCollapsed }">
    <div class="navbar-content">
      <div class="navbar-actions">
        <div class="search-container" v-if="showSearch">
          <div class="search-input-wrapper">
            <FontAwesomeIcon icon="search" class="search-icon" />
            <input
              type="text"
              placeholder="Pesquisar..."
              class="search-input"
              v-model="searchQuery"
              @input="onSearch"
            />
          </div>
        </div>

        <div class="action-buttons">
          <!-- Indicador de conexão WebSocket -->
          <div class="connection-status" :class="{ connected: isConnected }">
            <FontAwesomeIcon :icon="isConnected ? 'wifi' : 'wifi-slash'" />
            <span class="status-tooltip">
              {{ isConnected ? 'Conectado' : 'Desconectado' }}
            </span>
          </div>

          <button
            class="action-btn notifications"
            v-if="showNotifications"
            @click="toggleNotifications"
            :disabled="isLoadingNotifications"
          >
            <FontAwesomeIcon 
              :icon="isLoadingNotifications ? 'spinner' : 'bell'" 
              :spin="isLoadingNotifications"
            />
            <span
              class="notification-badge"
              v-if="unreadCount > 0 && !isLoadingNotifications"
              :class="{ pulse: hasNewNotification }"
            >
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </button>

          <button class="action-btn profile" v-if="showProfile" @click="toggleProfile">
            <FontAwesomeIcon icon="user-circle" />
          </button>
        </div>
      </div>
    </div>

    <div class="dropdown notifications-dropdown" v-if="showNotificationsDropdown">
      <div class="dropdown-header">
        <h3>Notificações</h3>
        <div class="dropdown-actions">
          <button
            class="mark-all-read"
            @click="confirmMarkAllAsRead"
            v-if="notifications.length > 0"
            :disabled="unreadCount === 0 || isProcessing"
            title="Marcar todas como lidas"
          >
            <FontAwesomeIcon 
              :icon="isProcessing ? 'spinner' : 'check-double'" 
              :spin="isProcessing"
            />
            {{ isProcessing ? 'Processando...' : 'Marcar todas como lidas' }}
          </button>
          <button
            class="clear-read"
            @click="confirmClearReadNotifications"
            v-if="notifications.length > 0"
            :disabled="isProcessing"
            title="Limpar notificações lidas"
          >
            <FontAwesomeIcon 
              :icon="isProcessing ? 'spinner' : 'broom'" 
              :spin="isProcessing"
            />
            {{ isProcessing ? 'Limpando...' : 'Limpar lidas' }}
          </button>
          <button class="close-dropdown" @click="showNotificationsDropdown = false">
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
      </div>

      <div class="dropdown-content">
        <!-- Loading state para notificações -->
        <div v-if="isLoadingNotifications" class="loading-notifications">
          <div class="spinner-small"></div>
          <p>Carregando notificações...</p>
        </div>

        <div v-else-if="!isConnected" class="connection-info">
          <div class="connection-warning">
            <FontAwesomeIcon icon="wifi-slash" />
            <span>Desconectado - Notificações podem não estar atualizadas</span>
            <button @click="reconnectWebSocket" class="reconnect-btn" :disabled="isReconnecting">
              <FontAwesomeIcon 
                :icon="isReconnecting ? 'spinner' : 'sync-alt'" 
                :spin="isReconnecting"
              />
              {{ isReconnecting ? 'Conectando...' : 'Reconectar' }}
            </button>
          </div>
        </div>

        <div v-else>
          <div
            class="notification-item"
            v-for="notification in notifications"
            :key="notification.id"
            :class="{
              unread: !notification.read,
              'notification-processing': notification.processing,
            }"
            @click="onNotificationClick(notification)"
          >
            <div class="notification-icon" :class="`icon-${notification.icon}`">
              <FontAwesomeIcon :icon="notification.icon" />
            </div>

            <div class="notification-text">
              <p class="notification-title">{{ notification.title }}</p>
              <p class="notification-message">{{ notification.message }}</p>
              <span class="notification-time">{{ notification.time }}</span>
            </div>

            <div class="notification-actions">
              <button
                v-if="!notification.read"
                class="mark-as-read"
                @click.stop="markSingleAsRead(notification)"
                title="Marcar como lida"
                :disabled="notification.processing"
              >
                <FontAwesomeIcon
                  :icon="notification.processing ? 'spinner' : 'check'"
                  :spin="notification.processing"
                />
              </button>

              <button
                class="remove-notification"
                @click.stop="confirmRemoveNotification(notification)"
                title="Remover notificação"
                :disabled="notification.processing"
              >
                <FontAwesomeIcon icon="times" />
              </button>
            </div>

            <div class="notification-status" v-if="!notification.read">
              <span class="unread-dot"></span>
            </div>
          </div>

          <div class="no-notifications" v-if="notifications.length === 0">
            <FontAwesomeIcon icon="inbox" />
            <p>Nenhuma notificação não lida</p>
            <small v-if="isConnected">Você está em dia! 🎉</small>
            <small v-else>Verifique sua conexão</small>
          </div>

          <div class="notifications-footer" v-if="notifications.length > 0">
            <div class="notification-count">
              <span>{{ unreadCount }} não lida{{ unreadCount !== 1 ? 's' : '' }}</span>
              <span class="total-count">de {{ notifications.length }} total</span>
            </div>
            <button 
              class="sync-notifications" 
              @click="syncNotifications" 
              title="Sincronizar"
              :disabled="isSyncing"
            >
              <FontAwesomeIcon 
                :icon="isSyncing ? 'spinner' : 'sync-alt'" 
                :spin="isSyncing"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="dropdown profile-dropdown" v-if="showProfileDropdown">
      <div class="dropdown-header">
        <h3>Perfil</h3>
        <button class="close-dropdown" @click="showProfileDropdown = false">
          <FontAwesomeIcon icon="times" />
        </button>
      </div>
      <div class="dropdown-content">
        <div class="profile-info">
          <div class="profile-avatar">
            <div class="avatar-circle">
              <span class="avatar-initials">{{ getUserInitials() }}</span>
            </div>
          </div>
          <div class="profile-details">
            <p class="profile-name">{{ currentUserName }}</p>
            <p class="profile-email">{{ currentUserEmail }}</p>
            <span class="profile-status" :class="`status-${currentUserStatus}`">
              {{ formatUserStatus(currentUserStatus) }}
            </span>
          </div>
        </div>
        <div class="profile-actions">
          <button class="profile-action" @click="editProfile">
            <FontAwesomeIcon icon="edit" />
            Editar Perfil
          </button>
          <button class="profile-action logout-btn" @click="confirmLogout">
            <FontAwesomeIcon icon="sign-out-alt" />
            Sair
          </button>
        </div>
      </div>
    </div>

    <!-- Resto do componente permanece igual -->
    <VOffcanvas
      v-model="showNotificationOffcanvas"
      side="right"
      width="900px"
      :title="`Detalhes - ${selectedNotificationData?.NOME || 'Notificação'}`"
    >
      <!-- Conteúdo do Offcanvas permanece igual -->
      <div v-if="selectedNotificationData" class="offcanvas-content">
        <!-- Header com informações principais -->
        <div class="detail-header">
          <div
            class="detail-badge"
            :class="
              selectedNotificationData.ATIVO === 'Ativado' ? 'badge-active' : 'badge-inactive'
            "
          >
            {{ selectedNotificationData.ATIVO }}
          </div>
          <h2>{{ selectedNotificationData.NOME }}</h2>
          <p class="detail-id">ID: {{ selectedNotificationData.RECID }}</p>
        </div>

        <!-- Seções de Informações -->
        <div class="detail-section notification-info">
          <h3 class="section-title">Informações da Notificação</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Operação:</label>
              <span
                class="operation-badge"
                :class="`operation-${selectedNotificationData.OPERACAO?.toLowerCase()}`"
              >
                {{ selectedNotificationData.OPERACAO || 'N/A' }}
              </span>
            </div>
            <div class="detail-item">
              <label>Tabela:</label>
              <span>{{ selectedNotificationData.TABELA || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <label>Data/Hora:</label>
              <span>{{ formatDate(selectedNotificationData.TIMESTAMP_NOTIFICACAO) }}</span>
            </div>
            <div class="detail-item">
              <label>Usuário:</label>
              <span>{{ selectedNotificationData.RECMODIFIEDBY || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Outras seções permanecem iguais -->
        <div class="detail-section">
          <h3 class="section-title">Informações do Registro</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Nome:</label>
              <span>{{ selectedNotificationData.NOME || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <label>ID do Registro:</label>
              <span>{{ selectedNotificationData.RECID || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <label>Status:</label>
              <span
                :class="
                  selectedNotificationData.ATIVO === 'Ativado' ? 'status-active' : 'status-inactive'
                "
              >
                {{ selectedNotificationData.ATIVO }}
              </span>
            </div>
            <div class="detail-item">
              <label>Modificado por:</label>
              <span>{{ selectedNotificationData.RECMODIFIEDBY || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="section-title">Descrição</h3>
          <div class="detail-description">
            {{ selectedNotificationData.DESCRICAO || 'Sem descrição disponível' }}
          </div>
        </div>

        <div v-if="selectedNotificationData.SQL_CODE" class="detail-section">
          <h3 class="section-title">Código SQL</h3>
          <pre class="sql-code">{{ selectedNotificationData.SQL_CODE }}</pre>
        </div>

        <div class="detail-section">
          <h3 class="section-title">Metadados</h3>
          <div class="detail-grid">
            <div class="detail-item" v-if="selectedNotificationData.RECCREATEDBY">
              <label>Criado por:</label>
              <span>{{ selectedNotificationData.RECCREATEDBY }}</span>
            </div>
            <div class="detail-item" v-if="selectedNotificationData.RECCREATEDON">
              <label>Data de Criação:</label>
              <span>{{ formatDate(selectedNotificationData.RECCREATEDON) }}</span>
            </div>
            <div class="detail-item" v-if="selectedNotificationData.RECMODIFIEDON">
              <label>Última Modificação:</label>
              <span>{{ formatDate(selectedNotificationData.RECMODIFIEDON) }}</span>
            </div>
            <div class="detail-item" v-if="selectedNotificationData.RECVERSION">
              <label>Versão:</label>
              <span>v{{ selectedNotificationData.RECVERSION }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="loading-state">
        <div class="spinner"></div>
        <p>Carregando detalhes...</p>
      </div>
    </VOffcanvas>
  </nav>
</template>

<script>
import './VNav.css'
import websocketService from '@/services/websocketService'
import notificationStore from '@/store/notificationStore'
import VOffcanvas from '@/components/Offcanvas/VOffcanvas.vue'
import { useSuccess, useQuestion, useError } from '@/hooks/useAlerts.js'
import { useAuthStore } from '@/store/auth.js'

export default {
  name: 'VNavbar',

  components: {
    VOffcanvas,
  },

  props: {
    isCollapsed: {
      type: Boolean,
      default: false,
    },
    showSearch: {
      type: Boolean,
      default: true,
    },
    showNotifications: {
      type: Boolean,
      default: true,
    },
    showProfile: {
      type: Boolean,
      default: true,
    },
    customBreadcrumbs: {
      type: Array,
      default: () => [],
    }
  },

  emits: ['search', 'profile-action', 'notification-click', 'notification-remove'],

  data() {
    return {
      searchQuery: '',
      showNotificationsDropdown: false,
      showProfileDropdown: false,
      showNotificationOffcanvas: false,
      selectedNotificationData: null,
      isConnected: false,
      hasNewNotification: false,
      notificationStore: notificationStore,
      
      // Estados de loading
      isLoadingNotifications: false,
      isProcessing: false,
      isReconnecting: false,
      isSyncing: false,

      // Auth store
      authStore: useAuthStore(),
    }
  },

  computed: {
    notifications() {
      return this.notificationStore.notifications
    },

    unreadCount() {
      return this.notificationStore.unreadCount
    },

    // Dados do usuário atual do token
    currentUserName() {
      return this.authStore.user?.nome || 'Usuário'
    },

    currentUserEmail() {
      return this.authStore.user?.email || 'email@exemplo.com'
    },

    currentUserStatus() {
      return this.authStore.user?.status?.toLowerCase() || 'ativo'
    },

    breadcrumbs() {
      if (this.customBreadcrumbs.length > 0) {
        return this.customBreadcrumbs
      }

      const pathSegments = this.$route.path.split('/').filter((segment) => segment)
      const crumbs = []

      let currentPath = ''
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`

        const routeInfo = this.routeMap[segment] || { name: segment }
        crumbs.push({
          name: routeInfo.name || segment.charAt(0).toUpperCase() + segment.slice(1),
          path: index === pathSegments.length - 1 ? null : currentPath,
        })
      })

      return crumbs
    },

    currentPageTitle() {
      const routeName = this.$route.name
      const routeInfo = this.routeMap[routeName]
      return routeInfo?.name || this.$route.meta?.title || 'Página'
    },

    currentPageDescription() {
      const routeName = this.$route.name
      const routeInfo = this.routeMap[routeName]
      return routeInfo?.description || this.$route.meta?.description
    },

    routeMap() {
      return {
        main: {
          name: 'Dashboard',
          description: "KPI's de gestão",
        },
        auditlog: {
          name: 'Auditoria',
          description: 'Gestão de Informações',
        },
        users: {
          name: 'Usuários',
          description: 'Informações de Usuários',
        },
      }
    },
  },

  methods: {
    onSearch() {
      this.$emit('search', this.searchQuery)
    },

    toggleNotifications() {
      this.showNotificationsDropdown = !this.showNotificationsDropdown
      this.showProfileDropdown = false
      
      if (this.showNotificationsDropdown && this.notifications.length === 0) {
        this.loadNotifications()
      }
    },

    toggleProfile() {
      this.showProfileDropdown = !this.showProfileDropdown
      this.showNotificationsDropdown = false
    },

    editProfile() {
      this.$emit('profile-action', 'edit')
      this.showProfileDropdown = false
    },

    async confirmLogout() {
      const confirmed = await useQuestion({
        title: 'Confirmar Logout',
        text: 'Tem certeza que deseja sair do sistema?',
        icon: 'warning',
        confirmButtonText: 'Sim, sair',
        cancelButtonText: 'Cancelar',
      })

      if (confirmed) {
        this.isProcessing = true
        try {
          await this.authStore.logout()
          await useSuccess({ title: 'Logout realizado com sucesso!' })
          this.$router.push('/login')
        } catch (error) {
          await useError({
            title: 'Erro no logout',
            text: error.message || 'Erro ao fazer logout'
          })
        } finally {
          this.isProcessing = false
        }
      }
    },

    // Método principal para clique em notificação
    async onNotificationClick(notification) {
      if (notification.processing) return

      try {
        notification.processing = true

        const success = await this.notificationStore.markAsRead(notification.id)

        if (success) {
          this.selectedNotificationData = notification.rowData
          this.showNotificationOffcanvas = true
          this.showNotificationsDropdown = false
          this.$emit('notification-click', notification)
          
          await useSuccess({ title: 'Notificação marcada como lida' })
        } else {
          await useError({ 
            title: 'Erro', 
            text: 'Erro ao marcar notificação como lida' 
          })
        }
      } catch (error) {
        console.error('Erro ao processar clique na notificação:', error)
        await useError({ 
          title: 'Erro', 
          text: 'Erro ao processar notificação' 
        })
      } finally {
        notification.processing = false
      }
    },

    async markSingleAsRead(notification) {
      if (notification.processing) return

      try {
        notification.processing = true
        const success = await this.notificationStore.markAsRead(notification.id)

        if (success) {
          await useSuccess({ title: 'Notificação marcada como lida' })
        } else {
          await useError({ 
            title: 'Erro', 
            text: 'Erro ao marcar notificação como lida' 
          })
        }
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error)
        await useError({ 
          title: 'Erro', 
          text: 'Erro ao processar notificação' 
        })
      } finally {
        notification.processing = false
      }
    },

    async confirmRemoveNotification(notification) {
      const confirmed = await useQuestion({
        title: 'Remover Notificação',
        text: `Tem certeza que deseja remover a notificação "${notification.title}"?`,
        icon: 'warning',
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar',
      })

      if (confirmed) {
        this.removeNotification(notification.id)
        await useSuccess({ title: 'Notificação removida' })
      }
    },

    removeNotification(id) {
      this.notificationStore.removeNotification(id)
      this.$emit('notification-remove', id)

      if (this.selectedNotificationData && this.selectedNotificationData.RECID === id) {
        this.showNotificationOffcanvas = false
        this.selectedNotificationData = null
      }
    },

    async confirmMarkAllAsRead() {
      if (this.unreadCount === 0) {
        await useError({ 
          title: 'Aviso', 
          text: 'Nenhuma notificação não lida encontrada' 
        })
        return
      }

      const confirmed = await useQuestion({
        title: 'Marcar Todas Como Lidas',
        text: `Tem certeza que deseja marcar todas as ${this.unreadCount} notificações como lidas?`,
        icon: 'question',
        confirmButtonText: 'Sim, marcar todas',
        cancelButtonText: 'Cancelar',
      })

      if (confirmed) {
        await this.markAllAsRead()
      }
    },

    async markAllAsRead() {
      this.isProcessing = true
      try {
        const previousCount = this.unreadCount
        await this.notificationStore.markAllAsRead()
        this.showNotificationsDropdown = false

        await useSuccess({
          title: `${previousCount} notificação${previousCount > 1 ? 'ões' : ''} marcada${previousCount > 1 ? 's' : ''} como lida${previousCount > 1 ? 's' : ''}`
        })
      } catch (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error)
        await useError({ 
          title: 'Erro', 
          text: 'Erro ao marcar notificações como lidas' 
        })
      } finally {
        this.isProcessing = false
      }
    },

    async confirmClearReadNotifications() {
      const readCount = this.notificationStore.allNotifications.filter((n) => n.read).length

      if (readCount === 0) {
        await useError({ 
          title: 'Aviso', 
          text: 'Nenhuma notificação lida para limpar' 
        })
        return
      }

      const confirmed = await useQuestion({
        title: 'Limpar Notificações Lidas',
        text: `Tem certeza que deseja remover todas as ${readCount} notificações lidas?`,
        icon: 'warning',
        confirmButtonText: 'Sim, limpar',
        cancelButtonText: 'Cancelar',
      })

      if (confirmed) {
        this.clearReadNotifications(readCount)
      }
    },

    clearReadNotifications(readCount) {
      this.notificationStore.clearReadNotifications()

      if (this.notificationStore.unreadCount === 0) {
        this.showNotificationOffcanvas = false
        this.selectedNotificationData = null
      }

      useSuccess({
        title: `${readCount} notificação${readCount > 1 ? 'ões' : ''} lida${readCount > 1 ? 's' : ''} removida${readCount > 1 ? 's' : ''}`
      })
    },

    async syncNotifications() {
      this.isSyncing = true
      try {
        await this.notificationStore.loadUnreadNotifications()
        await useSuccess({ title: 'Notificações sincronizadas' })
      } catch (error) {
        console.error('Erro ao sincronizar notificações:', error)
        await useError({ 
          title: 'Erro', 
          text: 'Erro ao sincronizar notificações' 
        })
      } finally {
        this.isSyncing = false
      }
    },

    async reconnectWebSocket() {
      this.isReconnecting = true
      try {
        websocketService.reconnect()
        // Aguarda um pouco para dar tempo da conexão
        setTimeout(() => {
          this.isReconnecting = false
          if (this.isConnected) {
            useSuccess({ title: 'Reconectado com sucesso!' })
          }
        }, 2000)
      } catch (error) {
        this.isReconnecting = false
        await useError({ 
          title: 'Erro', 
          text: 'Erro ao reconectar' 
        })
      }
    },

    async loadNotifications() {
      this.isLoadingNotifications = true
      try {
        await this.notificationStore.loadUnreadNotifications()
      } catch (error) {
        console.error('Erro ao carregar notificações:', error)
        await useError({ 
          title: 'Erro', 
          text: 'Erro ao carregar notificações' 
        })
      } finally {
        this.isLoadingNotifications = false
      }
    },

    handleClickOutside(event) {
      if (
        !event.target.closest('.notifications-dropdown') &&
        !event.target.closest('.notifications') &&
        !event.target.closest('.offcanvas')
      ) {
        this.showNotificationsDropdown = false
      }
      if (!event.target.closest('.profile-dropdown') && !event.target.closest('.profile')) {
        this.showProfileDropdown = false
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'

      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR')
      } catch {
        return dateString
      }
    },

    handleNotification(data) {
      if (data.Readed === false || data.Readed === undefined) {
        this.notificationStore.addNotification(data)

        this.hasNewNotification = true
        setTimeout(() => {
          this.hasNewNotification = false
        }, 1000)

        useSuccess({ title: `Nova notificação: ${data.tabela || 'Registro'}` })
      }
    },

    handleConnectionStatus(status) {
      this.isConnected = status

      if (status) {
        useSuccess({ title: 'Conectado ao servidor de notificações' })
      } else {
        useError({ 
          title: 'Desconectado', 
          text: 'Desconectado do servidor de notificações' 
        })
      }
    },

    getUserInitials() {
      return this.authStore.userInitials || 'U'
    },

    formatUserStatus(status) {
      const statusMap = {
        ativo: 'Ativo',
        pendente: 'Pendente',
        bloqueado: 'Bloqueado'
      }
      return statusMap[status] || 'Ativo'
    },

    debugNotifications() {
      console.log('=== DEBUG NOTIFICAÇÕES ===')
      console.log('Total de notificações:', this.notificationStore.allNotifications.length)
      console.log('Notificações não lidas:', this.unreadCount)
      console.log('Notificações visíveis:', this.notifications.length)
      console.log('WebSocket conectado:', this.isConnected)
      console.log('Usuário atual:', this.currentUserName)
      console.log('===========================')
    },
  },

  watch: {
    $route() {
      this.showNotificationsDropdown = false
      this.showProfileDropdown = false
    },
  },

  mounted() {
    websocketService.connect()
    websocketService.on('notification', this.handleNotification)
    websocketService.on('connected', this.handleConnectionStatus)
    document.addEventListener('click', this.handleClickOutside)
    
    // Carrega notificações iniciais
    this.loadNotifications()
  },

  unmounted() {
    websocketService.off('notification', this.handleNotification)
    websocketService.off('connected', this.handleConnectionStatus)
    document.removeEventListener('click', this.handleClickOutside)
  },
}
</script>

<style scoped>
/* Estilos para loading */
.loading-notifications {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  gap: 1rem;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 16px;
}

/* Estilos para o avatar do usuário */
.avatar-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
}

.avatar-initials {
  text-transform: uppercase;
}

/* Estilos para status do usuário */
.profile-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.5rem;
}

.status-ativo {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-pendente {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-bloqueado {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Estilos melhorados para botões com loading */
.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mark-all-read:disabled,
.clear-read:disabled,
.reconnect-btn:disabled,
.sync-notifications:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logout-btn:hover {
  background-color: #dc3545;
  color: white;
}

/* Animações melhoradas */
.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Transições suaves */
.notification-item {
  transition: all 0.3s ease;
}

.notification-item:hover {
  background-color: #f8fafc;
  transform: translateX(4px);
}

.notification-processing {
  opacity: 0.7;
  pointer-events: none;
}

/* Melhorias para responsividade */
@media (max-width: 768px) {
  .dropdown-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .mark-all-read,
  .clear-read {
    font-size: 0.8rem;
    padding: 0.5rem;
  }
  
  .avatar-circle {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}
</style>
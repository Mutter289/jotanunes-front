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
          >
            <FontAwesomeIcon icon="bell" />
            <span
              class="notification-badge"
              v-if="unreadCount > 0"
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
            @click="markAllAsRead"
            v-if="notifications.length > 0"
            :disabled="unreadCount === 0"
            title="Marcar todas como lidas"
          >
            <FontAwesomeIcon icon="check-double" />
            Marcar todas como lidas
          </button>
          <button
            class="clear-read"
            @click="clearReadNotifications"
            v-if="notifications.length > 0"
            title="Limpar notificações lidas"
          >
            <FontAwesomeIcon icon="broom" />
            Limpar lidas
          </button>
          <button class="close-dropdown" @click="showNotificationsDropdown = false">
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
      </div>

      <div class="dropdown-content">
        <div class="connection-info" v-if="!isConnected">
          <div class="connection-warning">
            <FontAwesomeIcon icon="wifi-slash" />
            <span>Desconectado - Notificações podem não estar atualizadas</span>
            <button @click="reconnectWebSocket" class="reconnect-btn">
              <FontAwesomeIcon icon="sync-alt" />
            </button>
          </div>
        </div>
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
              @click.stop="removeNotification(notification.id)"
              title="Remover notificação"
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
          <button class="sync-notifications" @click="syncNotifications" title="Sincronizar">
            <FontAwesomeIcon icon="sync-alt" />
          </button>
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
            <FontAwesomeIcon icon="user-circle" />
          </div>
          <div class="profile-details">
            <p class="profile-name">{{ userName }}</p>
            <p class="profile-email">{{ userEmail }}</p>
          </div>
        </div>
        <div class="profile-actions">
          <button class="profile-action" @click="editProfile">
            <FontAwesomeIcon icon="edit" />
            Editar Perfil
          </button>
          <button class="profile-action" @click="logout">
            <FontAwesomeIcon icon="sign-out-alt" />
            Sair
          </button>
        </div>
      </div>
    </div>

    <VOffcanvas
      v-model="showNotificationOffcanvas"
      side="right"
      width="900px"
      :title="`Detalhes - ${selectedNotificationData?.NOME || 'Notificação'}`"
    >
      <!-- Conteúdo do Offcanvas -->
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

        <!-- Seção de Informações da Notificação -->
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

        <!-- Seção de Informações Gerais -->
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

        <!-- Seção de Descrição -->
        <div class="detail-section">
          <h3 class="section-title">Descrição</h3>
          <div class="detail-description">
            {{ selectedNotificationData.DESCRICAO || 'Sem descrição disponível' }}
          </div>
        </div>

        <!-- Seção de Código SQL (se existir) -->
        <div v-if="selectedNotificationData.SQL_CODE" class="detail-section">
          <h3 class="section-title">Código SQL</h3>
          <pre class="sql-code">{{ selectedNotificationData.SQL_CODE }}</pre>
        </div>

        <!-- Seção de Metadados -->
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
    },
    userName: {
      type: String,
      default: 'Gustavo Trindade',
    },
    userEmail: {
      type: String,
      default: 'gustavo@exemplo.com',
    },
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
    }
  },

  computed: {
    notifications() {
      return this.notificationStore.notifications
    },

    unreadCount() {
      return this.notificationStore.unreadCount
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
    },

    toggleProfile() {
      this.showProfileDropdown = !this.showProfileDropdown
      this.showNotificationsDropdown = false
    },

    editProfile() {
      this.$emit('profile-action', 'edit')
      this.showProfileDropdown = false
    },

    logout() {
      this.$emit('profile-action', 'logout')
      this.showProfileDropdown = false
    },

    // Método principal para clique em notificação
    async onNotificationClick(notification) {
      if (notification.processing) return // Evita cliques duplos

      try {
        // Marca como processando
        notification.processing = true

        // Marca como lida no backend e localmente
        const success = await this.notificationStore.markAsRead(notification.id)

        if (success) {
          // Abre os detalhes da notificação
          this.selectedNotificationData = notification.rowData
          this.showNotificationOffcanvas = true

          // Fecha o dropdown de notificações
          this.showNotificationsDropdown = false

          this.$emit('notification-click', notification)

          // Feedback visual opcional
          this.showToast(`Notificação marcada como lida`, 'success')
        } else {
          this.showToast('Erro ao marcar notificação como lida', 'error')
        }
      } catch (error) {
        console.error('Erro ao processar clique na notificação:', error)
        this.showToast('Erro ao processar notificação', 'error')
      } finally {
        notification.processing = false
      }
    },

    // Marca uma notificação individual como lida sem abrir detalhes
    async markSingleAsRead(notification) {
      if (notification.processing) return

      try {
        notification.processing = true
        const success = await this.notificationStore.markAsRead(notification.id)

        if (success) {
          this.showToast(`Notificação marcada como lida`, 'success')
        } else {
          this.showToast('Erro ao marcar notificação como lida', 'error')
        }
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error)
        this.showToast('Erro ao processar notificação', 'error')
      } finally {
        notification.processing = false
      }
    },

    // Carrega detalhes adicionais se necessário
    async loadNotificationDetails(id) {
      try {
        // Opcional: buscar mais detalhes do backend se necessário
        // const response = await axios.get(`http://localhost:8000/audfv/${id}`)
        // if (response.data) {
        //   this.selectedNotificationData = {
        //     ...this.selectedNotificationData,
        //     ...response.data,
        //   }
        // }
      } catch (e) {
        console.error('Erro ao carregar detalhes da notificação:', e)
      }
    },

    // Remove uma notificação específica (apenas do array local)
    removeNotification(id) {
      this.notificationStore.removeNotification(id)
      this.$emit('notification-remove', id)

      // Se a notificação removida estava sendo visualizada, fecha o offcanvas
      if (this.selectedNotificationData && this.selectedNotificationData.RECID === id) {
        this.showNotificationOffcanvas = false
        this.selectedNotificationData = null
      }

      this.showToast('Notificação removida', 'info')
    },

    // Marca todas as notificações como lidas
    async markAllAsRead() {
      if (this.unreadCount === 0) {
        this.showToast('Nenhuma notificação não lida encontrada', 'info')
        return
      }

      try {
        const previousCount = this.unreadCount
        await this.notificationStore.markAllAsRead()

        // Fecha o dropdown após marcar todas
        this.showNotificationsDropdown = false

        this.showToast(
          `${previousCount} notificação${previousCount > 1 ? 'ões' : ''} marcada${previousCount > 1 ? 's' : ''} como lida${previousCount > 1 ? 's' : ''}`,
          'success',
        )
      } catch (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error)
        this.showToast('Erro ao marcar notificações como lidas', 'error')
      }
    },

    // Limpa notificações lidas do array local
    clearReadNotifications() {
      const readCount = this.notificationStore.allNotifications.filter((n) => n.read).length

      if (readCount === 0) {
        this.showToast('Nenhuma notificação lida para limpar', 'info')
        return
      }

      this.notificationStore.clearReadNotifications()

      // Se não há mais notificações não lidas, fecha o offcanvas
      if (this.notificationStore.unreadCount === 0) {
        this.showNotificationOffcanvas = false
        this.selectedNotificationData = null
      }

      this.showToast(
        `${readCount} notificação${readCount > 1 ? 'ões' : ''} lida${readCount > 1 ? 's' : ''} removida${readCount > 1 ? 's' : ''}`,
        'info',
      )
    },

    // Limpa todas as notificações (lidas e não lidas)
    clearAllNotifications() {
      const totalCount = this.notificationStore.allNotifications.length

      if (totalCount === 0) {
        this.showToast('Nenhuma notificação para limpar', 'info')
        return
      }

      this.notificationStore.clearAll()

      // Fecha o offcanvas e dropdown
      this.showNotificationOffcanvas = false
      this.selectedNotificationData = null
      this.showNotificationsDropdown = false

      this.showToast(
        `${totalCount} notificação${totalCount > 1 ? 'ões' : ''} removida${totalCount > 1 ? 's' : ''}`,
        'info',
      )
    },

    // Sincroniza notificações com o backend
    async syncNotifications() {
      try {
        await this.notificationStore.loadUnreadNotifications()
        this.showToast('Notificações sincronizadas', 'success')
      } catch (error) {
        console.error('Erro ao sincronizar notificações:', error)
        this.showToast('Erro ao sincronizar notificações', 'error')
      }
    },

    // Reconecta o WebSocket
    reconnectWebSocket() {
      websocketService.reconnect()
      this.showToast('Tentando reconectar...', 'info')
    },

    // Manipula cliques fora dos dropdowns
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

    // Formatação de datas
    formatDate(dateString) {
      if (!dateString) return 'N/A'

      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR')
      } catch {
        return dateString
      }
    },

    // WebSocket handlers
    handleNotification(data) {
      // Adiciona apenas se não foi lida (Readed = false ou undefined)
      if (data.Readed === false || data.Readed === undefined) {
        this.notificationStore.addNotification(data)

        // Animação de nova notificação
        this.hasNewNotification = true
        setTimeout(() => {
          this.hasNewNotification = false
        }, 1000)

        // Mostrar toast para nova notificação
        this.showToast(`Nova notificação: ${data.tabela || 'Registro'}`, 'info')
      }
    },

    handleConnectionStatus(status) {
      this.isConnected = status

      if (status) {
        this.showToast('Conectado ao servidor de notificações', 'success')
      } else {
        this.showToast('Desconectado do servidor de notificações', 'warning')
      }
    },

    // Solicita sincronização quando conecta
    handleSyncNotifications() {
      this.syncNotifications()
    },

    // Exibe toast/notificação
    showToast(message, type = 'info') {
      console.log(`[${type.toUpperCase()}] ${message}`)

      // Implementar toast library se desejar
      // Exemplo com vue-toastification:
      // this.$toast[type](message)

      // Ou implementar sistema próprio de toast
      // this.$emit('show-toast', { message, type })
    },

    // Método de debug para verificar status
    debugNotifications() {
      console.log('=== DEBUG NOTIFICAÇÕES ===')
      console.log('Total de notificações:', this.notificationStore.allNotifications.length)
      console.log('Notificações não lidas:', this.unreadCount)
      console.log('Notificações visíveis:', this.notifications.length)
      console.log('WebSocket conectado:', this.isConnected)
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
    this.notificationStore.loadUnreadNotifications()
  },

  unmounted() {
    websocketService.off('notification', this.handleNotification)
    websocketService.off('connected', this.handleConnectionStatus)
    document.removeEventListener('click', this.handleClickOutside)
  },
}
</script>

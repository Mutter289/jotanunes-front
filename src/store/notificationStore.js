import { reactive } from 'vue'

const state = reactive({
  notifications: [],
  maxNotifications: 50,
})

const notificationStore = {
  // Getters
  get notifications() {
    // Retorna apenas notificações não lidas (Readed = false)
    return state.notifications.filter((n) => !n.read)
  },

  get unreadCount() {
    // Conta apenas notificações não lidas
    return state.notifications.filter((n) => !n.read).length
  },

  get allNotifications() {
    // Para debug ou outras funcionalidades que precisem de todas
    return state.notifications
  },

  // Actions
  addNotification(data) {
    // SEMPRE usar o NotificationID do banco como ID principal
    const notificationId = data.NotificationID || data.id

    // Evita duplicatas
    const existingNotification = state.notifications.find(
      (n) => n.notificationId === notificationId,
    )
    if (existingNotification) {
      console.log('Notificação já existe:', notificationId)
      return
    }

    const notification = {
      id: notificationId, // USA O ID REAL DO BANCO
      notificationId: notificationId, // ID do banco para marcar como lida
      icon: this.getIconByOperation(data.operacao),
      title: this.getTitleByOperation(data.operacao, data.tabela),
      message: this.formatMessage(data),
      time: this.formatTime(data.data_hora || data.timestamp),
      data: data,
      read: data.Readed === true, // CORRIGIDO: verifica explicitamente se é true
      processing: false, // Para controle de UI
      // Adiciona os dados completos para o offcanvas
      rowData: this.formatRowData(data),
    }

    // Adiciona no início da lista
    state.notifications.unshift(notification)

    // Limita o número de notificações
    if (state.notifications.length > state.maxNotifications) {
      state.notifications = state.notifications.slice(0, state.maxNotifications)
    }

    // Dispara evento para som ou outras ações apenas se não foi lida
    if (!notification.read) {
      this.playNotificationSound()
    }

    console.log('Notificação adicionada:', notification.title, 'Read:', notification.read)
  },

  // Formata os dados para serem compatíveis com o offcanvas
  formatRowData(data) {
    const dados = typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados || {}

    return {
      RECID: data.registro_id || data.id || dados.RECID || data.NotificationID || 'N/A',
      NOME: dados.NOME || data.tabela || 'Registro',
      DESCRICAO:
        dados.DESCRICAO ||
        `${data.operacao || 'INSERT'} realizada por ${data.usuario || 'Sistema'}`,
      ATIVO: dados.ATIVO !== undefined ? (dados.ATIVO ? 'Ativado' : 'Desativado') : 'N/A',
      RECMODIFIEDBY: data.usuario || dados.RECMODIFIEDBY || 'Sistema',
      RECCREATEDBY: dados.RECCREATEDBY || data.usuario || 'Sistema',
      RECCREATEDON: dados.RECCREATEDON || data.data_hora,
      RECMODIFIEDON: data.data_hora || dados.RECMODIFIEDON,
      RECVERSION: dados.RECVERSION || 1,
      SQL_CODE: dados.SQL_CODE || null,
      // Adiciona informações específicas da notificação
      OPERACAO: data.operacao || 'INSERT',
      TABELA: data.tabela || data.TableName,
      TIMESTAMP_NOTIFICACAO: data.data_hora || new Date().toISOString(),
      // Preserva todos os dados originais
      ...dados,
    }
  },

  getIconByOperation(operation) {
    const icons = {
      INSERT: 'plus-circle',
      UPDATE: 'edit',
      DELETE: 'trash',
      ERROR: 'exclamation-triangle',
      SUCCESS: 'check-circle',
      INFO: 'info-circle',
    }
    return icons[operation] || 'bell'
  },

  getTitleByOperation(operation, table) {
    const titles = {
      INSERT: `Novo registro em ${table}`,
      UPDATE: `Atualização em ${table}`,
      DELETE: `Exclusão em ${table}`,
      ERROR: 'Erro no sistema',
      SUCCESS: 'Operação realizada',
      INFO: 'Informação',
    }
    return titles[operation] || `Notificação de ${table || 'Sistema'}`
  },

  formatMessage(data) {
    if (data.dados) {
      const dados = typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados
      const keys = Object.keys(dados).slice(0, 2)
      const preview = keys.map((key) => `${key}: ${dados[key]}`).join(', ')
      return preview || 'Registro modificado'
    }
    return `ID: ${data.registro_id || data.NotificationID || 'N/A'} - Usuário: ${data.usuario || data.LoginName || 'Sistema'}`
  },

  formatTime(datetime) {
    if (!datetime) return 'Agora'

    const date = new Date(datetime)
    const now = new Date()
    const diff = now - date

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'Agora'
    if (minutes < 60) return `${minutes} min atrás`
    if (hours < 24) return `${hours} hora${hours > 1 ? 's' : ''} atrás`
    if (days < 7) return `${days} dia${days > 1 ? 's' : ''} atrás`

    return date.toLocaleDateString('pt-BR')
  },

  // Marca como lida tanto localmente quanto no banco
  async markAsRead(id) {
    const notification = state.notifications.find((n) => n.id === id || n.notificationId === id)
    if (notification && !notification.read) {
      try {
        // USA SEMPRE o notificationId (ID real do banco)
        const backendId = notification.notificationId
        console.log(`Tentando marcar notificação ${backendId} como lida...`)

        const response = await fetch(
          `http://192.168.195.162:8000/notifications/read/${backendId}`,
          {
            method: 'POST',
          },
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Erro HTTP ${response.status}:`, errorText)
          throw new Error(`Erro HTTP: ${response.status}`)
        }

        // Marca como lida localmente
        notification.read = true
        console.log(`Notificação ${backendId} marcada como lida com sucesso`)
        return true
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error)
        return false
      }
    }
    return false
  },

  // Marca todas como lidas
  async markAllAsRead() {
    const unreadNotifications = state.notifications.filter((n) => !n.read)
    if (unreadNotifications.length === 0) return

    try {
      // Marca todas no backend usando fetch
      const base = (window.API_BASE_URL || '').startsWith('http')
        ? window.API_BASE_URL
        : `http://${window.API_BASE_URL || 'localhost:8000'}`
      const promises = unreadNotifications.map((notification) => {
        const notificationId = notification.notificationId || notification.id
        return fetch(`${base}/notifications/read/${notificationId}`, {
          method: 'POST',
        })
      })

      await Promise.all(promises)

      // Marca todas localmente
      unreadNotifications.forEach((notification) => {
        notification.read = true
      })

      console.log(`${unreadNotifications.length} notificações marcadas como lidas`)
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
    }
  },

  // Remove apenas uma notificação específica (remove do array local)
  removeNotification(id) {
    const index = state.notifications.findIndex((n) => n.id === id)
    if (index > -1) {
      state.notifications.splice(index, 1)
    }
  },

  // Limpa todas as notificações localmente
  clearAll() {
    state.notifications = []
  },

  // Remove apenas as notificações lidas do array local
  clearReadNotifications() {
    state.notifications = state.notifications.filter((n) => !n.read)
  },

  // Busca uma notificação pelo ID
  getNotificationById(id) {
    return state.notifications.find((n) => n.id === id)
  },

  // MÉTODO CORRIGIDO - Carrega notificações não lidas do backend
  async loadUnreadNotifications() {
    try {
      console.log('Carregando notificações não lidas...')

      // const response = await fetch('http://192.168.195.162:8000/notifications/unread', {
      const base = (window.API_BASE_URL || '').startsWith('http')
        ? window.API_BASE_URL
        : `http://${window.API_BASE_URL || 'localhost:8000'}`
      const response = await fetch(`${base}/notifications/unread`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Resposta do backend:', data)

      if (data.notifications && Array.isArray(data.notifications)) {
        // Limpa notificações existentes para evitar duplicatas
        state.notifications = []

        // Adiciona cada notificação usando o método addNotification
        data.notifications.forEach((notificationData) => {
          this.addNotification(notificationData)
        })

        console.log(`${data.notifications.length} notificações carregadas`)
        console.log('Notificações visíveis:', this.notifications.length)
        console.log('Não lidas:', this.unreadCount)
      } else {
        console.warn('Resposta inválida do backend:', data)
      }
    } catch (error) {
      console.error('Erro ao carregar notificações não lidas:', error)
    }
  },

  playNotificationSound() {
    try {
      const audio = new Audio(
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGD0fPTgjMGHm7A7+OZURE',
      )
      audio.volume = 0.3
      audio.play()
    } catch (e) {
      console.log('Áudio de notificação não disponível')
    }
  },

  // Método de debug
  debug() {
    console.log('=== DEBUG NOTIFICATION STORE ===')
    console.log('Total notifications:', state.notifications.length)
    console.log('Unread count:', this.unreadCount)
    console.log('Visible notifications:', this.notifications.length)
    console.log(
      'All notifications:',
      state.notifications.map((n) => ({
        id: n.id,
        title: n.title,
        read: n.read,
        Readed: n.data?.Readed,
      })),
    )
    console.log('=================================')
  },
}

export default notificationStore

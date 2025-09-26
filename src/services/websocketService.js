class WebSocketService {
  constructor() {
    this.ws = null
    this.listeners = new Map()
    this.reconnectInterval = 5000
    this.shouldReconnect = true
    this.url = 'ws://192.168.0.2:8000/ws/notifications'
    this.isConnected = false
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('WebSocket conectado')
        this.isConnected = true
        this.emit('connected', true)

        // Envia ping para manter conexão ativa
        this.pingInterval = setInterval(() => {
          if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send('ping')
          }
        }, 30000)

        // Solicita sincronização de notificações não lidas ao conectar
        this.emit('sync-notifications')
      }

      this.ws.onmessage = (event) => {
        try {
          // Se for pong, ignora
          if (event.data === 'pong') {
            return
          }

          const data = JSON.parse(event.data)

          // Se for uma mensagem de status, ignora
          if (data.type === 'status') {
            return
          }

          // Processa notificação apenas se não foi lida (Readed = false)
          if (data.Readed === false || data.Readed === undefined) {
            // Emite o evento de nova notificação
            this.emit('notification', data)
          }
        } catch (error) {
          // Se não conseguir fazer parse, pode ser uma mensagem simples
          if (event.data !== 'pong') {
            console.error('Erro ao processar mensagem:', error)
          }
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket erro:', error)
        this.isConnected = false
        this.emit('error', error)
        this.emit('connected', false)
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket desconectado', event.code, event.reason)
        this.isConnected = false
        this.emit('connected', false)

        clearInterval(this.pingInterval)

        // Tenta reconectar automaticamente
        if (this.shouldReconnect) {
          console.log(`Tentando reconectar em ${this.reconnectInterval / 1000} segundos...`)
          setTimeout(() => {
            if (this.shouldReconnect) {
              this.connect()
            }
          }, this.reconnectInterval)
        }
      }
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error)
      this.isConnected = false
      this.emit('connected', false)

      // Tenta reconectar
      if (this.shouldReconnect) {
        setTimeout(() => {
          if (this.shouldReconnect) {
            this.connect()
          }
        }, this.reconnectInterval)
      }
    }
  }

  disconnect() {
    console.log('Desconectando WebSocket...')
    this.shouldReconnect = false
    this.isConnected = false

    if (this.ws) {
      this.ws.close(1000, 'Disconnect requested')
    }

    clearInterval(this.pingInterval)
  }

  // Reconecta manualmente
  reconnect() {
    console.log('Reconectando WebSocket...')
    this.disconnect()
    setTimeout(() => {
      this.shouldReconnect = true
      this.connect()
    }, 1000)
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Erro ao executar callback para evento ${event}:`, error)
        }
      })
    }
  }

  sendStatus() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send('status')
    }
  }

  // Envia uma mensagem customizada
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (typeof message === 'object') {
        this.ws.send(JSON.stringify(message))
      } else {
        this.ws.send(message)
      }
      return true
    } else {
      console.warn('WebSocket não está conectado')
      return false
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
      shouldReconnect: this.shouldReconnect,
    }
  }
}

export default new WebSocketService()

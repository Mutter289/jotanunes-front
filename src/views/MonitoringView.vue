<template>
  <div class="pm2-monitor">
    <div class="page-header">
      <div class="header-content">
        <h1>Monitoramento de Serviços Gunicorn</h1>
        <p>Status em tempo real dos serviços e workers</p>
      </div>
      <div class="connection-status-header">
        <div
          :class="['status-indicator', { connected: sseConnected, disconnected: !sseConnected }]"
        ></div>
        <span>{{ sseConnected ? 'Conectado (SSE)' : 'Desconectado' }}</span>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon online">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.services_online || 0 }}</div>
          <div class="stat-label">Online</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stopped">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.services_offline || 0 }}</div>
          <div class="stat-label">Offline</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon workers">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.total_workers || 0 }}</div>
          <div class="stat-label">Workers Ativos</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon memory">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatMemory(stats.total_memory_mb) }}</div>
          <div class="stat-label">Memória Total</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon cpu">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="14" x2="23" y2="14" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="14" x2="4" y2="14" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ (stats.total_cpu_percent || 0).toFixed(1) }}%</div>
          <div class="stat-label">CPU Total</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon services">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.total_services || 0 }}</div>
          <div class="stat-label">Total Serviços</div>
        </div>
      </div>
    </div>

    <div class="controls">
      <div class="search-container">
        <div class="search-input-wrapper">
          <svg
            class="search-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar serviço..."
            class="search-input"
          />
        </div>
      </div>

      <div class="control-buttons">
        <VButton
          @click="toggleConnection"
          :variant="sseConnected ? 'secondary' : 'primary'"
          size="small"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          {{ sseConnected ? 'Stream Ativo' : 'Conectar Stream' }}
        </VButton>

        <VButton @click="refreshData" size="small" :disabled="loading">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :class="{ spin: loading }"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Atualizar
        </VButton>
      </div>
    </div>

    <div class="table-container">
      <div class="table-wrapper">
        <table class="processes-table">
          <thead>
            <tr>
              <th @click="sort('status')" class="sortable">
                <div class="th-content">
                  Status
                  <svg
                    class="sort-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </th>
              <th @click="sort('service_name')" class="sortable">
                <div class="th-content">
                  Serviço
                  <svg
                    class="sort-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </th>
              <th @click="sort('main_pid')" class="sortable">
                <div class="th-content">
                  PID
                  <svg
                    class="sort-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </th>
              <th @click="sort('cpu_percent')" class="sortable">
                <div class="th-content">
                  CPU
                  <svg
                    class="sort-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </th>
              <th @click="sort('memory_mb')" class="sortable">
                <div class="th-content">
                  Memória
                  <svg
                    class="sort-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </th>
              <th @click="sort('uptime')" class="sortable">
                <div class="th-content">
                  Uptime
                  <svg
                    class="sort-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </th>
              <th>Workers</th>
              <th>Requisições</th>
              <th>Erros</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && services.length === 0">
              <td colspan="10" class="loading-row">
                <div class="loading-spinner"></div>
                Carregando serviços...
              </td>
            </tr>
            <tr v-else-if="filteredServices.length === 0">
              <td colspan="10" class="empty-row">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
                Nenhum serviço encontrado
              </td>
            </tr>
            <tr
              v-else
              v-for="service in filteredServices"
              :key="service.service_name"
              class="process-row"
            >
              <td>
                <div :class="['status-badge', service.status]">
                  <div class="status-dot"></div>
                  <span>{{ getStatusText(service.status) }}</span>
                </div>
              </td>
              <td class="process-name">
                <div class="name-cell">
                  <strong>{{ service.service_name }}</strong>
                  <div class="process-id">{{ service.active_state }} / {{ service.sub_state }}</div>
                </div>
              </td>
              <td class="pid">{{ service.main_pid || '-' }}</td>
              <td class="cpu">
                <div class="metric-cell">
                  <div class="metric-bar">
                    <div
                      class="metric-fill cpu-fill"
                      :style="{ width: Math.min(service.cpu_percent, 100) + '%' }"
                    ></div>
                  </div>
                  <span>{{ service.cpu_percent?.toFixed(1) || 0 }}%</span>
                </div>
              </td>
              <td class="memory">
                <div class="metric-cell">
                  <div class="metric-bar">
                    <div
                      class="metric-fill memory-fill"
                      :style="{ width: Math.min(service.memory_percent || 0, 100) + '%' }"
                    ></div>
                  </div>
                  <span>{{ formatMemory(service.memory_mb) }}</span>
                </div>
              </td>
              <td class="uptime">{{ service.uptime || '-' }}</td>
              <td class="instances">
                <span class="instance-count">{{ service.num_workers }}</span>
              </td>
              <td class="requests">
                <span class="metric-value">{{ service.total_requests || '-' }}</span>
              </td>
              <td class="errors">
                <span :class="['error-count', { high: service.errors > 0 }]">
                  {{ service.errors || 0 }}
                </span>
              </td>
              <td class="actions">
                <div class="action-buttons">
                  <button @click="viewWorkers(service)" class="action-btn view" title="Ver Workers">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  <button
                    @click="restartService(service.service_name)"
                    class="action-btn restart"
                    title="Reiniciar"
                    :disabled="service.status !== 'online'"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path
                        d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <VModal
      v-model="showWorkersModal"
      size="large"
      :title="`Workers - ${selectedService?.service_name}`"
    >
      <div v-if="selectedService" class="workers-content">
        <div class="workers-grid">
          <div v-for="worker in selectedService.workers" :key="worker.pid" class="worker-card">
            <div class="worker-header">
              <span class="worker-pid">PID: {{ worker.pid }}</span>
              <span :class="['worker-status', worker.status]">{{ worker.status }}</span>
            </div>
            <div class="worker-metrics">
              <div class="worker-metric">
                <span class="metric-label">CPU:</span>
                <span class="metric-value">{{ worker.cpu_percent.toFixed(1) }}%</span>
              </div>
              <div class="worker-metric">
                <span class="metric-label">Memória:</span>
                <span class="metric-value">{{ formatMemory(worker.memory_mb) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="selectedService.workers.length === 0" class="no-workers">
          Nenhum worker ativo
        </div>
      </div>
    </VModal>

    <div class="footer" v-if="lastUpdate">
      <span class="last-update"> Última atualização: {{ formatDate(lastUpdate) }} </span>
    </div>

    <VPopup
      v-model:visible="showConnectingPopup"
      msg="Conectando ao servidor"
      mark="warning"
      :auto-close="0"
    >
      <p>Aguarde alguns segundos enquanto estabelecemos a conexão SSE com o servidor...</p>
    </VPopup>
  </div>
</template>

<script>
import VButton from '@/components/Button/VButton.vue'
import VModal from '@/components/Modal/VModal.vue'
import VPopup from '@/components/Popup/VPopup.vue'
import { useError, useSuccess, useQuestion } from '@/hooks/useAlerts'

export default {
  components: {
    VButton,
    VModal,
    VPopup,
  },

  data() {
    const base = (window.API_BASE_URL || '').startsWith('http')
      ? window.API_BASE_URL
      : `http://${window.API_BASE_URL || '192.168.195.162:8000'}`
    return {
      API_BASE_URL: base, //http://192.168.195.162:8000
      services: [],
      stats: {
        total_services: 0,
        services_online: 0,
        services_offline: 0,
        total_workers: 0,
        total_cpu_percent: 0,
        total_memory_mb: 0,
      },
      searchTerm: '',
      loading: false,
      lastUpdate: null,
      sortField: 'service_name',
      sortDirection: 'asc',
      sseConnected: false,
      eventSource: null,
      showWorkersModal: false,
      selectedService: null,
      showConnectingPopup: false,
    }
  },

  computed: {
    filteredServices() {
      let filtered = [...this.services]

      if (this.searchTerm.trim()) {
        const term = this.searchTerm.toLowerCase()
        filtered = filtered.filter(
          (service) =>
            service.service_name.toLowerCase().includes(term) ||
            service.status.toLowerCase().includes(term) ||
            (service.main_pid && service.main_pid.toString().includes(term)),
        )
      }

      filtered.sort((a, b) => {
        let aVal = a[this.sortField]
        let bVal = b[this.sortField]

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal?.toLowerCase() || ''
        }

        if (this.sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })

      return filtered
    },
  },

  methods: {
    connectSSE() {
      if (this.eventSource) {
        this.eventSource.close()
      }

      console.log('Conectando SSE:', `${this.API_BASE_URL}/monitoring/stream`)

      // Mostrar popup de conectando
      this.showConnectingPopup = true

      this.eventSource = new EventSource(`${this.API_BASE_URL}/monitoring/stream`)

      this.eventSource.onopen = () => {
        console.log('SSE Conectado')
        this.sseConnected = true
        this.showConnectingPopup = false
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Dados SSE recebidos:', data)

          if (data.type === 'metrics_update' && data.data) {
            this.updateMetrics(data.data)
          }
        } catch (error) {
          console.error('Erro ao processar SSE:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('Erro SSE:', error)
        this.sseConnected = false
        this.showConnectingPopup = false

        // Reconectar após 5 segundos
        setTimeout(() => {
          if (!this.sseConnected) {
            console.log('Tentando reconectar SSE...')
            this.connectSSE()
          }
        }, 5000)
      }
    },

    disconnectSSE() {
      if (this.eventSource) {
        this.eventSource.close()
        this.eventSource = null
        this.sseConnected = false
        console.log('SSE Desconectado')
      }
    },

    toggleConnection() {
      if (this.sseConnected) {
        this.disconnectSSE()
      } else {
        this.connectSSE()
      }
    },

    updateMetrics(data) {
      // Atualizar estatísticas
      this.stats = {
        total_services: data.total_services || 0,
        services_online: data.services_online || 0,
        services_offline: data.services_offline || 0,
        total_workers: data.total_workers || 0,
        total_cpu_percent: data.total_cpu_percent || 0,
        total_memory_mb: data.total_memory_mb || 0,
      }

      // Atualizar serviços
      this.services = Object.entries(data.services || {}).map(([name, service]) => ({
        ...service,
        service_name: name,
      }))

      this.lastUpdate = new Date()
      this.loading = false
    },

    async fetchInitialData() {
      this.loading = true
      try {
        const response = await fetch(`${this.API_BASE_URL}/monitoring/server`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        this.updateMetrics(data)
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        this.loading = false
      }
    },

    async refreshData() {
      await this.fetchInitialData()
    },

    sort(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortField = field
        this.sortDirection = 'asc'
      }
    },

    viewWorkers(service) {
      this.selectedService = service
      this.showWorkersModal = true
    },

    async restartService(serviceName) {
      try {
        const confirm = await useQuestion({
          title: 'Tem certeza?',
          text: `Deseja reiniciar o serviço ${serviceName}?`,
          confirmButtonText: 'Sim, reiniciar',
          cancelButtonText: 'Cancelar',
        })

        if (confirm) {
          // Aqui você implementaria o endpoint de restart
          // const response = await fetch(`${this.API_BASE_URL}/monitoring/service/${serviceName}/restart`, {
          //   method: 'POST'
          // })

          useSuccess({
            title: 'Sucesso',
            text: 'Funcionalidade em desenvolvimento',
          })
        }
      } catch (error) {
        useError({
          title: 'Erro',
          text: error.message,
        })
      }
    },

    formatMemory(mb) {
      if (!mb) return '0 MB'
      return mb >= 1000 ? (mb / 1024).toFixed(1) + ' GB' : mb.toFixed(0) + ' MB'
    },

    formatDate(date) {
      if (!date) return '-'
      const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
      if (Number.isNaN(d.getTime())) return '-'

      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffSec = Math.floor(diffMs / 1000)
      const diffMin = Math.floor(diffSec / 60)
      const diffHour = Math.floor(diffMin / 60)

      const pad = (n) => String(n).padStart(2, '0')
      const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`

      // Mesma data (hoje/ontem) com base em meia-noite local
      const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate())
      const todayStart = startOfDay(now).getTime()
      const dateStart = startOfDay(d).getTime()
      const dayDiff = Math.round((todayStart - dateStart) / (24 * 60 * 60 * 1000))

      if (diffSec < 30) return 'agora'
      if (diffMin < 60) return `há ${diffMin} min`
      if (dayDiff === 0) return `hoje ${timeStr}`
      if (dayDiff === 1) return `ontem ${timeStr}`
      if (dayDiff > 1 && dayDiff < 7) {
        return d.toLocaleDateString('pt-BR', { weekday: 'long' }) + ` ${timeStr}`
      }
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    },

    getStatusText(status) {
      const statusMap = {
        online: 'Online',
        stopped: 'Parado',
        errored: 'Erro',
        unknown: 'Desconhecido',
      }
      return statusMap[status] || status
    },
  },

  mounted() {
    this.fetchInitialData()
    this.connectSSE()
  },

  beforeUnmount() {
    this.disconnectSSE()
  },
}
</script>

.pm2-monitor {
  min-height: 100vh;
  padding: 2rem;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.header-content h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  background: var(--badge-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-content p {
  margin: 0;
  color: #6c757d;
  font-size: 1.1rem;
}

.connection-status-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #4a5568;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 0.5rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-indicator.connected {
  background: #48bb78;
  box-shadow: 0 0 0 2px rgba(72, 187, 120, 0.3);
}

.status-indicator.disconnected {
  background: #f56565;
  box-shadow: 0 0 0 2px rgba(245, 101, 101, 0.3);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 0;
}

.stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f7fafc 100%);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(226, 232, 240, 0.8);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.online {
  background: linear-gradient(135deg, #48bb78, #38a169);
}
.stat-icon.stopped {
  background: linear-gradient(135deg, #a0aec0, #718096);
}
.stat-icon.errored {
  background: linear-gradient(135deg, #f56565, #e53e3e);
}
.stat-icon.memory {
  background: linear-gradient(135deg, #4299e1, #3182ce);
}
.stat-icon.cpu {
  background: linear-gradient(135deg, #ed8936, #dd6b20);
}
.stat-icon.workers {
  background: linear-gradient(135deg, #48bb78, #38a169);
}
.stat-icon.services {
  background: linear-gradient(135deg, #4299e1, #3182ce);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 500;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  gap: 1rem;
  margin-top: 1rem;
}

.search-container {
  flex: 1;
  max-width: 400px;
}

.search-input-wrapper {
  position: relative;
}

.search-input-wrapper input, ::placeholder {
  color: black;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  font-size: 1rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4299e1;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.control-buttons {
  display: flex;
  gap: 0.75rem;
}

.table-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  margin-top: 1rem;
}

.table-wrapper {
  overflow-x: auto;
}

.processes-table {
  width: 100%;
  border-collapse: collapse;
}

.processes-table th {
  background: linear-gradient(135deg, #f7fafc, #edf2f7);
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
  border-bottom: 1px solid #e2e8f0;
}

.processes-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.processes-table th.sortable:hover {
  background: linear-gradient(135deg, #edf2f7, #e2e8f0);
}

.th-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-icon {
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.processes-table th.sortable:hover .sort-icon {
  opacity: 1;
}

.processes-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  vertical-align: middle;
}

.process-row {
  transition: all 0.2s ease;
}

.process-row:hover {
  background: rgba(66, 153, 225, 0.05);
}

.process-row:last-child td {
  border-bottom: none;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.online {
  background: rgba(72, 187, 120, 0.1);
  color: #2f855a;
  border: 1px solid rgba(72, 187, 120, 0.2);
}

.status-badge.stopped {
  background: rgba(160, 174, 192, 0.1);
  color: #4a5568;
  border: 1px solid rgba(160, 174, 192, 0.2);
}

.status-badge.errored {
  background: rgba(245, 101, 101, 0.1);
  color: #c53030;
  border: 1px solid rgba(245, 101, 101, 0.2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-badge.online .status-dot {
  background: #48bb78;
}

.status-badge.stopped .status-dot {
  background: #a0aec0;
}

.status-badge.errored .status-dot {
  background: #f56565;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.process-name strong {
  color: #2d3748;
  font-size: 0.9rem;
}

.process-id {
  font-size: 0.75rem;
  color: #718096;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.metric-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.metric-bar {
  width: 60px;
  height: 6px;
  background: rgba(226, 232, 240, 0.8);
  border-radius: 3px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.cpu-fill {
  background: linear-gradient(90deg, #48bb78, #38a169);
}

.memory-fill {
  background: linear-gradient(90deg, #4299e1, #3182ce);
}

.metric-cell span {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4a5568;
  min-width: 45px;
}

.error-count {
  font-weight: 600;
  color: #4a5568;
}

.error-count.high {
  color: #e53e3e;
  font-weight: 700;
}

.metric-value {
  font-weight: 600;
  color: #4a5568;
}

.instance-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.view {
  background: rgba(66, 153, 225, 0.1);
  color: #2b6cb0;
}

.action-btn.view:hover:not(:disabled) {
  background: rgba(66, 153, 225, 0.2);
  transform: scale(1.1);
}

.action-btn.restart {
  background: rgba(237, 137, 54, 0.1);
  color: #c05621;
}

.action-btn.restart:hover:not(:disabled) {
  background: rgba(237, 137, 54, 0.2);
  transform: scale(1.1);
}

.loading-row, .empty-row {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #718096;
}

.loading-row {
  background: linear-gradient(90deg, transparent, rgba(66, 153, 225, 0.05), transparent);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.loading-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(66, 153, 225, 0.3);
  border-radius: 50%;
  border-top-color: #4299e1;
  animation: spin 1s ease-in-out infinite;
  margin-right: 1rem;
  vertical-align: middle;
}

.empty-row svg {
  display: block;
  margin: 0 auto 1rem;
  color: #cbd5e0;
}

.workers-content {
  padding: 1rem 0;
}

.workers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.worker-card {
  background: linear-gradient(135deg, #ffffff 0%, #f7fafc 100%);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(226, 232, 240, 0.8);
  transition: all 0.2s ease;
}

.worker-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.worker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.worker-pid {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2d3748;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.worker-status {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.worker-status.online {
  background: rgba(72, 187, 120, 0.1);
  color: #2f855a;
}

.worker-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.worker-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.worker-metric .metric-label {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 500;
}

.worker-metric .metric-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2d3748;
}

.no-workers {
  text-align: center;
  padding: 2rem;
  color: #718096;
  font-style: italic;
}

.footer {
  margin-top: 2rem;
  text-align: center;
}

.last-update {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  font-size: 0.875rem;
  color: #718096;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .page-header {
    margin-bottom: 0.75rem;
    padding-bottom: 1rem;
  }
  .header-content h1 { font-size: 2rem; }
  .header-content p { font-size: 1rem; }
}

@media (max-width: 768px) {
  .pm2-monitor { padding: 1rem; }
  .page-header {
    margin-bottom: 0.5rem;
    padding-bottom: 0.75rem;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  .header-content h1 { font-size: 1.75rem; }
  .header-content p { font-size: 0.95rem; }
  .connection-status-header { align-self: flex-start; }
  .stats-grid { grid-template-columns: 1fr; }
  .controls { flex-direction: column; align-items: stretch; }
  .search-container { max-width: none; }
  .control-buttons { justify-content: center; }
  .table-container { border-radius: 16px; }
  .processes-table th, .processes-table td { padding: 0.75rem; font-size: 0.875rem; }
  .metric-bar { width: 40px; }
  .action-buttons { flex-direction: column; }
  .workers-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .pm2-monitor { padding: 0.5rem; }
  .stat-card { padding: 1rem; }
  .processes-table th, .processes-table td { padding: 0.5rem; }
  .metric-cell { flex-direction: column; gap: 0.25rem; text-align: center; }
  .metric-bar { width: 60px; }
}

</style>

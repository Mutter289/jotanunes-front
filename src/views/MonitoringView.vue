<template>
  <div class="pm2-monitor">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Monitoramento de Serviços</h1>
        <p>Status em tempo real dos serviços Gunicorn e workers</p>
      </div>
      <div class="header-actions">
        <button
          class="btn-stream"
          @click="toggleConnection"
          :class="{ connected: sseConnected }"
        >
          <svg v-if="sseConnected" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          {{ sseConnected ? 'Stream Ativo' : 'Conectar Stream' }}
        </button>
        <button
          class="btn-refresh"
          @click="refreshData"
          :class="{ rotating: loading }"
          :disabled="loading"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card online-card">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.services_online || 0 }}</div>
          <div class="stat-label">Serviços Online</div>
        </div>
        <div class="stat-pulse"></div>
      </div>

      <div class="stat-card stopped-card">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.services_offline || 0 }}</div>
          <div class="stat-label">Serviços Offline</div>
        </div>
      </div>

      <div class="stat-card workers-card">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

      <div class="stat-card memory-card">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

      <div class="stat-card cpu-card">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

      <div class="stat-card services-card">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.total_services || 0 }}</div>
          <div class="stat-label">Total de Serviços</div>
        </div>
      </div>
    </div>

    <!-- Controls Section -->
    <div class="controls-section">
      <div class="search-container">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar serviço..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Table Container -->
    <div class="table-container">
      <div class="table-wrapper">
        <table class="processes-table">
          <thead>
            <tr>
              <th @click="sort('status')" class="sortable">
                <div class="th-content">
                  Status
                  <svg class="sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </th>
              <th @click="sort('service_name')" class="sortable">
                <div class="th-content">
                  Serviço
                  <svg class="sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </th>
              <th @click="sort('main_pid')" class="sortable">
                <div class="th-content">
                  PID
                  <svg class="sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </th>
              <th @click="sort('cpu_percent')" class="sortable">
                <div class="th-content">
                  CPU
                  <svg class="sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </th>
              <th @click="sort('memory_mb')" class="sortable">
                <div class="th-content">
                  Memória
                  <svg class="sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </th>
              <th @click="sort('uptime')" class="sortable">
                <div class="th-content">
                  Uptime
                  <svg class="sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

    <!-- Workers Modal -->
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

    <!-- Footer -->
    <div class="footer" v-if="lastUpdate">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>Última atualização: {{ formatDate(lastUpdate) }}</span>
    </div>

    <!-- Connecting Popup -->
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
import { API_BASE } from '@/config/api.js'

export default {
  components: {
    VButton,
    VModal,
    VPopup,
  },

  data() {
    return {
      API_BASE_URL: API_BASE,
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
      this.stats = {
        total_services: data.total_services || 0,
        services_online: data.services_online || 0,
        services_offline: data.services_offline || 0,
        total_workers: data.total_workers || 0,
        total_cpu_percent: data.total_cpu_percent || 0,
        total_memory_mb: data.total_memory_mb || 0,
      }

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

      const pad = (n) => String(n).padStart(2, '0')
      const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`

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

<style scoped>
/* Global Styles */
.pm2-monitor {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 2rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100vh;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.header-content h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-content p {
  margin: 0;
  color: #6c757d;
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-stream {
  background: white;
  color: #64748b;
  border: 2px solid #e9ecef;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-stream svg {
  width: 18px;
  height: 18px;
}

.btn-stream:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.btn-stream.connected {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border-color: #48bb78;
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
}

.btn-refresh {
  width: 44px;
  height: 44px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-refresh:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #bc1f1b;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-refresh svg {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.btn-refresh.rotating svg {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 2px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}

.stat-pulse {
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(72, 187, 120, 0.2), transparent 70%);
  border-radius: 50%;
  animation: pulse 2s ease-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0;
  }
}

.online-card:hover {
  border-color: rgba(72, 187, 120, 0.5);
}

.stopped-card:hover {
  border-color: rgba(160, 174, 192, 0.5);
}

.workers-card:hover {
  border-color: rgba(66, 153, 225, 0.5);
}

.memory-card:hover {
  border-color: rgba(159, 122, 234, 0.5);
}

.cpu-card:hover {
  border-color: rgba(237, 137, 54, 0.5);
}

.services-card:hover {
  border-color: rgba(188, 31, 27, 0.5);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
}

.stat-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

.online-card .stat-icon {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.stopped-card .stat-icon {
  background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
}

.workers-card .stat-icon {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
}

.memory-card .stat-icon {
  background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%);
}

.cpu-card .stat-icon {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
}

.services-card .stat-icon {
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* Controls Section */
.controls-section {
  margin: 0;
}

.search-container {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s;
}

.search-container:focus-within {
  border-color: #bc1f1b;
  box-shadow: 0 0 0 3px rgba(188, 31, 27, 0.1);
}

.search-icon {
  width: 20px;
  height: 20px;
  color: #94a3b8;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: #1e293b;
}

.search-input::placeholder {
  color: #94a3b8;
}

/* Table Container */
.table-container {
  background: white;
  backdrop-filter: blur(20px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid #e9ecef;
}

.table-wrapper {
  overflow-x: auto;
}

.processes-table {
  width: 100%;
  border-collapse: collapse;
}

.processes-table th {
  background: #f8fafc;
  padding: 16px;
  text-align: left;
  font-weight: 700;
  color: #475569;
  font-size: 13px;
  border-bottom: 2px solid #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.processes-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.processes-table th.sortable:hover {
  background: #f1f5f9;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-icon {
  width: 16px;
  height: 16px;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.processes-table th.sortable:hover .sort-icon {
  opacity: 1;
}

.processes-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.process-row {
  transition: all 0.2s ease;
}

.process-row:hover {
  background: rgba(188, 31, 27, 0.03);
}

.process-row:last-child td {
  border-bottom: none;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-badge.online {
  background: #dcfce7;
  color: #166534;
}

.status-badge.stopped {
  background: #f1f5f9;
  color: #475569;
}

.status-badge.errored {
  background: #fee2e2;
  color: #991b1b;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.process-name strong {
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
}

.process-id {
  font-size: 12px;
  color: #64748b;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.metric-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-bar {
  width: 60px;
  height: 6px;
  background: #e2e8f0;
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
  background: linear-gradient(90deg, #9f7aea, #805ad5);
}

.metric-cell span {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  min-width: 50px;
}

.error-count {
  font-weight: 600;
  color: #64748b;
}

.error-count.high {
  color: #dc2626;
  font-weight: 700;
}

.metric-value {
  font-weight: 600;
  color: #64748b;
}

.instance-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: scale(1.05);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn svg {
  width: 16px;
  height: 16px;
  color: #64748b;
}

.action-btn.restart:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
}

.action-btn.restart:hover:not(:disabled) svg {
  color: #dc2626;
}

.loading-row,
.empty-row {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #64748b;
}

.loading-row {
  background: linear-gradient(90deg, transparent, rgba(188, 31, 27, 0.03), transparent);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.loading-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top-color: #bc1f1b;
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
  margin-right: 1rem;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-row svg {
  display: block;
  margin: 0 auto 1rem;
  width: 48px;
  height: 48px;
  color: #cbd5e0;
}

/* Workers Modal */
.workers-content {
  padding: 1rem 0;
}

.workers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.worker-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid #e9ecef;
  transition: all 0.3s;
}

.worker-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.worker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.worker-pid {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.worker-status {
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.worker-status.online {
  background: #dcfce7;
  color: #166534;
}

.worker-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.worker-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f8fafc;
  border-radius: 8px;
}

.worker-metric .metric-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.worker-metric .metric-value {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.no-workers {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
  font-style: italic;
}

/* Footer */
.footer {
  margin-top: 2rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  font-size: 14px;
  color: #64748b;
}

.footer svg {
  width: 16px;
  height: 16px;
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .pm2-monitor {
    padding: 1.5rem 2rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .header-content p {
    font-size: 1rem;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .workers-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .pm2-monitor {
    padding: 1rem;
  }

  .header-content h1 {
    font-size: 1.75rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}
</style>

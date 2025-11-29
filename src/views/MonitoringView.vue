<template>
  <div class="monitoring">
    <!-- Header -->
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
      <div class="stat-card online-card" @click="filterByStatus('online')">
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

      <div class="stat-card stopped-card" @click="filterByStatus('stopped')">
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

    <!-- Search Bar -->
    <div class="search-container">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Buscar por nome do serviço, PID ou status..."
        class="search-input"
      />
      <button
        v-if="searchTerm || statusFilter"
        @click="clearFilters"
        class="clear-btn"
        title="Limpar filtros"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Services Grid -->
    <div class="content-area">
      <!-- Loading State -->
      <div v-if="loading && services.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando serviços...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredServices.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
        <p>Nenhum serviço encontrado</p>
      </div>

      <!-- Services Grid -->
      <div v-else class="services-grid">
        <div
          v-for="service in filteredServices"
          :key="service.service_name"
          class="service-card"
          :class="[service.status]"
          @click="viewWorkers(service)"
        >
          <div class="card-header">
            <div class="service-name-area">
              <h3>{{ service.service_name }}</h3>
              <p class="service-state">{{ service.active_state }} / {{ service.sub_state }}</p>
            </div>
            <div class="status-badge" :class="service.status">
              <span class="status-dot"></span>
              {{ getStatusText(service.status) }}
            </div>
          </div>

          <div class="card-metrics">
            <div class="metric-row">
              <div class="metric-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <line x1="9" y1="1" x2="9" y2="4" />
                  <line x1="15" y1="1" x2="15" y2="4" />
                  <line x1="9" y1="20" x2="9" y2="23" />
                  <line x1="15" y1="20" x2="15" y2="23" />
                </svg>
                <div class="metric-content">
                  <span class="metric-label">CPU</span>
                  <span class="metric-value">{{ (service.cpu_percent || 0).toFixed(1) }}%</span>
                </div>
                <div class="metric-bar">
                  <div class="metric-fill cpu-fill" :style="{ width: Math.min(service.cpu_percent || 0, 100) + '%' }"></div>
                </div>
              </div>

              <div class="metric-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <div class="metric-content">
                  <span class="metric-label">Memória</span>
                  <span class="metric-value">{{ formatMemory(service.memory_mb) }}</span>
                </div>
                <div class="metric-bar">
                  <div class="metric-fill memory-fill" :style="{ width: Math.min(service.memory_percent || 0, 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-info">
              <div class="info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{{ service.uptime || '-' }}</span>
              </div>
              <div class="info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>{{ service.num_workers }} Workers</span>
              </div>
              <div class="info-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v20M2 12h20" />
                </svg>
                <span>PID: {{ service.main_pid || '-' }}</span>
              </div>
            </div>
            <div class="card-actions">
              <button
                class="action-btn"
                @click.stop="viewWorkers(service)"
                title="Ver Workers"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
              <button
                class="action-btn action-btn-restart"
                @click.stop="restartService(service.service_name)"
                title="Reiniciar"
                :disabled="service.status !== 'online'"
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
        </div>
      </div>
    </div>

    <!-- Workers Modal -->
    <VModal
      v-model="showWorkersModal"
      size="large"
      background-color="white"
      :title="`Workers - ${selectedService?.service_name}`"
      :show-footer="false"
    >
      <div v-if="selectedService" class="workers-content">
        <div class="workers-grid">
          <div
            v-for="worker in selectedService.workers"
            :key="worker.pid"
            class="worker-card"
            :class="worker.status"
          >
            <div class="worker-header">
              <div class="worker-pid-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v20M2 12h20" />
                </svg>
                PID: {{ worker.pid }}
              </div>
              <span class="worker-status" :class="worker.status">
                {{ worker.status }}
              </span>
            </div>
            <div class="worker-metrics">
              <div class="worker-metric">
                <div class="metric-icon cpu-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                    <rect x="9" y="9" width="6" height="6" />
                  </svg>
                </div>
                <div class="metric-details">
                  <span class="metric-label">CPU</span>
                  <span class="metric-value">{{ worker.cpu_percent.toFixed(1) }}%</span>
                </div>
              </div>
              <div class="worker-metric">
                <div class="metric-icon memory-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                  </svg>
                </div>
                <div class="metric-details">
                  <span class="metric-label">Memória</span>
                  <span class="metric-value">{{ formatMemory(worker.memory_mb) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="selectedService.workers.length === 0" class="no-workers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          <p>Nenhum worker ativo</p>
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
      <p>Aguarde enquanto estabelecemos a conexão SSE com o servidor...</p>
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
      API_BASE_URL: base,
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
      statusFilter: '',
      loading: false,
      lastUpdate: null,
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

      // Apply status filter
      if (this.statusFilter) {
        filtered = filtered.filter(service => service.status === this.statusFilter)
      }

      // Apply search filter
      if (this.searchTerm.trim()) {
        const term = this.searchTerm.toLowerCase()
        filtered = filtered.filter(
          (service) =>
            service.service_name.toLowerCase().includes(term) ||
            service.status.toLowerCase().includes(term) ||
            (service.main_pid && service.main_pid.toString().includes(term)),
        )
      }

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

    filterByStatus(status) {
      this.statusFilter = this.statusFilter === status ? '' : status
    },

    clearFilters() {
      this.searchTerm = ''
      this.statusFilter = ''
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
.monitoring {
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

/* Search Container */
.search-container {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s;
  position: relative;
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

.clear-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #fee2e2;
}

.clear-btn svg {
  width: 16px;
  height: 16px;
  color: #64748b;
}

.clear-btn:hover svg {
  color: #dc2626;
}

/* Content Area */
.content-area {
  min-height: 400px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #bc1f1b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #64748b;
  font-size: 14px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 16px;
  color: #94a3b8;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  color: #cbd5e0;
}

.empty-state p {
  font-size: 16px;
  color: #64748b;
}

/* Services Grid */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 24px;
}

.service-card {
  background: white;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeIn 0.5s ease-out;
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}

.service-card.online {
  border-left: 4px solid #48bb78;
}

.service-card.stopped {
  border-left: 4px solid #a0aec0;
}

.service-card.errored {
  border-left: 4px solid #f56565;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.service-name-area h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.service-state {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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

/* Card Metrics */
.card-metrics {
  margin-bottom: 16px;
}

.metric-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-item {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  transition: background 0.2s;
}

.metric-item:hover {
  background: #f1f5f9;
}

.metric-item svg {
  width: 18px;
  height: 18px;
  color: #64748b;
}

.metric-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.metric-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.metric-value {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.metric-bar {
  width: 80px;
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

/* Card Footer */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.footer-info {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.info-item svg {
  width: 14px;
  height: 14px;
}

.card-actions {
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

.action-btn-restart:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
}

.action-btn-restart:hover:not(:disabled) svg {
  color: #dc2626;
}

/* Workers Modal */
.workers-content {
  padding: 20px 0;
}

.workers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.worker-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s;
}

.worker-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.worker-card.online {
  border-left: 4px solid #48bb78;
}

.worker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.worker-pid-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.worker-pid-badge svg {
  width: 14px;
  height: 14px;
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
  gap: 12px;
}

.worker-metric {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
}

.metric-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-icon svg {
  width: 18px;
  height: 18px;
  color: white;
}

.cpu-icon {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
}

.memory-icon {
  background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%);
}

.metric-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.metric-details .metric-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.metric-details .metric-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.no-workers {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  gap: 12px;
  color: #94a3b8;
}

.no-workers svg {
  width: 48px;
  height: 48px;
  color: #cbd5e0;
}

.no-workers p {
  font-size: 14px;
  color: #64748b;
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
  .services-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .monitoring {
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
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .services-grid {
    grid-template-columns: 1fr;
  }

  .workers-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .monitoring {
    padding: 1rem;
  }

  .header-content h1 {
    font-size: 1.75rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .footer-info {
    flex-direction: column;
    gap: 8px;
  }
}
</style>

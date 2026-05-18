<template>
  <div class="dashboard">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner">
        <svg class="spinner-ring" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
        </svg>
        <svg class="spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" />
        </svg>
      </div>
      <p class="loading-text">Carregando dados do sistema...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h3>Erro ao Carregar Dados</h3>
      <p>{{ error }}</p>
      <button @click="getData" class="retry-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 2v6h-6" />
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M3 22v-6h6" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
        Tentar Novamente
      </button>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Dashboard de Monitoramento</h1>
          <p>Visão geral do sistema e estatísticas em tempo real</p>
        </div>
        <div class="header-actions">
          <button class="btn-refresh" @click="getData" :class="{ rotating: loading }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card stat-card-expanded" v-for="(card, index) in statsCards" :key="index">
          <div class="stat-main">
            <div class="stat-icon" :class="card.iconClass" v-html="card.icon"></div>
            <div class="stat-content">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-sub-items">
            <div
              class="stat-sub-item"
              v-for="(subStat, subIndex) in card.subStats"
              :key="subIndex"
              :class="{ 'has-trend': subStat.trend }"
            >
              <div class="sub-stat-label">{{ subStat.label }}</div>
              <div class="sub-stat-value-wrapper">
                <div class="sub-stat-value">{{ subStat.value }}</div>
                <svg
                  v-if="subStat.trend === 'up'"
                  class="trend-icon trend-up"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                <svg
                  v-else-if="subStat.trend === 'down'"
                  class="trend-icon trend-down"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>
          <div class="stat-decoration">
            <svg viewBox="0 0 100 100" class="stat-bg-pattern">
              <circle cx="80" cy="20" r="30" opacity="0.1" />
              <circle cx="20" cy="80" r="20" opacity="0.15" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Application Chart -->
        <div class="chart-container">
          <div class="chart-header">
            <div class="chart-title-area">
              <svg class="chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <div>
                <h3>Distribuição por Aplicação</h3>
                <p class="chart-subtitle">Volume de sentenças por sistema</p>
              </div>
            </div>
          </div>
          <div class="chart-canvas-wrapper">
            <canvas ref="applicationChart"></canvas>
          </div>
        </div>

        <!-- Timeline Chart -->
        <div class="chart-container">
          <div class="chart-header">
            <div class="chart-title-area">
              <svg class="chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18" />
                <path d="M7 12l4-4 4 4 6-6" />
              </svg>
              <div>
                <h3>Evolução de Modificações</h3>
                <p class="chart-subtitle">Quantidade de alterações ao longo do tempo</p>
              </div>
            </div>
          </div>
          <div class="chart-canvas-wrapper">
            <canvas ref="timelineChart"></canvas>
          </div>
        </div>

        <!-- Notifications Table -->
        <div class="chart-container">
          <div class="chart-header">
            <div class="chart-title-area">
              <svg class="chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <div>
                <h3>Últimas Notificações</h3>
                <p class="chart-subtitle">Atividades recentes do sistema</p>
              </div>
            </div>
          </div>
          <div class="table-wrapper">
            <VTable />
          </div>
        </div>
      </div>

      <!-- Users Chart Full Width -->
      <div class="chart-container chart-full-width">
        <div class="chart-header">
          <div class="chart-title-area">
            <svg class="chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div>
              <h3>Usuários Mais Ativos</h3>
              <p class="chart-subtitle">Top usuários por número de modificações</p>
            </div>
          </div>
        </div>
        <div class="chart-canvas-wrapper">
          <canvas ref="usersChart"></canvas>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useGmtCharts } from '@/hooks/useGmtCharts'
import { useFetch } from '@/hooks/useFetch.js'
import VTable from '@/components/Table/VTable.vue'

const {
  createChart,
  createDataTable,
  createReportButton,
  getCurrentFilters,
  clearFilters,
  generateColors,
} = useGmtCharts()

// Refs para os canvas
const applicationChart = ref(null)
const timelineChart = ref(null)
const usersChart = ref(null)
const sizeChart = ref(null)
const dataTableContainer = ref(null)
const reportContainer = ref(null)

// Estado
const apiData = ref([])
const loading = ref(true)
const error = ref(null)
const activeFilters = ref({})

// Buscar dados da API
const getData = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await useFetch('/aud-sqls')

    if (response && Array.isArray(response)) {
      apiData.value = response
    } else if (response && response.data && Array.isArray(response.data)) {
      apiData.value = response.data
    } else {
      throw new Error('Formato de resposta inválido')
    }

    await nextTick()

    if (apiData.value.length > 0) {
      setTimeout(() => {
        initCharts()
      }, 100)
    } else {
      error.value = 'Nenhum dado disponível para exibir'
    }
  } catch (e) {
    console.error('Erro ao buscar dados:', e)
    error.value = e.message || 'Erro desconhecido ao carregar dados'
  } finally {
    loading.value = false
  }
}

// Estatísticas computadas
const stats = computed(() => {
  if (!apiData.value || apiData.value.length === 0) {
    return {
      totalSentencas: 0,
      tamanhoMedio: 0,
      aplicacoesAtivas: 0,
      modificacoesRecentes: 0,
      modificacoesHoje: 0,
      modificacoesSemana: 0,
      tamanhoTotal: 0,
      usuariosAtivos: 0,
      crescimentoMensal: 0,
    }
  }

  const data = apiData.value
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const modLast30Days = data.filter((item) => {
    const modDate = new Date(item.RECMODIFIEDON)
    return modDate > thirtyDaysAgo
  }).length

  const modLast60Days = data.filter((item) => {
    const modDate = new Date(item.RECMODIFIEDON)
    return modDate > sixtyDaysAgo && modDate <= thirtyDaysAgo
  }).length

  const crescimento = modLast60Days > 0
    ? Math.round(((modLast30Days - modLast60Days) / modLast60Days) * 100)
    : 0

  return {
    totalSentencas: data.length,
    tamanhoMedio: Math.round(
      data.reduce((sum, item) => sum + (item.TAMANHO || 0), 0) / data.length,
    ),
    aplicacoesAtivas: new Set(data.map((item) => item.APLICACAO).filter(Boolean)).size,
    modificacoesRecentes: modLast30Days,
    modificacoesHoje: data.filter((item) => {
      const modDate = new Date(item.RECMODIFIEDON)
      return modDate >= startOfToday
    }).length,
    modificacoesSemana: data.filter((item) => {
      const modDate = new Date(item.RECMODIFIEDON)
      return modDate > sevenDaysAgo
    }).length,
    tamanhoTotal: Math.round(
      data.reduce((sum, item) => sum + (item.TAMANHO || 0), 0) / 1024
    ),
    usuariosAtivos: new Set(
      data
        .filter((item) => new Date(item.RECMODIFIEDON) > thirtyDaysAgo)
        .map((item) => item.RECMODIFIEDBY)
        .filter(Boolean)
    ).size,
    crescimentoMensal: crescimento,
  }
})

// Cards de estatísticas
const statsCards = computed(() => [
  {
    value: stats.value.totalSentencas,
    label: 'Total de Sentenças',
    iconClass: 'icon-database',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>`,
    subStats: [
      { label: 'Aplicações Ativas', value: stats.value.aplicacoesAtivas },
      { label: 'Tamanho Total', value: `${stats.value.tamanhoTotal} MB` },
      { label: 'Tamanho Médio', value: `${stats.value.tamanhoMedio} KB` },
    ]
  },
  {
    value: stats.value.modificacoesRecentes,
    label: 'Modificações (30d)',
    iconClass: 'icon-activity',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>`,
    subStats: [
      { label: 'Hoje', value: stats.value.modificacoesHoje },
      { label: 'Última Semana', value: stats.value.modificacoesSemana },
      {
        label: 'Crescimento Mensal',
        value: `${stats.value.crescimentoMensal > 0 ? '+' : ''}${stats.value.crescimentoMensal}%`,
        trend: stats.value.crescimentoMensal > 0 ? 'up' : stats.value.crescimentoMensal < 0 ? 'down' : 'neutral'
      },
    ]
  }
])

// Callback para atualizar estatísticas
const updateStats = ({ total }) => {
  console.log('Total filtrado:', total)
}

// Remover filtro específico
const removeFilter = (key) => {
  const filters = getCurrentFilters()
  delete filters[key]
  activeFilters.value = { ...filters }
}

// Limpar todos os filtros
const handleClearFilters = () => {
  clearFilters()
  activeFilters.value = {}
}

// Inicializar gráficos
const initCharts = () => {
  console.log('Iniciando gráficos com gmt-charts-growup...')

  if (!applicationChart.value || !timelineChart.value || !usersChart.value) {
    console.error('Canvas refs não disponíveis')
    setTimeout(() => initCharts(), 500)
    return
  }

  try {
    // 1. Gráfico de Aplicações (Pie)
    createChart(applicationChart, {
      type: 'pie',
      field: 'APLICACAO',
      data: apiData.value,
      label: 'Aplicações',
      backgroundColor: generateColors(10),
      callback: updateStats,
    })

    // 2. Gráfico de Timeline (Line)
    createChart(timelineChart, {
      type: 'line',
      field: 'RECMODIFIEDON',
      data: apiData.value,
      label: 'Modificações',
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      callback: updateStats,
    })

    // 3. Gráfico de Usuários (Bar)
    createChart(usersChart, {
      type: 'bar',
      field: 'RECMODIFIEDBY',
      data: apiData.value,
      label: 'Usuários',
      backgroundColor: generateColors(15),
      callback: updateStats,
    })

    console.log('Todos os gráficos foram inicializados!')

    // Atualizar filtros ativos a cada 500ms
    setInterval(() => {
      activeFilters.value = { ...getCurrentFilters() }
    }, 500)
  } catch (error) {
    console.error('Erro ao inicializar gráficos:', error)
    error.value = 'Erro ao renderizar gráficos'
  }
}

// Lifecycle
onMounted(() => {
  console.log('Componente montado')
  getData()
})

// Watch para mudanças nos dados
watch(apiData, () => {
  if (apiData.value.length > 0 && !loading.value) {
    nextTick(() => {
      initCharts()
    })
  }
})
</script>

<style scoped>
/* Global Styles */
.dashboard {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 2rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
  animation: slideDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.btn-refresh:hover {
  background: #f8fafc;
  border-color: #bc1f1b;
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

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 24px;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring circle {
  stroke: #bc1f1b;
  stroke-dasharray: 80, 200;
  stroke-dashoffset: 0;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 100, 200;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 100, 200;
    stroke-dashoffset: -125;
  }
}

.spinner-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  color: #bc1f1b;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.9); }
}

.loading-text {
  font-size: 16px;
  color: #64748b;
  font-weight: 500;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
  animation: fadeIn 0.5s ease-out;
}

.error-icon {
  width: 64px;
  height: 64px;
  color: #dc2626;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.error-state h3 {
  font-size: 24px;
  color: #1e293b;
  margin: 0;
}

.error-state p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.retry-btn {
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(188, 31, 27, 0.3);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(188, 31, 27, 0.4);
}

.retry-btn svg {
  width: 18px;
  height: 18px;
}

/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 1rem;
}

.stat-card {
  position: relative;
  background: white;
  padding: 32px;
  border-radius: 16px;
  border: 2px solid #e9ecef;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stat-card-expanded {
  min-height: 240px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  border-color: rgba(188, 31, 27, 0.3);
}

.stat-main {
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 2;
  position: relative;
}

.stat-divider {
  height: 2px;
  background: linear-gradient(90deg, #e9ecef 0%, rgba(233, 236, 239, 0) 100%);
  margin: 8px 0;
  z-index: 2;
  position: relative;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s;
  position: relative;
  z-index: 2;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
}

.stat-sub-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 2;
  position: relative;
}

.stat-sub-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
  transition: all 0.3s;
}

.stat-sub-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.sub-stat-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.sub-stat-value-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.trend-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.trend-up {
  color: #10b981;
  animation: bounceUp 0.6s ease-out;
}

.trend-down {
  color: #ef4444;
  animation: bounceDown 0.6s ease-out;
}

@keyframes bounceUp {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes bounceDown {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

.stat-icon.icon-database {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.stat-icon.icon-activity {
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
}

.stat-icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

.stat-content {
  flex: 1;
  z-index: 2;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-decoration {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 100px;
  height: 100px;
  opacity: 0.05;
  z-index: 1;
  transition: all 0.3s;
}

.stat-card:hover .stat-decoration {
  opacity: 0.1;
  transform: translateY(-50%) scale(1.2);
}

.stat-bg-pattern {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.chart-container {
  background: white;
  border-radius: 16px;
  border: 2px solid #e9ecef;
  padding: 24px;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.6s ease-out;
}

.chart-container:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  border-color: rgba(188, 31, 27, 0.2);
}

.chart-full-width {
  grid-column: 1 / -1;
  margin-bottom: 100px;
}

.chart-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f5f9;
}

.chart-title-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: #bc1f1b;
  padding: 6px;
  background: #fef2f2;
  border-radius: 8px;
}

.chart-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.chart-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.chart-canvas-wrapper {
  position: relative;
  min-height: 320px;
}

.chart-canvas-wrapper canvas {
  max-height: 320px !important;
  width: 100% !important;
  height: 320px !important;
}

.table-wrapper {
  min-height: 320px;
  max-height: 400px;
  overflow-y: auto;
}

/* Responsive */
@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1.5rem 1rem;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .stat-card {
    padding: 24px;
  }

  .stat-card-expanded {
    min-height: auto;
  }

  .stat-value {
    font-size: 28px;
  }

  .sub-stat-value {
    font-size: 16px;
  }

  .stat-sub-item {
    padding: 10px 14px;
  }
}
</style>

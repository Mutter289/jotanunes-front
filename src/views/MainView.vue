<template>
  <div class="dashboard">
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Carregando dados...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>❌ Erro ao carregar dados:: {{ error }}</p>
      <button @click="getData" class="retry-btn">Tentar Novamente</button>
    </div>

    <template v-else>
      
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalSentencas }}</div>
          <div class="stat-label">Total de Sentenças</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.tamanhoMedio }} KB</div>
          <div class="stat-label">Tamanho Médio</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.aplicacoesAtivas }}</div>
          <div class="stat-label">Aplicações Ativas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.modificacoesRecentes }}</div>
          <div class="stat-label">Modificações (30d)</div>
        </div>
      </div>

      <!-- Grid de Gráficos -->
      <div class="charts-grid">
        <!-- Gráfico de Aplicações -->
        <div class="chart-container">
          <h3>Distribuição por Aplicação</h3>
          <p class="chart-subtitle">Volume de sentenças por sistema</p>
          <canvas ref="applicationChart"></canvas>
        </div>

        <!-- Gráfico de Timeline -->
        <div class="chart-container">
          <h3>Evolução de Modificações</h3>
          <p class="chart-subtitle">Quantidade de alterações ao longo do tempo</p>
          <canvas ref="timelineChart"></canvas>
        </div>

        
        <!-- Gráfico de Tamanhos -->
        <div class="chart-container">
          <h3>Ultimas Notificações</h3>
          <VTable/>
        </div>
      </div>
      <!-- Gráfico de Usuários -->
      <div class="chart-container" style="margin-bottom: 100px;">
        <h3>Usuários Mais Ativos</h3>
        <p class="chart-subtitle">Top usuários por número de modificações</p>
        <canvas ref="usersChart"></canvas>
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
    }
  }

  const data = apiData.value
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  return {
    totalSentencas: data.length,
    tamanhoMedio: Math.round(
      data.reduce((sum, item) => sum + (item.TAMANHO || 0), 0) / data.length
    ),
    aplicacoesAtivas: new Set(data.map((item) => item.APLICACAO).filter(Boolean)).size,
    modificacoesRecentes: data.filter((item) => {
      const modDate = new Date(item.RECMODIFIEDON)
      return modDate > thirtyDaysAgo
    }).length,
  }
})

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

    // 4. Gráfico de Tamanhos (Agregação por soma)
    createChart(sizeChart, {
      type: 'bar',
      field: 'APLICACAO',
      data: apiData.value,
      label: 'Tamanho Total (KB)',
      backgroundColor: generateColors(10),
      aggregationType: 'sum',
      valueField: 'TAMANHO',
      callback: updateStats,
    })

    // 5. Criar Tabela
    const columns = ['APLICACAO', 'RECMODIFIEDBY', 'RECMODIFIEDON', 'TAMANHO']
    createDataTable(dataTableContainer, apiData.value, columns, {
      itemsPerPage: 50,
    })

    // 6. Criar Botão de Relatório
    createReportButton(reportContainer, apiData.value)

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
.dashboard {
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f8f9fa;
  min-height: 100vh;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #fff5f5;
  border: 2px solid #feb2b2;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  color: #c53030;
}

.retry-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 15px;
  transition: all 0.3s;
}

.retry-btn:hover {
  background: #5568d3;
  transform: translateY(-2px);
}

.report-section {
  margin-bottom: 20px;
}

.filters {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filters h3 {
  margin-top: 0;
  color: #333;
  font-size: 18px;
  margin-bottom: 15px;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.filter-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  animation: slideIn 0.3s ease-out;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.filter-tag button {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.filter-tag button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.clear-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(231, 76, 60, 0.4);
}

.clear-btn:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.5);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.chart-container {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: 420px;
  transition: box-shadow 0.3s;
}

.chart-container:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.chart-container h3 {
  margin-top: 0;
  margin-bottom: 5px;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.chart-subtitle {
  margin: 0 0 20px 0;
  color: #95a5a6;
  font-size: 13px;
}

.chart-container canvas {
  max-height: 320px;
  width: 100% !important;
  height: 320px !important;
}

.table-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.table-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .dashboard {
    padding: 15px;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<template>
  <div class="dashboard">
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Carregando dados...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>❌ Erro ao carregar dados: {{ error }}</p>
      <button @click="getData" class="retry-btn">Tentar Novamente</button>
    </div>

    <template v-else>
      <div class="filters">
        <h3>Filtros Ativos</h3>
        <div v-if="Object.keys(globalFilters).length > 0" class="active-filters">
          <span v-for="(value, key) in globalFilters" :key="key" class="filter-tag">
            {{ formatFilterLabel(key) }}: {{ value }}
            <button @click="removeFilter(key)">×</button>
          </span>
          <button @click="clearFilters" class="clear-btn">Limpar Todos</button>
        </div>
        <p v-else>Clique nos gráficos para filtrar</p>
      </div>

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

      <div class="charts-grid">
        <div class="chart-container">
          <h3>Distribuição por Aplicação</h3>
          <p class="chart-subtitle">Volume de sentenças por sistema</p>
          <canvas ref="applicationChart"></canvas>
        </div>

        <div class="chart-container">
          <h3>Evolução de Modificações</h3>
          <p class="chart-subtitle">Quantidade de alterações ao longo do tempo</p>
          <canvas ref="timelineChart"></canvas>
        </div>

        <div class="chart-container">
          <h3>Usuários Mais Ativos</h3>
          <p class="chart-subtitle">Top 5 usuários por número de modificações</p>
          <canvas ref="usersChart"></canvas>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import Chart from 'chart.js/auto'
// Remova ou ajuste o import do useFetch conforme sua implementação
import { useFetch } from '@/hooks/useFetch.js'

// Refs para os canvas dos gráficos
const applicationChart = ref(null)
const timelineChart = ref(null)
const usersChart = ref(null)

// Estado da aplicação
const chartInstances = ref([])
const apiData = ref([])
const loading = ref(true)
const error = ref(null)
const globalFilters = ref({})

// Função para simular dados da API (substitua pela sua chamada real)
const mockFetch = async () => {
  try {
    const response = await fetch("http://192.168.195.162:8000/aud-sqls")
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Erro ao buscar dados:", error)
    return [] // retorna array vazio em caso de erro
  }
}

// Buscar dados da API
const getData = async () => {
  loading.value = true
  error.value = null

  try {
    // Substitua mockFetch() pela sua chamada real: 
    const response = await useFetch('/aud-sqls')
    // const response = await mockFetch()

    if (response && Array.isArray(response)) {
      apiData.value = response
    } else if (response && response.data && Array.isArray(response.data)) {
      apiData.value = response.data
    } else {
      throw new Error('Formato de resposta inválido')
    }

    // Aguardar o DOM atualizar antes de inicializar os gráficos
    await nextTick()
    
    if (apiData.value.length > 0) {
      // Pequeno delay para garantir que os elementos estão no DOM
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

// Função para aplicar filtros nos dados
const applyFilters = (data) => {
  let filtered = [...data]

  if (globalFilters.value.aplicacao) {
    filtered = filtered.filter(item => item.APLICACAO === globalFilters.value.aplicacao)
  }

  if (globalFilters.value.mes) {
    filtered = filtered.filter(item => {
      if (!item.RECMODIFIEDON) return false
      const date = new Date(item.RECMODIFIEDON)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return monthKey === globalFilters.value.mes
    })
  }

  if (globalFilters.value.usuario) {
    filtered = filtered.filter(item => item.RECMODIFIEDBY === globalFilters.value.usuario)
  }

  return filtered
}

// Preparar dados para o gráfico de aplicações
const getApplicationData = () => {
  const filtered = applyFilters(apiData.value)
  const grouped = {}
  
  filtered.forEach(item => {
    const app = item.APLICACAO || 'Sem Aplicação'
    grouped[app] = (grouped[app] || 0) + 1
  })

  const labels = Object.keys(grouped)
  const data = Object.values(grouped)

  return {
    labels,
    datasets: [{
      label: 'Sentenças',
      data,
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
      ],
      borderColor: [
        'rgb(54, 162, 235)',
        'rgb(255, 99, 132)',
        'rgb(255, 206, 86)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
        'rgb(255, 159, 64)',
      ],
      borderWidth: 2,
    }],
  }
}

// Preparar dados para o gráfico de timeline
const getTimelineData = () => {
  const filtered = applyFilters(apiData.value)
  const months = {}
  
  filtered.forEach(item => {
    if (!item.RECMODIFIEDON) return
    const date = new Date(item.RECMODIFIEDON)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months[monthKey] = (months[monthKey] || 0) + 1
  })

  const sortedMonths = Object.keys(months).sort().slice(-6)
  const labels = sortedMonths.map(formatMonth)
  const data = sortedMonths.map(key => months[key] || 0)

  return {
    labels,
    datasets: [{
      label: 'Modificações',
      data,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4,
      fill: true,
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  }
}

// Preparar dados para o gráfico de usuários
const getUsersData = () => {
  const filtered = applyFilters(apiData.value)
  const users = {}
  
  filtered.forEach(item => {
    const user = item.RECMODIFIEDBY || 'Sem Usuário'
    users[user] = (users[user] || 0) + 1
  })

  const topUsers = Object.entries(users)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return {
    labels: topUsers.map(([user]) => user),
    datasets: [{
      label: 'Modificações',
      data: topUsers.map(([, count]) => count),
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
      ],
      borderColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
      ],
      borderWidth: 2,
    }],
  }
}

// Formatar label de filtro
const formatFilterLabel = (key) => {
  const labels = {
    aplicacao: 'Aplicação',
    mes: 'Período',
    usuario: 'Usuário',
  }
  return labels[key] || key
}

// Formatar mês
const formatMonth = (monthKey) => {
  const [year, month] = monthKey.split('-')
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ]
  return `${months[parseInt(month) - 1]}/${year}`
}

// Adicionar filtro
const setFilter = (key, value) => {
  globalFilters.value[key] = value
  updateAllCharts()
}

// Remover filtro
const removeFilter = (key) => {
  delete globalFilters.value[key]
  updateAllCharts()
}

// Limpar todos os filtros
const clearFilters = () => {
  globalFilters.value = {}
  updateAllCharts()
}

// Atualizar todos os gráficos
const updateAllCharts = () => {
  chartInstances.value.forEach((chart, index) => {
    if (chart) {
      switch(index) {
        case 0:
          chart.data = getApplicationData()
          break
        case 1:
          chart.data = getTimelineData()
          break
        case 2:
          chart.data = getUsersData()
          break
      }
      chart.update()
    }
  })
}

// Inicializar gráficos
const initCharts = () => {
  console.log('Iniciando gráficos...')
  
  // Destruir gráficos existentes
  chartInstances.value.forEach(chart => {
    if (chart) {
      chart.destroy()
    }
  })
  chartInstances.value = []

  // Verificar se os refs dos canvas estão disponíveis
  if (!applicationChart.value || !timelineChart.value || !usersChart.value) {
    console.error('Canvas refs não disponíveis')
    setTimeout(() => initCharts(), 500) // Tentar novamente
    return
  }

  try {
    // Gráfico de Aplicações
    const appChart = new Chart(applicationChart.value.getContext('2d'), {
      type: 'doughnut',
      data: getApplicationData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index
            const label = appChart.data.labels[index]
            setFilter('aplicacao', label)
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || ''
                const value = context.parsed || 0
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
        },
      },
    })
    chartInstances.value.push(appChart)
    console.log('Gráfico de aplicações criado')

    // Gráfico de Timeline
    const timeChart = new Chart(timelineChart.value.getContext('2d'), {
      type: 'line',
      data: getTimelineData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index
            const label = timeChart.data.labels[index]
            const [month, year] = label.split('/')
            const monthMap = {
              'Jan': '01', 'Fev': '02', 'Mar': '03', 'Abr': '04',
              'Mai': '05', 'Jun': '06', 'Jul': '07', 'Ago': '08',
              'Set': '09', 'Out': '10', 'Nov': '11', 'Dez': '12',
            }
            const monthKey = `${year}-${monthMap[month]}`
            setFilter('mes', monthKey)
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    })
    chartInstances.value.push(timeChart)
    console.log('Gráfico de timeline criado')

    // Gráfico de Usuários
    const userChart = new Chart(usersChart.value.getContext('2d'), {
      type: 'bar',
      data: getUsersData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index
            const label = userChart.data.labels[index]
            setFilter('usuario', label)
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Modificações: ${context.parsed.x}`
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    })
    chartInstances.value.push(userChart)
    console.log('Gráfico de usuários criado')

    console.log('Todos os gráficos foram inicializados com sucesso!')
  } catch (error) {
    console.error('Erro ao inicializar gráficos:', error)
    error.value = 'Erro ao renderizar gráficos'
  }
}

// Lifecycle hooks
onMounted(() => {
  console.log('Componente montado')
  getData()
})

onUnmounted(() => {
  console.log('Destruindo gráficos...')
  chartInstances.value.forEach(chart => {
    if (chart) {
      chart.destroy()
    }
  })
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

  .chart-container {
    min-width: auto;
  }
}
</style>
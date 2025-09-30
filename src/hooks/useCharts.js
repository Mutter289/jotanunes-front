// composables/useCharts.js
import { ref, computed, watch, nextTick } from 'vue'
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  DoughnutController,
  PieController,
} from 'chart.js'

// Registrar todos os componentes necessários do Chart.js
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  DoughnutController,
  PieController,
)

// Estado global compartilhado entre todos os gráficos
const globalFilters = ref({})
const chartInstances = ref(new Map())

export function useCharts() {
  // Função para definir filtros globais
  const setGlobalFilter = (filterKey, filterValue) => {
    globalFilters.value = {
      ...globalFilters.value,
      [filterKey]: filterValue,
    }
  }

  // Função para limpar filtros
  const clearFilters = () => {
    globalFilters.value = {}
  }

  // Função para obter filtros atuais
  const getFilters = () => {
    return { ...globalFilters.value }
  }

  // Função para criar um gráfico
  const createChart = async (canvasRef, config, options = {}) => {
    // Aguardar o próximo tick para garantir que o ref está disponível
    await nextTick()

    if (!canvasRef.value) {
      console.error('Canvas ref não está disponível')
      return null
    }

    const chartId = options.id || `chart-${Date.now()}-${Math.random()}`
    const originalData = ref(config.data)
    const filteredData = ref(config.data)
    let chartInstance = null

    // Função para filtrar dados
    const filterData = (data, filters) => {
      if (!filters || Object.keys(filters).length === 0) {
        return data
      }

      if (options.filterFunction) {
        return options.filterFunction(data, filters)
      }

      // Filtro padrão simples
      return {
        ...data,
        labels: data.labels,
        datasets: data.datasets.map((dataset) => ({
          ...dataset,
          data: dataset.data,
        })),
      }
    }

    try {
      const ctx = canvasRef.value.getContext('2d')

      chartInstance = new Chart(ctx, {
        type: config.type,
        data: filteredData.value,
        options: {
          ...config.options,
          onClick: (event, elements, chart) => {
            if (elements.length > 0 && options.onClickFilter) {
              const element = elements[0]
              const datasetIndex = element.datasetIndex
              const index = element.index
              const label = chart.data.labels[index]
              const value = chart.data.datasets[datasetIndex].data[index]

              // Chamar função de filtro personalizada
              options.onClickFilter(label, value, datasetIndex)
            }

            // Chamar onClick original se existir
            if (config.options?.onClick) {
              config.options.onClick(event, elements, chart)
            }
          },
        },
      })

      chartInstances.value.set(chartId, chartInstance)

      // Atualizar dados filtrados quando os filtros globais mudarem
      const stopWatch = watch(
        globalFilters,
        (newFilters) => {
          filteredData.value = filterData(originalData.value, newFilters)
          if (chartInstance) {
            chartInstance.data = filteredData.value
            // Usar animação personalizada ou padrão
            const animationConfig = options.animation || {
              duration: 800,
              easing: 'easeInOutQuart',
            }
            chartInstance.update(animationConfig)
          }
        },
        { deep: true },
      )

      // Função para destruir o gráfico
      const destroy = () => {
        stopWatch()
        if (chartInstance) {
          chartInstance.destroy()
          chartInstances.value.delete(chartId)
        }
      }

      // Função para atualizar dados originais
      const updateData = (newData) => {
        originalData.value = newData
        filteredData.value = filterData(newData, globalFilters.value)
        if (chartInstance) {
          chartInstance.data = filteredData.value
          chartInstance.update()
        }
      }

      return {
        chartId,
        updateData,
        destroy,
        chartInstance: computed(() => chartInstance),
      }
    } catch (error) {
      console.error('Erro ao criar gráfico:', error)
      return null
    }
  }

  // Função para atualizar todos os gráficos
  const updateAllCharts = () => {
    chartInstances.value.forEach((chart) => {
      chart.update()
    })
  }

  // Função para destruir todos os gráficos
  const destroyAllCharts = () => {
    chartInstances.value.forEach((chart) => {
      chart.destroy()
    })
    chartInstances.value.clear()
  }

  return {
    createChart,
    setGlobalFilter,
    clearFilters,
    getFilters,
    updateAllCharts,
    destroyAllCharts,
    globalFilters: computed(() => globalFilters.value),
  }
}

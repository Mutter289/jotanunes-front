// composables/useGmtCharts.js
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as itp from 'gmt-charts-growup'

export function useGmtCharts() {
  const chartRefs = ref([])
  const tableRef = ref(null)

  /**
   * Normaliza as datas do formato ISO 8601 para o formato esperado pela biblioteca
   * @param {Array} data - Array de objetos com dados
   * @returns {Array} - Array com datas normalizadas
   */
  const normalizeDates = (data) => {
    return data.map((item) => {
      const normalized = { ...item }

      // Itera sobre todas as propriedades do objeto
      Object.keys(normalized).forEach((key) => {
        const value = normalized[key]

        // Verifica se é uma string de data/hora
        if (typeof value === 'string') {
          // Padrão para datas no formato ISO 8601 ou com milissegundos extras
          // Exemplos: 2025-09-25T02:25:00 ou 2025-09-25 12:12:10.7830000
          const datePattern = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(\.\d+)?/
          const match = value.match(datePattern)

          if (match) {
            // Reconstrói a data no formato: YYYY-MM-DD HH:MM:SS
            // Remove o T e os milissegundos
            normalized[key] = `${match[1]} ${match[2]}`
          }
        }
      })

      return normalized
    })
  }

  /**
   * Cria um gráfico usando a biblioteca gmt-charts-growup
   * @param {Object} canvasRef - Ref do canvas
   * @param {Object} options - Configurações do gráfico
   */
  const createChart = (canvasRef, options) => {
    if (!canvasRef.value) {
      console.error('Canvas ref não disponível')
      return
    }

    const {
      type = 'bar',
      field,
      data,
      backgroundColor = [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
      ],
      label = field,
      callback = null,
      porDuracao = true,
      fieldEnd = null,
      aggregationType = 'count',
      valueField = null,
    } = options

    try {
      const ctx = canvasRef.value.getContext('2d')

      // Normaliza as datas antes de passar para a biblioteca
      const normalizedData = normalizeDates(data)

      itp.criarGrafico(
        ctx,
        type,
        field,
        backgroundColor,
        label,
        normalizedData,
        callback,
        porDuracao,
        fieldEnd,
        aggregationType,
        valueField,
      )

      chartRefs.value.push(canvasRef)
    } catch (error) {
      console.error('Erro ao criar gráfico:', error)
    }
  }

  /**
   * Cria um gráfico de bolhas
   * @param {Object} canvasRef - Ref do canvas
   * @param {Object} options - Configurações
   */
  const createBubbleChart = (canvasRef, options) => {
    if (!canvasRef.value) {
      console.error('Canvas ref não disponível')
      return
    }

    const {
      xAxis,
      yAxis,
      radius,
      data,
      colors = [
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
      ],
      aggregationType = 'count',
      valueField = null,
    } = options

    try {
      const ctx = canvasRef.value.getContext('2d')

      // Normaliza as datas antes de passar para a biblioteca
      const normalizedData = normalizeDates(data)

      itp.criarGraficoBolha(
        ctx,
        xAxis,
        yAxis,
        radius,
        normalizedData,
        colors,
        aggregationType,
        valueField,
      )

      chartRefs.value.push(canvasRef)
    } catch (error) {
      console.error('Erro ao criar gráfico de bolhas:', error)
    }
  }

  /**
   * Cria um gráfico misto (barra + linha)
   * @param {Object} canvasRef - Ref do canvas
   * @param {Object} options - Configurações
   */
  const createMixedChart = (canvasRef, options) => {
    if (!canvasRef.value) {
      console.error('Canvas ref não disponível')
      return
    }

    const { xAxis, yAxis, data, title = '' } = options

    try {
      const ctx = canvasRef.value.getContext('2d')

      // Normaliza as datas antes de passar para a biblioteca
      const normalizedData = normalizeDates(data)

      itp.criarGraficoMisto(ctx, xAxis, yAxis, normalizedData, title)

      chartRefs.value.push(canvasRef)
    } catch (error) {
      console.error('Erro ao criar gráfico misto:', error)
    }
  }

  /**
   * Cria uma tabela com os dados
   * @param {Object} containerRef - Ref do container
   * @param {Array} data - Dados
   * @param {Array} columns - Colunas a exibir
   * @param {Object} options - Opções adicionais
   */
  const createDataTable = (containerRef, data, columns, options = {}) => {
    if (!containerRef.value) {
      console.error('Container ref não disponível')
      return
    }

    try {
      // Normaliza as datas antes de passar para a biblioteca
      const normalizedData = normalizeDates(data)

      itp.criarDataTable(containerRef.value, normalizedData, columns, options)

      tableRef.value = containerRef
    } catch (error) {
      console.error('Erro ao criar tabela:', error)
    }
  }

  /**
   * Cria o botão de gerar relatório
   * @param {Object} containerRef - Ref do container
   * @param {Array} data - Dados originais
   */
  const createReportButton = (containerRef, data) => {
    if (!containerRef.value) {
      console.error('Container ref não disponível')
      return
    }

    try {
      // Normaliza as datas antes de passar para a biblioteca
      const normalizedData = normalizeDates(data)

      itp.criarBotaoGerarRelatorio(normalizedData, containerRef.value)
    } catch (error) {
      console.error('Erro ao criar botão de relatório:', error)
    }
  }

  /**
   * Cria o ícone flutuante de configuração
   * @param {Object} containerRef - Ref do container dos gráficos
   */
  const createFloatingIcon = (containerRef) => {
    if (!containerRef.value) {
      console.error('Container ref não disponível')
      return
    }

    try {
      itp.criarIcone(containerRef.value)
    } catch (error) {
      console.error('Erro ao criar ícone flutuante:', error)
    }
  }

  /**
   * Calcula o total com base nos filtros atuais
   * @param {Array} data - Dados originais
   * @param {Function} callback - Callback com o total
   */
  const calculateTotal = (data, callback) => {
    try {
      return itp.calcularTotal?.(data, callback) || 0
    } catch (error) {
      console.error('Erro ao calcular total:', error)
      return 0
    }
  }

  /**
   * Obtém os filtros atuais aplicados
   */
  const getCurrentFilters = () => {
    return itp.filtrosAtuais || {}
  }

  /**
   * Limpa todos os filtros
   */
  const clearFilters = () => {
    Object.keys(itp.filtrosAtuais).forEach((key) => {
      delete itp.filtrosAtuais[key]
    })
  }

  /**
   * Utilitário para gerar cores automaticamente
   */
  const generateColors = (count) => {
    const colors = []
    for (let i = 0; i < count; i++) {
      const hue = (i * 360) / count
      colors.push(`hsla(${hue}, 70%, 60%, 0.8)`)
    }
    return colors
  }

  /**
   * Destrói todos os gráficos ao desmontar o componente
   */
  onUnmounted(() => {
    chartRefs.value = []
    tableRef.value = null
  })

  return {
    // Funções principais
    createChart,
    createBubbleChart,
    createMixedChart,
    createDataTable,
    createReportButton,
    createFloatingIcon,

    // Utilitários
    calculateTotal,
    getCurrentFilters,
    clearFilters,
    generateColors,

    // Refs
    chartRefs,
    tableRef,
  }
}

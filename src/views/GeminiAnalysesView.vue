<template>
  <div class="gemini-analyses">
    <h1>Análises de Alterações (Gemini)</h1>
    <p>Histórico de todas as análises de alterações em sentenças SQL.</p>
    <VTable
      @row-click="handleRowClick"
      :data="analyses"
      :columns="columns"
      :searchable="true"
      search-placeholder="Buscar por código da sentença..."
      :paginate="true"
      :page-size="15"
      row-key="ID"
    />

    <VModal v-model="showModal" title="Detalhes da Análise" size="full">
      
      <div v-if="selectedAnalysis" class="analysis-modal" ref="modalContent">
         <VButton @click="exportToPDF" variant="primary" size="small" style="width: 8rem;">
          Exportar PDF
        </VButton>
        <div class="analysis-header">
          <div class="header-main">
            <h3>{{ selectedAnalysis.AudSqlCodSentenca }}</h3>
            <div class="badges">
              <span :class="['badge', 'badge-' + getCriticalityClass(selectedAnalysis.Criticidade)]">
                {{ selectedAnalysis.Criticidade }}
              </span>
              <span :class="['badge', 'badge-' + getRecommendationClass(selectedAnalysis.RecomendacaoFinal)]">
                {{ selectedAnalysis.RecomendacaoFinal }}
              </span>
              <span class="badge badge-score">
                Score: {{ selectedAnalysis.ScoreQualidade }}/10
              </span>
            </div>
          </div>
          <div class="header-meta">
            <span><strong>Usuário:</strong> {{ selectedAnalysis.UsuarioAlteracao }}</span>
            <span><strong>Sistema:</strong> {{ selectedAnalysis.AplicacaoOrigem }} {{ selectedAnalysis.SistemaOrigem }}</span>
            <span><strong>Analisado em:</strong> {{ formatDate(selectedAnalysis.DataAnalise) }}</span>
          </div>
        </div>

        <!-- Resumo da Mudança -->
        <div class="section-card">
          <h4 class="section-title">Resumo da Mudança</h4>
          <p class="section-content">{{ selectedAnalysis.ResumoMudanca }}</p>
          <div class="metadata-grid">
            <div class="metadata-item">
              <span class="metadata-label">Propósito:</span>
              <span class="metadata-value">{{ formatTipoMudanca(selectedAnalysis.TipoMudanca) }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Impacto na Lógica:</span>
              <span :class="['metadata-value', selectedAnalysis.AlteraLogica ? 'text-warning' : 'text-success']">
                {{ selectedAnalysis.AlteraLogica ? 'Sim' : 'Não' }}
              </span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Impacta Performance:</span>
              <span :class="['metadata-value', selectedAnalysis.ImpactaPerformance ? 'text-warning' : 'text-success']">
                {{ selectedAnalysis.ImpactaPerformance ? 'Sim' : 'Não' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Riscos Identificados -->
        <div v-if="selectedAnalysis.Riscos && selectedAnalysis.Riscos.length > 0" class="section-card section-risks">
          <h4 class="section-title">Riscos Identificados ({{ selectedAnalysis.TotalRiscosIdentificados }})</h4>
          <div v-for="(risco, index) in selectedAnalysis.Riscos" :key="index" :class="['risk-item', 'risk-' + risco.nivel.toLowerCase()]">
            <div class="risk-header">
              <span class="risk-badge">{{ risco.nivel }}</span>
              <span class="risk-type">{{ formatRiscoTipo(risco.tipo_risco) }}</span>
            </div>
            <p class="risk-description">{{ risco.descricao }}</p>
            <div class="risk-recommendation">
              <strong>Recomendação:</strong> {{ risco.recomendacao }}
            </div>
          </div>
        </div>

        <!-- Comparação SQL -->
        <div class="section-card">
          <h4 class="section-title">Comparação SQL</h4>
          <SqlDiffViewer
            :old-sql="selectedAnalysis.SentencaAnterior"
            :new-sql="selectedAnalysis.SentencaNova"
          />
        </div>

        <!-- Mudanças Específicas -->
        <div v-if="selectedAnalysis.MudancasEspecificas && selectedAnalysis.MudancasEspecificas.length > 0" class="section-card">
          <h4 class="section-title">Mudanças Específicas</h4>
          <ul class="changes-list">
            <li v-for="(mudanca, index) in selectedAnalysis.MudancasEspecificas" :key="index">{{ mudanca }}</li>
          </ul>
        </div>

        <!-- Sugestões de Índices -->
        <div v-if="selectedAnalysis.IndicesSugeridos && selectedAnalysis.IndicesSugeridos.length > 0" class="section-card">
          <h4 class="section-title">Sugestões de Índices ({{ selectedAnalysis.TotalSugestoesIndices }})</h4>
          <div class="indices-list">
            <code v-for="(indice, index) in selectedAnalysis.IndicesSugeridos" :key="index" class="indice-item">
              {{ indice }}
            </code>
          </div>
        </div>

        <!-- Boas Práticas -->
        <div v-if="selectedAnalysis.BoasPraticas" class="section-card">
          <h4 class="section-title">Boas Práticas</h4>
          <div class="practices-grid">
            <div v-if="selectedAnalysis.BoasPraticas.seguidas && selectedAnalysis.BoasPraticas.seguidas.length > 0" class="practices-column">
              <h5 class="practices-subtitle good">Seguidas</h5>
              <ul class="practices-list">
                <li v-for="(pratica, index) in selectedAnalysis.BoasPraticas.seguidas" :key="index">{{ pratica }}</li>
              </ul>
            </div>
            <div v-if="selectedAnalysis.BoasPraticas.violadas && selectedAnalysis.BoasPraticas.violadas.length > 0" class="practices-column">
              <h5 class="practices-subtitle bad">Violadas</h5>
              <ul class="practices-list">
                <li v-for="(pratica, index) in selectedAnalysis.BoasPraticas.violadas" :key="index">{{ pratica }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="selectedAnalysis.ImpactoPerformance" class="section-card">
          <h4 class="section-title">Impacto de Performance</h4>
          <div :class="['performance-box', 'performance-' + selectedAnalysis.ImpactoPerformance.avaliacao.toLowerCase()]">
            <div class="performance-badge">{{ selectedAnalysis.ImpactoPerformance.avaliacao }}</div>
            <p class="performance-explanation">{{ selectedAnalysis.ImpactoPerformance.explicacao }}</p>
            <p class="performance-estimate"><strong>Estimativa:</strong> {{ selectedAnalysis.ImpactoPerformance.estimativa }}</p>
          </div>
        </div>
      </div>
    </VModal>
  </div>
</template>

<script>
import VTable from '@/components/Table/VTable.vue'
import VModal from '@/components/Modal/VModal.vue'
import SqlDiffViewer from '@/components/Diff/SqlDiffViewer.vue'
import VButton from '@/components/Button/VButton.vue'
import { useFetch } from '@/hooks/useFetch.js'

export default {
  name: 'GeminiAnalysesView',
  components: { VTable, VModal, SqlDiffViewer, VButton },
  data() {
    return {
      analyses: [],
      selectedAnalysis: null,
      showModal: false,
      columns: [
        { key: 'AudSqlCodSentenca', label: 'Código da Sentença', sortable: true },
        {
          key: 'DataAnalise',
          label: 'Data da Análise',
          sortable: true,
          formatter: (value) => this.formatDate(value),
        },
        {
          key: 'Analise',
          label: 'Análise (Resumo)',
          sortable: false,
          truncate: true,
          showTooltip: true,
        },
      ],
    }
  },
  methods: {
    useFetch,

    async loadAnalyses() {
      try {
        const data = await this.useFetch('/api/v2/sql-analyzer/analises/')
        this.analyses = data.map((item) => ({
          ID: item.ID,
          AudSqlCodSentenca: item.AudSqlCodSentenca,
          Analise: item.Analise,
          DataAnalise: item.DataAnalise,
          Criticidade: item.Criticidade,
          RecomendacaoFinal: item.RecomendacaoFinal,
          ScoreQualidade: item.ScoreQualidade,
        }))
      } catch (error) {
        console.error('Erro ao carregar análises:', error)
      }
    },

    async handleRowClick(row) {
      try {
        // Busca os detalhes completos da análise
        const detail = await this.useFetch(`/api/v2/sql-analyzer/analises/${row.ID}`)

        // Parse do JSON de análise se existir
        let analiseData = {}
        if (detail.AnaliseJSON) {
          try {
            analiseData = JSON.parse(detail.AnaliseJSON)
          } catch (e) {
            console.error('Erro ao parsear AnaliseJSON:', e)
          }
        }

        // Busca a comparação SQL usando o código da sentença
        let sentencaAnterior = ''
        let sentencaNova = ''
        
        try {
          const comparacao = await this.useFetch(`/analises/aud-sqls/${detail.AudSqlCodSentenca}/comparacao`)
          sentencaAnterior = comparacao.versao_anterior?.sentenca || ''
          sentencaNova = comparacao.versao_atual?.sentenca || ''
        } catch (e) {
          console.error('Erro ao buscar comparação SQL:', e)
        }

        // Monta o objeto com todas as informações necessárias
        this.selectedAnalysis = {
          // Dados básicos
          ID: detail.ID,
          AudSqlCodSentenca: detail.AudSqlCodSentenca,
          DataAnalise: detail.DataAnalise,
          
          // Dados de contexto
          UsuarioAlteracao: detail.UsuarioAlteracao || 'N/A',
          SistemaOrigem: detail.SistemaOrigem || 'N/A',
          AplicacaoOrigem: detail.AplicacaoOrigem || 'N/A',
          
          // Dados da análise principal
          Criticidade: detail.Criticidade,
          ScoreQualidade: detail.ScoreQualidade,
          RecomendacaoFinal: detail.RecomendacaoFinal,
          TipoMudanca: detail.TipoMudanca,
          
          // Flags booleanas
          AlteraLogica: detail.AlteraLogica || false,
          ImpactaPerformance: detail.ImpactaPerformance || false,
          TemRiscoCritico: detail.TemRiscoCritico || false,
          TemSQLInjection: detail.TemSQLInjection || false,
          
          // Contadores
          TotalRiscosIdentificados: detail.TotalRiscosIdentificados || 0,
          TotalSugestoesIndices: detail.TotalSugestoesIndices || 0,
          
          // Dados do JSON parseado
          ResumoMudanca: analiseData.resumo_da_mudanca || '',
          ImpactoLogica: analiseData.impacto_logica || '',
          Riscos: analiseData.analise_de_risco || [],
          MudancasEspecificas: analiseData.mudancas_especificas || [],
          IndicesSugeridos: analiseData.indices_sugeridos || [],
          BoasPraticas: analiseData.boas_praticas || null,
          ImpactoPerformance: analiseData.impacto_performance || null,
          
          // SQL da comparação
          SentencaAnterior: sentencaAnterior,
          SentencaNova: sentencaNova,
        }

        this.showModal = true
      } catch (error) {
        console.error(`Erro ao carregar detalhes da análise ${row.ID}:`, error)
        // Fallback: mostra o modal com os dados que temos
        this.selectedAnalysis = {
          ...row,
          Riscos: [],
          MudancasEspecificas: [],
          IndicesSugeridos: [],
          BoasPraticas: null,
          ImpactoPerformance: null,
          SentencaAnterior: '',
          SentencaNova: '',
        }
        this.showModal = true
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR')
    },

    getCriticalityClass(criticidade) {
      const map = {
        CRITICA: 'critical',
        ALTA: 'high',
        MEDIA: 'medium',
        BAIXA: 'low',
      }
      return map[criticidade] || 'medium'
    },

    getRecommendationClass(recomendacao) {
      const map = {
        REVISAR: 'warning',
        APROVAR: 'success',
        REJEITAR: 'danger',
        ATENÇÃO: 'warning',
      }
      return map[recomendacao] || 'info'
    },

    formatTipoMudanca(tipo) {
      const map = {
        MUDANCA_REGRA_NEGOCIO: 'Mudança de Regra de Negócio',
        OTIMIZACAO: 'Otimização',
        CORRECAO: 'Correção',
        REFATORACAO: 'Refatoração',
      }
      return map[tipo] || tipo
    },

    formatRiscoTipo(tipo) {
      const map = {
        LOGICA_FILTRO_INCORRETO: 'Lógica de Filtro Incorreta',
        PERFORMANCE_QUERY_LENTA: 'Performance de Query Lenta',
        SQL_INJECTION: 'SQL Injection',
        DADOS_SENSIVEIS: 'Dados Sensíveis',
      }
      return map[tipo] || tipo.replace(/_/g, ' ')
    },

    async exportToPDF() {
      if (!this.selectedAnalysis) {
        alert('Nenhuma análise selecionada.');
        return;
      }

      try {
        const analiseId = this.selectedAnalysis.ID;
        const endpoint = `/api/v3/export/google-docs-pdf/${analiseId}`;
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        const options = {
          method: 'POST', 
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        };

        const response = await useFetch(`${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.detail || `Erro ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        const codSentenca = this.selectedAnalysis.AudSqlCodSentenca;
        link.setAttribute('download', `Relatorio_Analise_${codSentenca}.pdf`);
        document.body.appendChild(link);
        link.click();
        
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);

      } catch (error) {
        console.error('Erro ao exportar PDF via API:', error);
        alert(`Não foi possível gerar o PDF: ${error.message}`);
      }
    }
  },
  created() {
    this.loadAnalyses()
  },
}
</script>

<style scoped>
.gemini-analyses {
  margin-left: 20px;
}

.analysis-modal {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-height: 80vh;
  overflow-y: auto;
}

/* Header */
.analysis-header {
  background: #fff;
  color: #222;
  padding: 1rem;
  border-radius: 15px;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-main h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.badges {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-critical {
  background: #dc2626;
  color: white;
}

.badge-high {
  background: #ea580c;
  color: white;
}

.badge-medium {
  background: #f59e0b;
  color: white;
}

.badge-low {
  background: #10b981;
  color: white;
}

.badge-warning {
  background: #fbbf24;
  color: #78350f;
}

.badge-success {
  background: #22c55e;
  color: white;
}

.badge-danger {
  background: #ef4444;
  color: white;
}

.badge-info {
  background: #3b82f6;
  color: white;
}

.badge-score {
  color: #222;
}

.header-meta {
  display: flex;
  gap: 24px;
  font-size: 14px;
  opacity: 0.95;
}

/* Section Card */
.section-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-content {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #4b5563;
}

/* Metadata Grid */
.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metadata-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metadata-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 600;
}

.text-warning {
  color: #f59e0b !important;
}

.text-success {
  color: #10b981 !important;
}

/* Risks */
.section-risks {
  border-left: 4px solid #ef4444;
}

.risk-item {
  background: #fef2f2;
  border-left: 4px solid #dc2626;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.risk-item:last-child {
  margin-bottom: 0;
}

.risk-item.risk-alto {
  background: #fef2f2;
  border-left-color: #dc2626;
}

.risk-item.risk-medio {
  background: #fffbeb;
  border-left-color: #f59e0b;
}

.risk-item.risk-baixo {
  background: #f0fdf4;
  border-left-color: #10b981;
}

.risk-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.risk-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(0, 0, 0, 0.1);
}

.risk-type {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
}

.risk-description {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

.risk-recommendation {
  margin-top: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
}

/* Changes List */
.changes-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.changes-list li {
  position: relative;
  padding-left: 24px;
  margin-bottom: 12px;
  line-height: 1.6;
  color: #374151;
}

.changes-list li:before {
  content: '→';
  position: absolute;
  left: 0;
  color: #3b82f6;
  font-weight: bold;
  font-size: 16px;
}

/* Indices */
.indices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.indice-item {
  display: block;
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px 16px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  overflow-x: auto;
}

/* Practices */
.practices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.practices-column {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.practices-subtitle {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.practices-subtitle.good {
  color: #059669;
}

.practices-subtitle.bad {
  color: #dc2626;
}

.practices-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.practices-list li {
  position: relative;
  padding-left: 24px;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: #4b5563;
}

.good .practices-list li:before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #059669;
  font-weight: bold;
}

.bad .practices-list li:before {
  content: '✗';
  position: absolute;
  left: 0;
  color: #dc2626;
  font-weight: bold;
}

/* Performance */
.performance-box {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
}

.performance-box.performance-positivo {
  background: #f0fdf4;
  border-left-color: #10b981;
}

.performance-box.performance-negativo {
  background: #fef2f2;
  border-left-color: #ef4444;
}

.performance-box.performance-neutro {
  background: #f3f4f6;
  border-left-color: #6b7280;
}

.performance-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 12px;
  background: rgba(0, 0, 0, 0.1);
}

.performance-explanation {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

.performance-estimate {
  margin: 12px 0 0 0;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 13px;
  color: #4b5563;
}

/* Botão Exportar PDF */
.btn-export-pdf {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-export-pdf:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-export-pdf:active {
  transform: translateY(0);
}

.btn-export-pdf .icon {
  font-size: 16px;
}
</style>
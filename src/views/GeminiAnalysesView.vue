<template>
    <div class="page-header">
      <div class="header-content">
        <h1>Análises de Alterações (Gemini)</h1>
        <p>Histórico de todas as análises de alterações em sentenças SQL</p>
      </div>
    </div>
</template>

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
        <VButton @click="startPDFGeneration" variant="primary" size="small" style="width: 8rem">
          Exportar PDF
        </VButton>
        <div class="analysis-header">
          <div class="header-main">
            <h3>{{ selectedAnalysis.AudSqlCodSentenca }}</h3>
            <div class="badges">
              <span
                :class="['badge', 'badge-' + getCriticalityClass(selectedAnalysis.Criticidade)]"
              >
                {{ selectedAnalysis.Criticidade }}
              </span>
              <span
                :class="[
                  'badge',
                  'badge-' + getRecommendationClass(selectedAnalysis.RecomendacaoFinal),
                ]"
              >
                {{ selectedAnalysis.RecomendacaoFinal }}
              </span>
              <span class="badge badge-score">
                Score: {{ selectedAnalysis.ScoreQualidade }}/10
              </span>
            </div>
          </div>
          <div class="header-meta">
            <span><strong>Usuário:</strong> {{ selectedAnalysis.UsuarioAlteracao }}</span>
            <span
              ><strong>Sistema:</strong> {{ selectedAnalysis.AplicacaoOrigem }}
              {{ selectedAnalysis.SistemaOrigem }}</span
            >
            <span
              ><strong>Analisado em:</strong> {{ formatDate(selectedAnalysis.DataAnalise) }}</span
            >
          </div>
        </div>

        <!-- Resumo da Mudança -->
        <div class="section-card">
          <h4 class="section-title">Resumo da Mudança</h4>
          <p class="section-content">{{ selectedAnalysis.ResumoMudanca }}</p>
          <div class="metadata-grid">
            <div class="metadata-item">
              <span class="metadata-label">Propósito:</span>
              <span class="metadata-value">{{
                formatTipoMudanca(selectedAnalysis.TipoMudanca)
              }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Impacto na Lógica:</span>
              <span
                :class="[
                  'metadata-value',
                  selectedAnalysis.AlteraLogica ? 'text-warning' : 'text-success',
                ]"
              >
                {{ selectedAnalysis.AlteraLogica ? 'Sim' : 'Não' }}
              </span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Impacta Performance:</span>
              <span
                :class="[
                  'metadata-value',
                  selectedAnalysis.ImpactaPerformance ? 'text-warning' : 'text-success',
                ]"
              >
                {{ selectedAnalysis.ImpactaPerformance ? 'Sim' : 'Não' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Riscos Identificados -->
        <div
          v-if="selectedAnalysis.Riscos && selectedAnalysis.Riscos.length > 0"
          class="section-card section-risks"
        >
          <h4 class="section-title">
            Riscos Identificados ({{ selectedAnalysis.TotalRiscosIdentificados }})
          </h4>
          <div
            v-for="(risco, index) in selectedAnalysis.Riscos"
            :key="index"
            :class="['risk-item', 'risk-' + risco.nivel.toLowerCase()]"
          >
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
        <div
          v-if="
            selectedAnalysis.MudancasEspecificas && selectedAnalysis.MudancasEspecificas.length > 0
          "
          class="section-card"
        >
          <h4 class="section-title">Mudanças Específicas</h4>
          <ul class="changes-list">
            <li v-for="(mudanca, index) in selectedAnalysis.MudancasEspecificas" :key="index">
              {{ mudanca }}
            </li>
          </ul>
        </div>

        <!-- Sugestões de Índices -->
        <div
          v-if="selectedAnalysis.IndicesSugeridos && selectedAnalysis.IndicesSugeridos.length > 0"
          class="section-card"
        >
          <h4 class="section-title">
            Sugestões de Índices ({{ selectedAnalysis.TotalSugestoesIndices }})
          </h4>
          <div class="indices-list">
            <code
              v-for="(indice, index) in selectedAnalysis.IndicesSugeridos"
              :key="index"
              class="indice-item"
            >
              {{ indice }}
            </code>
          </div>
        </div>

        <!-- Boas Práticas -->
        <div v-if="selectedAnalysis.BoasPraticas" class="section-card">
          <h4 class="section-title">Boas Práticas</h4>
          <div class="practices-grid">
            <div
              v-if="
                selectedAnalysis.BoasPraticas.seguidas &&
                selectedAnalysis.BoasPraticas.seguidas.length > 0
              "
              class="practices-column"
            >
              <h5 class="practices-subtitle good">Seguidas</h5>
              <ul class="practices-list">
                <li v-for="(pratica, index) in selectedAnalysis.BoasPraticas.seguidas" :key="index">
                  {{ pratica }}
                </li>
              </ul>
            </div>
            <div
              v-if="
                selectedAnalysis.BoasPraticas.violadas &&
                selectedAnalysis.BoasPraticas.violadas.length > 0
              "
              class="practices-column"
            >
              <h5 class="practices-subtitle bad">Violadas</h5>
              <ul class="practices-list">
                <li v-for="(pratica, index) in selectedAnalysis.BoasPraticas.violadas" :key="index">
                  {{ pratica }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="selectedAnalysis.ImpactoPerformance" class="section-card">
          <h4 class="section-title">Impacto de Performance</h4>
          <div
            :class="[
              'performance-box',
              'performance-' + selectedAnalysis.ImpactoPerformance.avaliacao.toLowerCase(),
            ]"
          >
            <div class="performance-badge">{{ selectedAnalysis.ImpactoPerformance.avaliacao }}</div>
            <p class="performance-explanation">
              {{ selectedAnalysis.ImpactoPerformance.explicacao }}
            </p>
            <p class="performance-estimate">
              <strong>Estimativa:</strong> {{ selectedAnalysis.ImpactoPerformance.estimativa }}
            </p>
          </div>
        </div>
      </div>
    </VModal>
    <VOffcanvas
      v-model="showExportOffcanvas"
      side="right"
      width="650px"
      @update:modelValue="closeOffcanvas"
    >
      <div class="export-container">
        <!-- Generating State -->
        <div v-if="exportStatus === 'generating'" class="generating-state">
          <div class="generating-header">
            <div class="spinner-container">
              <div class="spinner"></div>
              <div class="spinner-glow"></div>
            </div>
            <h3 class="offcanvas-title gradient-text">Gerando Relatório</h3>
            <p class="offcanvas-subtitle">Processando análise em tempo real...</p>
          </div>

          <div class="typewriter-wrapper">
            <div class="terminal-header">
              <div class="terminal-buttons">
                <span class="terminal-btn red"></span>
                <span class="terminal-btn yellow"></span>
                <span class="terminal-btn green"></span>
              </div>
              <span class="terminal-title">análise.txt</span>
            </div>
            <div class="typewriter-container" ref="typewriterContainer">
              <pre
                class="typewriter-content">{{ typedContent }}<span class="blinking-cursor">█</span></pre>
            </div>
          </div>
        </div>

        <!-- Success State -->
        <div v-if="exportStatus === 'success'" class="success-state">
          <div class="success-header">
            <div class="success-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="url(#successGradient)"
                  stroke-width="3"
                  fill="none"
                  opacity="0.2"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="url(#successGradient)"
                  stroke-width="3"
                  fill="none"
                  stroke-dasharray="175.93"
                  stroke-dashoffset="0"
                  class="success-circle"
                />
                <path
                  d="M20 32L28 40L44 24"
                  stroke="url(#successGradient)"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="success-check"
                />
                <defs>
                  <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color: #10b981" />
                    <stop offset="100%" style="stop-color: #059669" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h3 class="offcanvas-title success-title">Relatório Gerado!</h3>
            <p class="offcanvas-subtitle">Seu documento está pronto para download</p>
          </div>

          <div class="pdf-preview-wrapper">
            <div class="pdf-preview">
              <embed :src="pdfBlobUrl" type="application/pdf" width="100%" height="100%" />
            </div>
          </div>

          <VButton @click="downloadPDF" variant="default" size="medium">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Baixar PDF
          </VButton>
        </div>

        <!-- Error State -->
        <div v-if="exportStatus === 'error'" class="error-state">
          <div class="error-header">
            <div class="error-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="28" stroke="#ef4444" stroke-width="3" opacity="0.2" />
                <path
                  d="M32 20v16M32 44v.01"
                  stroke="#ef4444"
                  stroke-width="3"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <h3 class="offcanvas-title error-title">Falha na Geração</h3>
            <p class="offcanvas-subtitle">Não foi possível gerar o relatório</p>
          </div>

          <div class="error-details">
            <div class="error-message-box">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p class="error-message">{{ generationError }}</p>
            </div>
          </div>

          <VButton @click="closeOffcanvas" variant="secondary" size="medium" class="close-button">
            Fechar
          </VButton>
        </div>
      </div>
    </VOffcanvas>
  </div>
</template>

<script>
import VTable from '@/components/Table/VTable.vue'
import VModal from '@/components/Modal/VModal.vue'
import SqlDiffViewer from '@/components/Diff/SqlDiffViewer.vue'
import VButton from '@/components/Button/VButton.vue'
import VOffcanvas from '@/components/Offcanvas/VOffcanvas.vue'
import { useFetch } from '@/hooks/useFetch.js'

export default {
  name: 'GeminiAnalysesView',
  components: { VTable, VModal, SqlDiffViewer, VButton, VOffcanvas },
  data() {
    return {
      showExportOffcanvas: false,
      exportStatus: 'idle', // 'idle', 'generating', 'success', 'error'
      typedContent: '',
      pdfBlobUrl: null,
      generationError: '',
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
        const detail = await this.useFetch(`/api/v2/sql-analyzer/analises/${row.ID}`);

        let analiseData = {};
        if (detail.AnaliseJSON) {
          try {
            analiseData = JSON.parse(detail.AnaliseJSON);
          } catch (e) {
            console.error('Erro ao parsear AnaliseJSON:', e);
          }
        }

        // --- CORREÇÃO APLICADA AQUI ---
        let sentencaAnterior = '';
        let sentencaNova = '';
        let tituloSentenca = '';
        let comparacao = {}; // Declarada fora e inicializada como objeto vazio

        try {
          // A variável 'comparacao' agora é atribuída à que foi declarada fora
          comparacao = await this.useFetch(`/analises/aud-sqls/${detail.AudSqlCodSentenca}/comparacao`) || {};
          sentencaAnterior = comparacao.versao_anterior?.sentenca || '';
          sentencaNova = comparacao.versao_atual?.sentenca || '';
          tituloSentenca = comparacao.versao_atual?.titulo || '';
        } catch (e) {
          console.error('Erro ao buscar comparação SQL:', e);
          // Se falhar, as variáveis continuarão vazias, mas o código não irá quebrar.
        }
        // --- FIM DA CORREÇÃO ---

        this.selectedAnalysis = {
          ID: detail.ID,
          AudSqlCodSentenca: detail.AudSqlCodSentenca,
          DataAnalise: detail.DataAnalise,
          UsuarioAlteracao: detail.UsuarioAlteracao || 'N/A',
          SistemaOrigem: detail.SistemaOrigem || 'N/A',
          AplicacaoOrigem: detail.AplicacaoOrigem || 'N/A',
          AudSqlCodColigada: detail.AudSqlCodColigada,
          Criticidade: detail.Criticidade,
          ScoreQualidade: detail.ScoreQualidade,
          RecomendacaoFinal: detail.RecomendacaoFinal,
          TipoMudanca: detail.TipoMudanca,
          AlteraLogica: detail.AlteraLogica || false,
          ImpactaPerformance: detail.ImpactaPerformance || false,
          TotalRiscosIdentificados: detail.TotalRiscosIdentificados || 0,
          TotalSugestoesIndices: detail.TotalSugestoesIndices || 0,
          ResumoMudanca: analiseData.resumo_da_mudanca || '',
          ImpactoLogica: analiseData.impacto_logica || '',
          Riscos: analiseData.analise_de_risco || [],
          MudancasEspecificas: analiseData.mudancas_especificas || [],
          IndicesSugeridos: analiseData.indices_sugeridos || [],
          BoasPraticas: analiseData.boas_praticas || null,
          ImpactoPerformanceJSON: analiseData.impacto_performance || null,
          
          // Agora estas linhas são seguras
          SentencaAnterior: sentencaAnterior,
          SentencaNova: sentencaNova,
          TituloSentenca: tituloSentenca,
        };

        this.showModal = true;
      } catch (error) {
        console.error(`Erro ao carregar detalhes da análise ${row.ID}:`, error);
        // O fallback continua útil para erros na primeira chamada à API
        this.selectedAnalysis = { ...row, Riscos: [], MudancasEspecificas: [], IndicesSugeridos: [], BoasPraticas: null, SentencaAnterior: '', SentencaNova: '' };
        this.showModal = true;
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR')
    },

    getCriticalityClass(criticidade) {
      const map = { CRITICA: 'critical', ALTA: 'high', MEDIA: 'medium', BAIXA: 'low' }
      return map[criticidade] || 'medium'
    },

    getRecommendationClass(recomendacao) {
      const map = { REVISAR: 'warning', APROVAR: 'success', REJEITAR: 'danger', ATENÇÃO: 'warning' }
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

    // --- INÍCIO DO NOVO BLOCO DE MÉTODOS PARA EXPORTAÇÃO ---

    buildTemplateText() {
      const s = this.selectedAnalysis
      if (!s) return ''

      const formatList = (list, prefix = '- ') =>
        list && list.length ? list.map((item) => `${prefix}${item}`).join('\n') : 'Nenhuma.'
      const formatRisks = (risks) => {
        if (!risks || !risks.length) return 'Nenhum risco identificado.'
        return risks
          .map(
            (r) =>
              `Nível: ${r.nivel.toUpperCase()} - ${this.formatRiscoTipo(r.tipo_risco)}\nDescrição: ${r.descricao}\nRecomendação: ${r.recomendacao}`,
          )
          .join('\n\n')
      }

      const template = `Relatório Técnico de Análise de SQL
Código da Sentença: ${s.AudSqlCodSentenca}
Sentença: ${s.TituloSentenca || 'N/A'}
Aplicação Origem: ${s.AplicacaoOrigem}
Sistema Origem: ${s.SistemaOrigem}
Coligada: ${s.AudSqlCodColigada || 'N/A'}

Usuário da Alteração: ${s.UsuarioAlteracao}
Tipo de mudança: ${this.formatTipoMudanca(s.TipoMudanca)}
Data da análise: ${this.formatDate(s.DataAnalise)}
Criticidade: ${s.Criticidade}
Recomendação final: ${s.RecomendacaoFinal}
Score de qualidade: ${s.ScoreQualidade}

Resumo Técnico da Mudança
${s.ResumoMudanca}

Detalhes Técnicos
Sentença SQL - Versão Anterior:
${s.SentencaAnterior}
Sentença SQL - Versão Atual:
${s.SentencaNova}

Diferenças Identificadas:
${formatList(s.MudancasEspecificas)}

Análise Automatizada
Propósito Provável da Alteração: ${s.ImpactoLogica}
Impacto na Lógica de Negócio: ${s.AlteraLogica ? 'Sim' : 'Não'}
Impacto de Performance: ${s.ImpactaPerformance ? 'Sim' : 'Não'}
Estimativa de Performance: ${s.ImpactoPerformanceJSON?.estimativa || 'N/A'}

Riscos Identificados
${formatRisks(s.Riscos)}

Sugestões de Índices de Otimização
${formatList(s.IndicesSugeridos, '')}

Boas Práticas
Boas práticas seguidas:
${formatList(s.BoasPraticas?.seguidas)}
Boas práticas violadas:
${formatList(s.BoasPraticas?.violadas)}

Conclusão da Análise
A sentença ${s.AudSqlCodSentenca}, analisada em ${this.formatDate(s.DataAnalise)}, apresenta criticidade ${s.Criticidade} e recebeu a recomendação ${s.RecomendacaoFinal}.
O sistema de análise detectou ${s.TotalRiscosIdentificados} risco(s) e ${s.TotalSugestoesIndices} sugestão(ões) de índice(s).
Com base nas evidências e nos impactos identificados, recomenda-se ${s.RecomendacaoFinal} antes da liberação em embiente de produção.

Este relatório foi gerado automaticamente pelo sistema de auditoria Sentinela...`

      return template
    },

    async typewriterEffect(fullText) {
      const typingSpeed = 5
      for (let i = 0; i < fullText.length; i++) {
        this.typedContent += fullText.charAt(i)
        const container = this.$refs.typewriterContainer
        if (container) {
          container.scrollTop = container.scrollHeight
        }
        await new Promise((resolve) => setTimeout(resolve, typingSpeed))
      }
    },

    async fetchPDF() {
      const analiseId = this.selectedAnalysis.ID
      const endpoint = `/api/v3/export/google-docs-pdf/${analiseId}`
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')

      const response = await fetch(`http://192.168.195.162:8000${endpoint}`, {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro do servidor: ${response.status} - ${errorText}`)
      }
      return await response.blob()
    },

    async startPDFGeneration() {
      if (!this.selectedAnalysis) return

      this.exportStatus = 'generating'
      this.typedContent = ''
      this.generationError = ''
      this.pdfBlobUrl = null
      this.showExportOffcanvas = true

      const templateText = this.buildTemplateText()

      try {
        const [_, pdfBlob] = await Promise.all([
          this.typewriterEffect(templateText),
          this.fetchPDF(),
        ])

        this.pdfBlobUrl = window.URL.createObjectURL(pdfBlob)
        this.exportStatus = 'success'
      } catch (error) {
        console.error('Falha na geração do PDF:', error)
        this.generationError = error.message
        this.exportStatus = 'error'
      }
    },

    downloadPDF() {
      if (!this.pdfBlobUrl) return
      const link = document.createElement('a')
      link.href = this.pdfBlobUrl
      const codSentenca = this.selectedAnalysis.AudSqlCodSentenca
      link.setAttribute('download', `Relatorio_Analise_${codSentenca}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },

    closeOffcanvas() {
      if (this.pdfBlobUrl) {
        window.URL.revokeObjectURL(this.pdfBlobUrl)
      }
      this.showExportOffcanvas = false
      setTimeout(() => {
        this.exportStatus = 'idle'
        this.typedContent = ''
      }, 300)
    },
  },
  created() {
    this.loadAnalyses()
  },
}
</script>

<style scoped>
.gemini-analyses {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 24px;
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

/* ===== OFFCANVAS EXPORT STYLES ===== */
.export-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* Generating State */
.generating-state {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 32px 24px;
  gap: 24px;
}

.generating-header {
  text-align: center;
  padding-bottom: 24px;
  border-bottom: 2px solid #e2e8f0;
}

.spinner-container {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
}

.spinner {
  width: 80px;
  height: 80px;
  border: 4px solid transparent;
  border-top: 4px solid #667eea;
  border-right: 4px solid #764ba2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.3), transparent);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.offcanvas-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.offcanvas-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

/* Terminal/Typewriter */
.typewriter-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.terminal-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #0f172a;
  border-bottom: 1px solid #334155;
}

.terminal-buttons {
  display: flex;
  gap: 8px;
  margin-right: auto;
}

.terminal-btn {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.terminal-btn.red {
  background: #ef4444;
}
.terminal-btn.yellow {
  background: #f59e0b;
}
.terminal-btn.green {
  background: #10b981;
}

.terminal-title {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.typewriter-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #1e293b;
}

.typewriter-content {
  margin: 0;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.blinking-cursor {
  color: #667eea;
  animation: blink 1s step-end infinite;
  font-weight: bold;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* Success State */
.success-state {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 32px 24px;
  gap: 24px;
}

.success-header {
  text-align: center;
  padding-bottom: 24px;
  border-bottom: 2px solid #e2e8f0;
}

.success-icon {
  margin: 0 auto 24px;
  width: 80px;
  height: 80px;
}

.success-circle {
  animation: drawCircle 0.6s ease-out forwards;
}

.success-check {
  stroke-dasharray: 50;
  stroke-dashoffset: 50;
  animation: drawCheck 0.4s ease-out 0.6s forwards;
}

@keyframes drawCircle {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes drawCheck {
  to {
    stroke-dashoffset: 0;
  }
}

.success-title {
  color: #10b981;
}

.pdf-preview-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 2px solid #e2e8f0;
}

.pdf-preview {
  flex: 1;
  position: relative;
  min-height: 0;
}

.download-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
}

.download-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.download-button:active {
  transform: translateY(0);
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 32px 24px;
  gap: 24px;
}

.error-header {
  text-align: center;
  padding-bottom: 24px;
  border-bottom: 2px solid #fee2e2;
}

.error-icon {
  margin: 0 auto 24px;
  width: 80px;
  height: 80px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

.error-title {
  color: #ef4444;
}

.error-details {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-message-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px;
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 10px;
  max-width: 100%;
}

.error-message-box svg {
  flex-shrink: 0;
  color: #ef4444;
  margin-top: 2px;
}

.error-message {
  margin: 0;
  color: #991b1b;
  font-size: 14px;
  line-height: 1.6;
  font-weight: 500;
}

.close-button {
  width: 100%;
  padding: 14px 24px;
  background: #f1f5f9;
  color: #475569;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

/* Scrollbar personalizada */
.typewriter-container::-webkit-scrollbar {
  width: 8px;
}

.typewriter-container::-webkit-scrollbar-track {
  background: #0f172a;
}

.typewriter-container::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

.typewriter-container::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
:deep(.offcanvas),
:deep(.offcanvas-backdrop) {
  z-index: 2000; /* Um valor alto para garantir que fique sobre o modal */
}

/* Header */
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

/* Responsividade */
@media (max-width: 1024px) {
  .page-header {
    margin-bottom: 0.75rem;
    padding-bottom: 1rem;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .header-content p {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .page-header {
    margin-bottom: 0.5rem;
    padding-bottom: 0.75rem;
  }

  .header-content h1 {
    font-size: 1.75rem;
  }

  .header-content p {
    font-size: 0.95rem;
  }
}

</style>

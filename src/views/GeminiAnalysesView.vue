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

    <VModal v-model="showModal" title="Detalhes da Análise" size="large">
      <div v-if="selectedAnalysis" class="analysis-modal">
        <h3>{{ selectedAnalysis.AudSqlCodSentenca }}</h3>
        <p class="analysis-date">Analisado em: {{ formatDate(selectedAnalysis.DataAnalise) }}</p>

        <SqlDiffViewer
          :old-sql="selectedAnalysis.SentencaAnterior"
          :new-sql="selectedAnalysis.SentencaNova"
        />

        <div class="gemini-result">
          <h4 class="gemini-title">Análise do Gemini</h4>
          <p class="gemini-text">{{ selectedAnalysis.Analise }}</p>
        </div>
      </div>
    </VModal>
  </div>
</template>

<script>
import VTable from '@/components/Table/VTable.vue'
import VModal from '@/components/Modal/VModal.vue'
import SqlDiffViewer from '@/components/Diff/SqlDiffViewer.vue'
import { useFetch } from '@/hooks/useFetch.js'

export default {
  name: 'GeminiAnalysesView',
  components: { VTable, VModal, SqlDiffViewer },
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
        const data = await this.useFetch('/analises/aud-sqls/')
        this.analyses = data.map((item) => ({
          ID: item.ID,
          AudSqlCodSentenca: item.aud_sql_cod_sentenca,
          Analise: item.analise,
          DataAnalise: item.data_analise,
        }))
      } catch (error) {
        console.error('Erro ao carregar análises:', error)
      }
    },

    async handleRowClick(row) {
      try {
        const detail = await this.useFetch(`/analises/aud-sqls/${row.AudSqlCodSentenca}/comparacao`)

        this.selectedAnalysis = {
          ...row,
          SentencaAnterior: detail.versao_anterior?.sentenca || '',
          SentencaNova: detail.versao_atual?.sentenca || '',
          Analise: detail.analise?.texto || row.Analise,
          DataAnalise: detail.analise?.data_analise || row.DataAnalise,
        }

        this.showModal = true
      } catch (error) {
        console.error(`Erro ao carregar detalhes da sentença ${row.AudSqlCodSentenca}:`, error)
        this.selectedAnalysis = row // fallback
        this.showModal = true
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR')
    },
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
  gap: 20px;
}
.analysis-date {
  font-size: 14px;
  color: #64748b;
  margin-top: -15px;
}
.gemini-result {
  background: #f0fdf4;
  border-left: 4px solid #22c55e;
  padding: 16px;
  border-radius: 8px;
}
.gemini-title {
  margin: 0 0 8px 0;
  color: #166534;
}
.gemini-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #15803d;
}
</style>

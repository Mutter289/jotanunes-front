<template>
  <div class="audit">
    <div class="table-filter-container">
      <div class="filter-header">
        <h2 class="filter-title">Auditoria de Dados</h2>
        <p class="filter-description">Selecione o tipo de registro para visualizar</p>
      </div>

      <div class="table-tabs">
        <button
          v-for="table in listTable"
          :key="table.value"
          :class="['table-tab', { active: tableActive === table.value }]"
          @click="selectTable(table.value)"
        >
          <div class="tab-icon" v-html="getTableIcon(table.value)"></div>
          <div class="tab-content">
            <span class="tab-title">{{ table.text }}</span>
            <span class="tab-subtitle">{{ getTableSubtitle(table.value) }}</span>
          </div>
          <div v-if="tableActive === table.value" class="tab-active-indicator">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>
      </div>
    </div>

    <VTable
      @row-click="handleRowClick"
      @selection-change="handleSelection"
      @action="handleAction"
      :search-placeholder="searchPlaceholder"
      :data="tableData"
      :columns="currentColumns"
      :searchable="true"
      :selectable="true"
      :paginate="true"
      :page-size="10"
      :row-key="rowKey"
    />

    <!-- Offcanvas com dados da linha selecionada -->
    <VOffcanvas
      v-model="showOffcanvas"
      side="right"
      width="900px"
      :title="`Detalhes - ${getRowTitle(selectedRow)}`"
    >
      <!-- Conteúdo do Offcanvas -->
      <div v-if="selectedRow" class="offcanvas-content">
        <!-- Header com informações principais -->
        <div class="detail-header">
          <div
            v-if="tableActive === 'audfv'"
            class="detail-badge"
            :class="selectedRow.ATIVO === 'Ativado' ? 'badge-active' : 'badge-inactive'"
          >
            {{ selectedRow.ATIVO }}
          </div>
          <h2>{{ getRowTitle(selectedRow) }}</h2>
          <p class="detail-id">ID: {{ getRowId(selectedRow) }}</p>
        </div>

        <!-- Seção de Análise Gemini (apenas para audsql) -->
        <div v-if="tableActive === 'audsql'" class="detail-section">
          <h3 class="section-title">Análise de Alteração (Gemini)</h3>

          <div v-if="isLoadingAnalysis" class="loading-analysis">
            <div class="spinner"></div>
            <p>Buscando análise do Gemini...</p>
          </div>

          <div v-else-if="geminiAnalysis">
            <SqlDiffViewer
              :old-sql="geminiAnalysis.sentenca_anterior"
              :new-sql="geminiAnalysis.sentenca_nova"
            />
            <div class="gemini-result-offcanvas">
              <h4 class="gemini-title-offcanvas">Descrição da Mudança</h4>
              <p>{{ geminiAnalysis.resultado_analise }}</p>
            </div>
          </div>

          <div v-else class="no-analysis">
            <p>Nenhuma análise de alteração encontrada para este registro.</p>
          </div>
        </div>

        <!-- Seção de Informações Gerais -->
        <div class="detail-section">
          <h3 class="section-title">Informações Gerais</h3>
          <div class="detail-grid">
            <!-- Campos para Formas Visuais -->
            <template v-if="tableActive === 'audfv'">
              <div class="detail-item">
                <label>Nome:</label>
                <span>{{ selectedRow.NOME || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>ID do Registro:</label>
                <span>{{ selectedRow.RECID || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Status:</label>
                <span
                  :class="selectedRow.ATIVO === 'Ativado' ? 'status-active' : 'status-inactive'"
                >
                  {{ selectedRow.ATIVO }}
                </span>
              </div>
              <div class="detail-item">
                <label>Modificado por:</label>
                <span>{{ selectedRow.RECMODIFIEDBY || 'N/A' }}</span>
              </div>
            </template>

            <!-- Campos para SQL -->
            <template v-else-if="tableActive === 'audsql'">
              <div class="detail-item">
                <label>Código da Sentença:</label>
                <span>{{ selectedRow.CODSENTENCA || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Título:</label>
                <span>{{ selectedRow.TITULO || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Aplicação:</label>
                <span>{{ selectedRow.APLICACAO || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Tamanho:</label>
                <span>{{ selectedRow.TAMANHO || 'N/A' }} caracteres</span>
              </div>
              <div class="detail-item">
                <label>Coligada:</label>
                <span>{{ selectedRow.CODCOLIGADA || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Modificado por:</label>
                <span>{{ selectedRow.RECMODIFIEDBY || 'N/A' }}</span>
              </div>
            </template>

            <!-- Campos para Reports -->
            <template v-else-if="tableActive === 'audreport'">
              <div class="detail-item">
                <label>ID:</label>
                <span>{{ selectedRow.ID || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Código:</label>
                <span>{{ selectedRow.CODIGO || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Aplicação:</label>
                <span>{{ selectedRow.CODAPLICACAO || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Coligada:</label>
                <span>{{ selectedRow.CODCOLIGADA || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Último usuário:</label>
                <span>{{ selectedRow.USRULTALTERACAO || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <label>Criado por:</label>
                <span>{{ selectedRow.RECCREATEDBY || 'N/A' }}</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Seção de Descrição -->
        <div class="detail-section">
          <h3 class="section-title">Descrição</h3>
          <div class="detail-description">
            {{ getDescription(selectedRow) || 'Sem descrição disponível' }}
          </div>
        </div>

        <!-- Botão para ver sentença SQL (apenas para audsql) -->
        <div v-if="tableActive === 'audsql' && selectedRow.SENTENCA" class="detail-section">
          <h3 class="section-title">Sentença SQL</h3>
          <div class="sql-preview">
            <p class="sql-preview-text">
              Clique no botão abaixo para visualizar a sentença SQL formatada:
            </p>
            <VButton @click="showSqlModal = true" variant="primary" text="Ver Sentença SQL" />
          </div>
        </div>

        <!-- Seção de Metadados -->
        <div class="detail-section">
          <h3 class="section-title">Metadados</h3>
          <div class="detail-grid">
            <div class="detail-item" v-if="selectedRow.RECCREATEDBY">
              <label>Criado por:</label>
              <span>{{ selectedRow.RECCREATEDBY }}</span>
            </div>
            <div class="detail-item" v-if="selectedRow.RECCREATEDON">
              <label>Data de Criação:</label>
              <span>{{ formatDate(selectedRow.RECCREATEDON) }}</span>
            </div>
            <div class="detail-item" v-if="getLastModifiedDate(selectedRow)">
              <label>Última Modificação:</label>
              <span>{{ formatDate(getLastModifiedDate(selectedRow)) }}</span>
            </div>
            <div class="detail-item" v-if="selectedRow.RECVERSION">
              <label>Versão:</label>
              <span>v{{ selectedRow.RECVERSION }}</span>
            </div>
          </div>
        </div>

        <!-- Seção de Observações -->
        <div class="detail-section">
          <h3 class="section-title">Observações</h3>

          <!-- Lista de observações existentes -->
          <div v-if="isLoadingObservations" class="loading-observations">
            <div class="spinner-small"></div>
            <p>Carregando observações...</p>
          </div>

          <div v-else-if="observations.length > 0" class="observations-list">
            <div v-for="obs in observations" :key="obs.id" class="observation-item">
              <div class="observation-header">
                <span class="observation-author">{{ obs.usuario || 'Usuário' }}</span>
                <span class="observation-date">{{
                  formatDate(obs.data_criacao || obs.createdAt)
                }}</span>
              </div>
              <div class="observation-text">{{ obs.observacao || obs.texto }}</div>
            </div>
          </div>

          <div v-else class="no-observations">
            <p>Nenhuma observação registrada ainda.</p>
          </div>

          <!-- Formulário para nova observação -->
          <div class="observation-form">
            <h4 class="form-subtitle">Adicionar nova observação</h4>
            <textarea
              v-model="observationText"
              class="observation-textarea"
              placeholder="Digite sua observação..."
              rows="3"
              @input="autoResize"
              ref="observationTextarea"
            ></textarea>
            <div class="observation-actions">
              <VButton
                @click="saveObservation"
                variant="primary"
                text="Adicionar Observação"
                :disabled="!observationText.trim() || isSavingObservation"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-else class="loading-state">
        <div class="spinner"></div>
        <p>Carregando detalhes...</p>
      </div>
    </VOffcanvas>

    <!-- Modal para exibir sentença SQL -->
    <VModal
      v-model="showSqlModal"
      title="Sentença SQL"
      size="large"
      :show-footer="false"
      :show-confirm-button="false"
      :show-cancel-button="false"
    >
      <div class="sql-modal-content">
        <div class="sql-info">
          <h4>{{ selectedRow?.TITULO || 'Sentença SQL' }}</h4>
          <p><strong>Código:</strong> {{ selectedRow?.CODSENTENCA }}</p>
          <p><strong>Tamanho:</strong> {{ selectedRow?.TAMANHO }} caracteres</p>
        </div>
        <div class="sql-code-container">
          <pre class="sql-code-formatted">{{ formatSqlCode(selectedRow?.SENTENCA) }}</pre>
        </div>
        <div class="sql-modal-footer">
          <VButton @click="copySqlToClipboard" variant="secondary" text="Copiar SQL" />
          <VButton @click="showSqlModal = false" variant="danger" text="Fechar" />
        </div>
      </div>
    </VModal>
  </div>
</template>

<script>
import VTable from '@/components/Table/VTable.vue'
import VOffcanvas from '@/components/Offcanvas/VOffcanvas.vue'
import VButton from '@/components/Button/VButton.vue'
import VSelect from '@/components/Select/VSelect.vue'
import VModal from '@/components/Modal/VModal.vue'
import SqlDiffViewer from '@/components/Diff/SqlDiffViewer.vue'
import { useFetch } from '@/hooks/useFetch.js'

export default {
  components: { VSelect, VTable, VOffcanvas, VModal, VButton, SqlDiffViewer },
  data() {
    return {
      tableActive: 'audfv',
      listTable: [
        { value: 'audfv', text: 'Formas Visuais' },
        { value: 'audsql', text: 'Códigos SQL' },
        { value: 'audreport', text: 'Relatórios' },
      ],
      showOffcanvas: false,
      showSqlModal: false,
      selectedRow: null,
      selectedRowId: null,
      tableData: [],

      //OBSERVAÇÕES
      observations: [],
      observationText: '',
      isSavingObservation: false,
      isLoadingObservations: false,

      // Novos dados para análise do Gemini
      geminiAnalysis: null,
      isLoadingAnalysis: false,

      // Configurações das colunas para cada tabela
      tableColumns: {
        audfv: [
          { key: 'RECID', label: 'ID', sortable: true, width: '80px' },
          { key: 'NOME', label: 'Nome', sortable: true, width: '200px' },
          {
            key: 'DESCRICAO',
            label: 'Descrição',
            sortable: true,
            width: '300px',
            truncate: true,
            showTooltip: true,
          },
          { key: 'RECMODIFIEDBY', label: 'Modificado por', sortable: true, width: '150px' },
          {
            key: 'ATIVO',
            label: 'Status',
            sortable: true,
            width: '120px',
            formatter: (value) => (value ? 'Ativado' : 'Desativado'),
          },
        ],
        audsql: [
          { key: 'CODSENTENCA', label: 'Código', sortable: true, width: '150px' },
          { key: 'TITULO', label: 'Título', sortable: true, width: '300px' },
          {
            key: 'RECMODIFIEDON',
            label: 'Última Atualização',
            sortable: true,
            width: '180px',
            formatter: (value) => this.formatDate(value),
          },
          { key: 'RECMODIFIEDBY', label: 'Modificado por', sortable: true, width: '150px' },
        ],
        audreport: [
          { key: 'CODIGO', label: 'Código', sortable: true, width: '120px' },
          { key: 'DESCRICAO', label: 'Descrição', sortable: true, width: '300px' },
          {
            key: 'DATAULTALTERACAO',
            label: 'Última Atualização',
            sortable: true,
            width: '180px',
            formatter: (value) => this.formatDate(value),
          },
          { key: 'USRULTALTERACAO', label: 'Modificado por', sortable: true, width: '150px' },
        ],
      },

      // Configurações dos endpoints
      endpoints: {
        audfv: '/audfv/',
        audsql: '/aud-sqls/',
        audreport: '/aud-reports/',
      },

      // Configurações das chaves primárias
      rowKeys: {
        audfv: 'RECID',
        audsql: 'CODSENTENCA',
        audreport: 'ID',
      },
    }
  },

  computed: {
    currentColumns() {
      return this.tableColumns[this.tableActive] || []
    },

    rowKey() {
      return this.rowKeys[this.tableActive] || 'RECID'
    },

    searchPlaceholder() {
      const placeholders = {
        audfv: 'Buscar pelo nome, descrição ou usuário...',
        audsql: 'Buscar pelo código, título ou usuário...',
        audreport: 'Buscar pelo código, descrição ou usuário...',
      }
      return placeholders[this.tableActive] || 'Buscar...'
    },
  },

  methods: {
    useFetch,

    getTableIcon(tableValue) {
      const icons = {
        audfv: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>`,
        audsql: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
        </svg>`,
        audreport: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>`
      }
      return icons[tableValue] || ''
    },

    getTableSubtitle(tableValue) {
      const subtitles = {
        audfv: 'Interfaces e componentes visuais',
        audsql: 'Consultas e comandos SQL',
        audreport: 'Documentos e relatórios'
      }
      return subtitles[tableValue] || ''
    },

    async selectTable(tableValue) {
      if (this.tableActive === tableValue) return
      this.tableActive = tableValue
      await this.onTableChange()
    },

    async onTableChange() {
      console.log('Tabela alterada para:', this.tableActive)
      this.tableData = []
      this.selectedRow = null
      this.showOffcanvas = false
      this.showSqlModal = false
      await this.loadTableData()
    },

    async loadTableData() {
      try {
        const endpoint = this.endpoints[this.tableActive]
        if (!endpoint) {
          console.error('Endpoint não encontrado para:', this.tableActive)
          return
        }

        const json = (await this.useFetch(endpoint)) || []
        this.tableData = json
          .filter((item) => item != null)
          .map((item) => this.transformRowData(item))

        console.log(`Dados carregados para ${this.tableActive}:`, this.tableData)
      } catch (e) {
        console.error('Erro ao carregar dados:', e)
        this.$toast?.error(`Erro ao carregar dados de ${this.getTableName()}`)
      }
    },

    transformRowData(item) {
      // Transformações específicas baseadas na tabela ativa
      switch (this.tableActive) {
        case 'audfv':
          return {
            ...item,
            RECID: item.RECID || item.ID || item.id,
            ATIVO: item.ATIVO ? 'Ativado' : 'Desativado',
          }
        case 'audsql':
          return {
            ...item,
            // Manter dados originais sem transformação especial
          }
        case 'audreport':
          return {
            ...item,
            // Manter dados originais sem transformação especial
          }
        default:
          return item
      }
    },

    getTableName() {
      const names = {
        audfv: 'Formas Visuais',
        audsql: 'Códigos SQL',
        audreport: 'Relatórios',
      }
      return names[this.tableActive] || 'tabela'
    },

    getRowTitle(row) {
      if (!row) return 'Carregando...'

      switch (this.tableActive) {
        case 'audfv':
          return row.NOME || 'Sem nome'
        case 'audsql':
          return row.TITULO || row.CODSENTENCA || 'Sem título'
        case 'audreport':
          return row.DESCRICAO || row.CODIGO || 'Sem descrição'
        default:
          return 'Item'
      }
    },

    getRowId(row) {
      if (!row) return 'N/A'

      switch (this.tableActive) {
        case 'audfv':
          return row.RECID
        case 'audsql':
          return row.CODSENTENCA
        case 'audreport':
          return row.ID
        default:
          return 'N/A'
      }
    },

    getDescription(row) {
      if (!row) return ''

      switch (this.tableActive) {
        case 'audfv':
          return row.DESCRICAO
        case 'audsql':
          return row.TITULO
        case 'audreport':
          return row.DESCRICAO
        default:
          return ''
      }
    },

    getLastModifiedDate(row) {
      if (!row) return null

      switch (this.tableActive) {
        case 'audfv':
          return row.RECMODIFIEDON
        case 'audsql':
          return row.RECMODIFIEDON
        case 'audreport':
          return row.DATAULTALTERACAO
        default:
          return null
      }
    },

    async saveObservation() {
      if (!this.observationText.trim() || !this.selectedRow) return

      this.isSavingObservation = true

      try {
        const endpoint = this.endpoints[this.tableActive]
        const rowId = this.getRowId(this.selectedRow)

        const newObservation = await this.useFetch(`${endpoint}${rowId}/observacao`, {
          method: 'POST',
          body: {
            observacao: this.observationText.trim(),
          },
        })

        // Adiciona a nova observação ao array
        if (newObservation) {
          this.observations.unshift(newObservation)
        }

        // Limpa o campo de texto
        this.observationText = ''
        this.$toast?.success('Observação salva com sucesso')
      } catch (e) {
        console.error('Erro ao salvar observação:', e)
        this.$toast?.error('Erro ao salvar observação')
      } finally {
        this.isSavingObservation = false
      }
    },

    async loadObservations(rowId) {
      if (!rowId) return

      this.isLoadingObservations = true
      try {
        const endpoint = this.endpoints[this.tableActive]
        const data = await this.useFetch(`${endpoint}${rowId}/observacoes`)

        if (data && Array.isArray(data)) {
          this.observations = data
        } else {
          this.observations = []
        }
      } catch (e) {
        console.error('Erro ao carregar observações:', e)
        this.observations = []
      } finally {
        this.isLoadingObservations = false
      }
    },

    autoResize(event) {
      const textarea = event.target
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    },

    async handleRowClick(row) {
      console.log('Linha clicada:', row)
      this.selectedRow = row
      this.selectedRowId = this.getRowId(row)
      this.showOffcanvas = true

      // Limpa dados anteriores
      this.geminiAnalysis = null
      this.observationText = ''
      this.observations = [] // Limpa observações anteriores

      // Se a tabela for SQL, busca a análise do Gemini
      if (this.tableActive === 'audsql') {
        await this.loadGeminiAnalysis(this.selectedRowId)
      }

      // Carregar detalhes e observações
      const rowId = this.getRowId(row)
      if (rowId) {
        await this.loadRowDetails(rowId)
        await this.loadObservations(rowId) // Carrega observações
      }
    },
    async loadGeminiAnalysis(codSentenca) {
      if (!codSentenca) return
      this.isLoadingAnalysis = true
      try {
        const data = await this.useFetch(`/analises/aud-sqls/${codSentenca}/comparacao`)
        if (data) {
          this.geminiAnalysis = {
            sentenca_anterior: data.versao_anterior?.sentenca || '',
            sentenca_nova: data.versao_atual?.sentenca || '',
            resultado_analise: data.analise?.texto || 'Nenhuma análise disponível',
          }
        } else {
          this.geminiAnalysis = null
        }
      } catch (error) {
        console.error('Erro ao carregar comparação do Gemini:', error)
        this.geminiAnalysis = null
      } finally {
        this.isLoadingAnalysis = false
      }
    },

    async loadRowDetails(id) {
      try {
        const endpoint = this.endpoints[this.tableActive]
        const details = await this.useFetch(`${endpoint}${id}`)
        if (details) {
          this.selectedRow = {
            ...this.selectedRow,
            ...this.transformRowData(details),
          }
        }
      } catch (e) {
        console.error('Erro ao carregar detalhes:', e)
      }
    },

    // Métodos para formatação de SQL
    formatSqlCode(sqlCode) {
      if (!sqlCode) return ''

      // Formatação básica de SQL
      return sqlCode
        .replace(/\s+/g, ' ') // Remove espaços extras
        .replace(/\s*,\s*/g, ',\n    ') // Vírgulas com quebra de linha
        .replace(/\bSELECT\b/gi, 'SELECT')
        .replace(/\bFROM\b/gi, '\nFROM')
        .replace(/\bWHERE\b/gi, '\nWHERE')
        .replace(/\bAND\b/gi, '\n  AND')
        .replace(/\bOR\b/gi, '\n  OR')
        .replace(/\bORDER BY\b/gi, '\nORDER BY')
        .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
        .replace(/\bHAVING\b/gi, '\nHAVING')
        .replace(/\bINNER JOIN\b/gi, '\nINNER JOIN')
        .replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN')
        .replace(/\bRIGHT JOIN\b/gi, '\nRIGHT JOIN')
        .trim()
    },

    async copySqlToClipboard() {
      try {
        await navigator.clipboard.writeText(this.selectedRow?.SENTENCA || '')
        this.$toast?.success('SQL copiado para a área de transferência')
      } catch (e) {
        console.error('Erro ao copiar SQL:', e)
        this.$toast?.error('Erro ao copiar SQL')
      }
    },

    handleSelection(selected) {
      console.log('Linhas selecionadas:', selected)
      this.selectedRows = selected
    },

    handleAction({ action, row }) {
      console.log('Ação:', action.key, 'Linha:', row)

      switch (action.key) {
        case 'view':
          this.handleRowClick(row)
          break
        case 'edit':
          this.editRow(row)
          break
        case 'delete':
          this.deleteRow(row)
          break
        default:
          console.log('Ação não implementada:', action.key)
      }
    },

    editRow(row) {
      const targetRow = row || this.selectedRow
      console.log('Editando linha:', targetRow)
      // Implementar lógica de edição baseada na tabela ativa
    },

    async deleteRow(row) {
      const targetRow = row || this.selectedRow
      const rowTitle = this.getRowTitle(targetRow)
      const rowId = this.getRowId(targetRow)

      if (!confirm(`Deseja realmente excluir o registro "${rowTitle}"?`)) {
        return
      }

      try {
        const endpoint = this.endpoints[this.tableActive]
        await this.useFetch(`${endpoint}${rowId}`, {
          method: 'DELETE',
        })

        const index = this.tableData.findIndex((item) => this.getRowId(item) === rowId)
        if (index > -1) {
          this.tableData.splice(index, 1)
        }

        this.showOffcanvas = false
        this.selectedRow = null
        this.$toast?.success('Registro excluído com sucesso')
      } catch (e) {
        console.error('Erro ao excluir:', e)
        this.$toast?.error('Erro ao excluir registro')
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'

      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR')
      } catch {
        return dateString
      }
    },

    async refreshData() {
      await this.loadTableData()
    },
  },

  created() {
    this.loadTableData()
  },

  beforeUnmount() {
    this.selectedRow = null
    this.selectedRowId = null
  },
}
</script>

<style scoped>
/* Container principal */
.audit {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-left: 20px;
}

.table-filter-container {
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
  border-radius: 20px;
  padding: 32px;
  box-shadow:
    0 20px 60px rgba(188, 31, 27, 0.4),
    0 8px 24px rgba(188, 31, 27, 0.3);
  animation: slideDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.table-filter-container::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: float 8s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(-20px, 20px) rotate(180deg);
  }
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

.filter-header {
  text-align: center;
  margin-bottom: 28px;
  position: relative;
  z-index: 1;
}

.filter-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.5px;
}

.filter-description {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
  letter-spacing: 0.2px;
}

.table-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  position: relative;
  z-index: 1;
}

.table-tab {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 24px 20px;
  color: #bc1f1b;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.table-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(188, 31, 27, 0.1), transparent);
  transition: left 0.5s;
}

.table-tab:hover::before {
  left: 100%;
}

.table-tab:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.25),
    0 0 30px rgba(188, 31, 27, 0.2);
  border-color: rgba(188, 31, 27, 0.4);
}

.table-tab:hover .tab-icon {
  transform: scale(1.15) rotate(5deg);
}

.table-tab.active {
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
  border-color: #bc1f1b;
  color: #ffffff;
  transform: translateY(-4px) scale(1.03);
  box-shadow:
    0 20px 50px rgba(188, 31, 27, 0.4),
    0 0 0 4px rgba(255, 255, 255, 0.3);
  animation: tabActivate 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes tabActivate {
  0% {
    transform: translateY(-4px) scale(1);
  }
  50% {
    transform: translateY(-4px) scale(1.06);
  }
  100% {
    transform: translateY(-4px) scale(1.03);
  }
}

.table-tab.active .tab-icon {
  animation: iconPulse 0.6s ease-out;
  color: #ffffff;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.3) rotate(-10deg);
  }
  60% {
    transform: scale(0.9) rotate(5deg);
  }
}

.table-tab:active {
  transform: translateY(-2px) scale(0.98);
}

.tab-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
}

.tab-icon svg {
  width: 100%;
  height: 100%;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.tab-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.2px;
  line-height: 1.2;
}

.tab-subtitle {
  font-size: 12px;
  opacity: 0.85;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0.1px;
}

.table-tab.active .tab-subtitle {
  opacity: 0.95;
}

.tab-active-indicator {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bc1f1b;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: checkmarkAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-active-indicator svg {
  width: 18px;
  height: 18px;
  animation: checkmarkDraw 0.4s ease-out;
}

@keyframes checkmarkAppear {
  from {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes checkmarkDraw {
  from {
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
  }
  to {
    stroke-dasharray: 100;
    stroke-dashoffset: 0;
  }
}

/* Estilos do conteúdo do Offcanvas */
.offcanvas-content {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

/* Header do detalhe */
.detail-header {
  background: #2b2522;
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  position: relative;
}

.detail-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.detail-id {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.detail-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-active {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.badge-inactive {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Seções de detalhe */
.detail-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #1f2937;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

/* Grid de detalhes */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  font-size: 14px;
  color: #1f2937;
}

/* Status */
.status-active {
  color: #10b981;
  font-weight: 600;
}

.status-inactive {
  color: #ef4444;
  font-weight: 600;
}

/* Descrição */
.detail-description {
  font-size: 14px;
  line-height: 1.6;
  color: #4b5563;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

/* Preview do SQL */
.sql-preview {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #cbd5e1;
}

.sql-preview-text {
  margin: 0 0 16px 0;
  color: #64748b;
  font-size: 14px;
}

/* Modal do SQL */
.sql-modal-content {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.sql-info {
  padding: 16px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 16px;
}

.sql-info h4 {
  margin: 0 0 8px 0;
  color: #1e293b;
}

.sql-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #64748b;
}

.sql-code-container {
  flex: 1;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.sql-code-formatted {
  background: #1e293b;
  color: #e2e8f0;
  padding: 20px;
  margin: 0;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow: auto;
  white-space: pre;
  max-height: 400px;
}

.sql-modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 0 0 0;
  margin-top: 16px;
  border-top: 1px solid #e2e8f0;
}

/* Estilos para a nova seção de análise no Offcanvas */
.loading-analysis {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: #64748b;
}

.no-analysis {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  color: #64748b;
}

.gemini-result-offcanvas {
  margin-top: 16px;
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  padding: 16px;
  border-radius: 8px;
}

.gemini-title-offcanvas {
  margin: 0 0 8px 0;
  color: #1e40af;
  font-size: 16px;
}

.gemini-result-offcanvas p {
  margin: 0;
  line-height: 1.6;
  color: #1d4ed8;
}

/* Estilos para Observações */
.observations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.observation-item {
  background: #f8fafc;
  border-left: 3px solid #667eea;
  padding: 12px;
  border-radius: 6px;
}

.observation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
}

.observation-author {
  font-weight: 600;
  color: #1e293b;
  font-size: 13px;
}

.observation-date {
  font-size: 12px;
  color: #64748b;
}

.observation-text {
  color: #334155;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.no-observations {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 6px;
  color: #64748b;
  font-size: 14px;
  margin-bottom: 20px;
}

.no-observations p {
  margin: 0;
}

.loading-observations {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #64748b;
  margin-bottom: 20px;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 3px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.observation-form {
  background: #ffffff;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 16px;
  margin-top: 24px;
}

.form-subtitle {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.observations-list::-webkit-scrollbar {
  width: 6px;
}

.observations-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.observations-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.observations-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.observation-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.observation-textarea {
  resize: none;
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
  min-height: 80px;
  max-height: 300px;
  overflow-y: auto;
  transition:
    border-color 0.2s,
    height 0.1s ease;
}

.observation-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.observation-textarea::placeholder {
  resize: none;
  color: #9ca3af;
}

.observation-actions {
  display: right;
  justify-content: right;
  margin-top: 1px;
  padding-top: 16px;
  border-top: none;
}

.observation-actions :deep(.v-button) {
  min-width: 180px;
  font-weight: 600;
  padding: 12px 24px;
  font-size: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.observation-actions :deep(.v-button::before) {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.observation-actions :deep(.v-button:hover:not(:disabled)) {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.observation-actions :deep(.v-button:hover:not(:disabled)::before) {
  left: 100%;
}

.observation-actions :deep(.v-button:active:not(:disabled)) {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.4);
}

.observation-actions :deep(.v-button:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
  box-shadow: none;
}

.save-feedback {
  color: #10b981;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsividade */
@media (max-width: 768px) {
  .table-filter-container {
    padding: 24px 20px;
  }

  .filter-title {
    font-size: 22px;
  }

  .filter-description {
    font-size: 13px;
  }

  .table-tabs {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .table-tab {
    padding: 20px 16px;
  }

  .tab-icon {
    width: 40px;
    height: 40px;
  }

  .tab-title {
    font-size: 16px;
  }

  .tab-subtitle {
    font-size: 11px;
  }

  .tab-active-indicator {
    width: 24px;
    height: 24px;
  }

  .tab-active-indicator svg {
    width: 16px;
    height: 16px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .sql-modal-footer {
    flex-direction: column;
  }
}

/* Scrollbar customizada */
.offcanvas-content::-webkit-scrollbar,
.sql-code-formatted::-webkit-scrollbar {
  width: 8px;
}

.offcanvas-content::-webkit-scrollbar-track,
.sql-code-formatted::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.offcanvas-content::-webkit-scrollbar-thumb,
.sql-code-formatted::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.offcanvas-content::-webkit-scrollbar-thumb:hover,
.sql-code-formatted::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

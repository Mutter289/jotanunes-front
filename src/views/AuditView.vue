<template>
  <div class="audit">
    <VSelect
      v-model="tableActive"
      label="Tabelas"
      placeholder="Selecione a tabela"
      :options="listTable"
      option-label="text"
      option-value="value"
      style="flex: 1"
      @change="onTableChange"
    />
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
import { useFetch } from '@/hooks/useFetch'

export default {
  components: { VSelect, VTable, VOffcanvas, VModal, VButton },
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

    async handleRowClick(row) {
      console.log('Linha clicada:', row)
      this.selectedRow = row
      this.selectedRowId = this.getRowId(row)
      this.showOffcanvas = true

      // Carregar detalhes específicos se necessário
      const rowId = this.getRowId(row)
      if (rowId) {
        await this.loadRowDetails(rowId)
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

        // Remove do array local
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
  gap: 15px;
  margin-left: 20px;
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

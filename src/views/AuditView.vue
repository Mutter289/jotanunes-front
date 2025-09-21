<template>
  <div class="audit">
    <VTable
      @row-click="handleRowClick"
      @selection-change="handleSelection"
      @action="handleAction"
      search-placeholder="Buscar pelo código SQL, usuário e data"
      :data="tableData"
      :columns="col"
      :searchable="true"
      :selectable="true"
      :paginate="true"
      :page-size="10"
      :row-key="'RECID'"
    />

    <!-- Offcanvas com dados da linha selecionada -->
    <VOffcanvas
      v-model="showOffcanvas"
      side="right"
      width="900px"
      :title="`Detalhes - ${selectedRow?.NOME || 'Carregando...'}`"
    >
      <!-- Conteúdo do Offcanvas -->
      <div v-if="selectedRow" class="offcanvas-content">
        <!-- Header com informações principais -->
        <div class="detail-header">
          <div
            class="detail-badge"
            :class="selectedRow.ATIVO === 'Ativado' ? 'badge-active' : 'badge-inactive'"
          >
            {{ selectedRow.ATIVO }}
          </div>
          <h2>{{ selectedRow.NOME }}</h2>
          <p class="detail-id">ID: {{ selectedRow.RECID }}</p>
        </div>

        <!-- Seção de Informações Gerais -->
        <div class="detail-section">
          <h3 class="section-title">Informações Gerais</h3>
          <div class="detail-grid">
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
              <span :class="selectedRow.ATIVO === 'Ativado' ? 'status-active' : 'status-inactive'">
                {{ selectedRow.ATIVO }}
              </span>
            </div>
            <div class="detail-item">
              <label>Modificado por:</label>
              <span>{{ selectedRow.RECMODIFIEDBY || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Seção de Descrição -->
        <div class="detail-section">
          <h3 class="section-title">Descrição</h3>
          <div class="detail-description">
            {{ selectedRow.DESCRICAO || 'Sem descrição disponível' }}
          </div>
        </div>

        <!-- Seção de Código SQL (se existir) -->
        <div v-if="selectedRow.SQL_CODE" class="detail-section">
          <h3 class="section-title">Código SQL</h3>
          <pre class="sql-code">{{ selectedRow.SQL_CODE }}</pre>
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
            <div class="detail-item" v-if="selectedRow.RECMODIFIEDON">
              <label>Última Modificação:</label>
              <span>{{ formatDate(selectedRow.RECMODIFIEDON) }}</span>
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
  </div>
</template>

<script>
import VTable from '@/components/Table/VTable.vue'
import VOffcanvas from '@/components/Offcanvas/VOffcanvas.vue'
import { useFetch } from '@/hooks/useFetch'

export default {
  name: 'AuditLog',
  components: { VTable, VOffcanvas },
  data() {
    return {
      showOffcanvas: false,
      selectedRow: null,
      selectedRowId: null,
      col: [
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
      tableData: [],
    }
  },
  methods: {
    useFetch,

    async getAudit() {
      try {
        const json = (await this.useFetch('/audfv/')) || []
        this.tableData = json
          .filter((item) => item != null)
          .map((item) => ({
            ...item,
            RECID: item.RECID || item.ID || item.id,
            ATIVO: item.ATIVO ? 'Ativado' : 'Desativado',
          }))
        console.log('Dados carregados:', this.tableData)
      } catch (e) {
        console.error('Erro ao carregar dados:', e)
        this.$toast?.error('Erro ao carregar dados da auditoria')
      }
    },

    async handleRowClick(row) {
      console.log('Linha clicada:', row)

      // Armazena a linha selecionada
      this.selectedRow = row
      this.selectedRowId = row.RECID

      // Abre o offcanvas
      this.showOffcanvas = true

      // Opcionalmente, buscar mais detalhes do backend
      if (row.RECID) {
        await this.loadRowDetails(row.RECID)
      }
    },

    async loadRowDetails(id) {
      try {
        // Buscar detalhes completos do registro se necessário
        const details = await this.useFetch(`/audfv/${id}`)
        if (details) {
          // Atualiza os dados da linha selecionada com detalhes completos
          this.selectedRow = {
            ...this.selectedRow,
            ...details,
            ATIVO: details.ATIVO ? 'Ativado' : 'Desativado',
          }
        }
      } catch (e) {
        console.error('Erro ao carregar detalhes:', e)
      }
    },

    handleSelection(selected) {
      console.log('Linhas selecionadas:', selected)
      // Você pode armazenar as linhas selecionadas para ações em lote
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

    // Métodos de ação
    editRow(row) {
      const targetRow = row || this.selectedRow
      console.log('Editando linha:', targetRow)
      // Implementar lógica de edição
      // this.$router.push(`/audit/edit/${targetRow.RECID}`)
    },

    duplicateRow() {
      console.log('Duplicando linha:', this.selectedRow)
      // Implementar lógica de duplicação
    },

    async deleteRow(row) {
      const targetRow = row || this.selectedRow

      if (!confirm(`Deseja realmente excluir o registro "${targetRow.NOME}"?`)) {
        return
      }

      try {
        await this.useFetch(`/audfv/${targetRow.RECID}`, {
          method: 'DELETE',
        })

        // Remove do array local
        const index = this.tableData.findIndex((item) => item.RECID === targetRow.RECID)
        if (index > -1) {
          this.tableData.splice(index, 1)
        }

        // Fecha o offcanvas
        this.showOffcanvas = false
        this.selectedRow = null

        this.$toast?.success('Registro excluído com sucesso')
      } catch (e) {
        console.error('Erro ao excluir:', e)
        this.$toast?.error('Erro ao excluir registro')
      }
    },

    // Formatação de datas
    formatDate(dateString) {
      if (!dateString) return 'N/A'

      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR')
      } catch {
        return dateString
      }
    },

    // Método para atualizar os dados
    async refreshData() {
      await this.getAudit()
    },
  },

  created() {
    this.getAudit()
  },

  // Limpar ao destruir o componente
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

/* Código SQL */
.sql-code {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 6px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Ações do Offcanvas */
.offcanvas-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  margin-top: auto;
  background: white;
  position: sticky;
  bottom: 0;
}

/* Botões */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-secondary {
  background: #e5e7eb;
  color: #4b5563;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
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

  .offcanvas-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

/* Scrollbar customizada */
.offcanvas-content::-webkit-scrollbar {
  width: 8px;
}

.offcanvas-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.offcanvas-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.offcanvas-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
